import { createClient } from '@supabase/supabase-js';

/**
 * Extract event title from Polymarket URL
 */
function extractEventTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract slug from URL (part between /event/ and number at the end)
    const match = pathname.match(/\/event\/([^?]+)/);
    if (!match) return null;
    
    let slug = match[1];
    
    // Remove number at the end (e.g., -638)
    slug = slug.replace(/-\d+$/, '');
    
    // Replace dashes with spaces and capitalize first letter of each word
    const title = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return title;
  } catch (error) {
    console.error('Error extracting title from URL:', error);
    return null;
  }
}

const WEBHOOK_URLS = {
  model1: 'https://hook.us2.make.com/mio87mwc00gx78v2wo1ex41xwzhrmpd5',
  model2: 'https://hook.us2.make.com/632ia2fn81ycsukbgc1qnkbgfoitq2dc',
  model3: 'https://hook.us2.make.com/832gwe0qrpvrdxa1ktt7xb3nwwe7vnpb',
  model4: 'https://hook.us2.make.com/ee8yx5gny4wg158ypnsjx869jijk84rz',
  timeline: 'https://hook.us2.make.com/oz2vahabhwhxutwohwpkoxtkaaym3nxa',
  insights: 'https://hook.us2.make.com/sv2tup1yq1hddwnolhhngv67f8jttynh',
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_url, user_id } = req.body;

    if (!event_url) {
      return res.status(400).json({ error: 'event_url is required' });
    }

    // Extract event title from URL
    const eventTitle = extractEventTitleFromUrl(event_url);
    console.log('Extracted event title:', eventTitle, 'from URL:', event_url);

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Debug environment variables
    console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test Supabase connection first
    const { data: testData, error: testError } = await supabase
      .from('analyses')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: testError.message 
      });
    }

    console.log('Supabase connection successful');

           // Create analysis record
           const { data: analysis, error: analysisError } = await supabase
             .from('analyses')
             .insert({
               user_id: user_id || null,
               polymarket_url: event_url,
               event_title: eventTitle,
               status: 'analyzing',
             })
             .select()
             .single();

    if (analysisError) {
      console.error('Error creating analysis:', analysisError);
      return res.status(500).json({ 
        error: 'Failed to create analysis', 
        details: analysisError.message 
      });
    }

    const analysis_id = analysis.id;

    // Create pending prediction records
    const predictions = ['model1', 'model2', 'model3', 'model4'].map(model => ({
      analysis_id,
      model_name: model,
      status: 'pending',
    }));

    await supabase.from('model_predictions').insert(predictions);

    // Create pending timeline record
    await supabase.from('timelines').insert({
      analysis_id,
      status: 'pending',
    });

    // Create pending insights record
    await supabase.from('insights').insert({
      analysis_id,
      status: 'pending',
    });

    // Trigger all webhooks in parallel
    const webhookPromises = [];

    // Trigger model webhooks
    for (const [model, url] of Object.entries(WEBHOOK_URLS)) {
      if (model.startsWith('model')) {
        webhookPromises.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis_id,
              event_url: event_url,
              callback_url: `https://www.polyradar.io/api/webhooks/predictions/${model}`,
            }),
          }).catch(err => console.error(`Error triggering ${model}:`, err))
        );
      }
    }

    // Trigger timeline webhook
    webhookPromises.push(
      fetch(WEBHOOK_URLS.timeline, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id,
          event_url: event_url,
          callback_url: 'https://www.polyradar.io/api/webhooks/timeline',
        }),
      }).catch(err => console.error('Error triggering timeline:', err))
    );

    // Trigger insights webhook
    webhookPromises.push(
      fetch(WEBHOOK_URLS.insights, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id,
          event_url: event_url,
          callback_url: 'https://www.polyradar.io/api/webhooks/insights',
        }),
      }).catch(err => console.error('Error triggering insights:', err))
    );

    // Wait for all webhooks to be triggered (don't wait for responses)
    await Promise.allSettled(webhookPromises);

    return res.status(200).json({
      success: true,
      analysis_id,
      message: 'Analysis started successfully',
    });
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}