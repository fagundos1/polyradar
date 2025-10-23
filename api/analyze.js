import { createClient } from '@supabase/supabase-js';

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

    // Debug environment variables
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

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
        event_url: event_url,
        status: 'processing',
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
              callback_url: `https://polyradar.io/api/webhooks/predictions/${model}`,
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
          callback_url: 'https://polyradar.io/api/webhooks/timeline',
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
          callback_url: 'https://polyradar.io/api/webhooks/insights',
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