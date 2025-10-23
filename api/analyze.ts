import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ghfywkldzzgpyoxkiydt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Make.com webhook URLs
const WEBHOOKS = {
  model1: 'https://hook.us2.make.com/mio87mwc00gx78v2wo1ex41xwzhrmpd5',
  model2: 'https://hook.us2.make.com/632ia2fn81ycsukbgc1qnkbgfoitq2dc',
  model3: 'https://hook.us2.make.com/832gwe0qrpvrdxa1ktt7xb3nwwe7vnpb',
  model4: 'https://hook.us2.make.com/ee8yx5gny4wg158ypnsjx869jijk84rz',
  timeline: 'https://hook.us2.make.com/oz2vahabhwhxutwohwpkoxtkaaym3nxa',
  insights: 'https://hook.us2.make.com/sv2tup1yq1hddwnolhhngv67f8jttynh',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_url, user_id } = req.body;

    if (!event_url) {
      return res.status(400).json({ error: 'Missing event_url' });
    }

    // Validate Polymarket URL
    if (!event_url.includes('polymarket.com')) {
      return res.status(400).json({ error: 'Invalid Polymarket URL' });
    }

    console.log('[Analyze] Starting analysis for:', event_url);

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        event_url,
        user_id: user_id || null,
        status: 'processing',
      })
      .select()
      .single();

    if (analysisError) {
      console.error('[Analyze] Failed to create analysis:', analysisError);
      return res.status(500).json({ 
        error: 'Failed to create analysis', 
        details: analysisError.message 
      });
    }

    const analysisId = analysis.id;
    console.log('[Analyze] Created analysis:', analysisId);

    // Create pending records for all predictions
    const modelNames = ['model1', 'model2', 'model3', 'model4'];
    const predictionRecords = modelNames.map(modelName => ({
      analysis_id: analysisId,
      model_name: modelName,
      status: 'pending',
    }));

    const { error: predictionsError } = await supabase
      .from('model_predictions')
      .insert(predictionRecords);

    if (predictionsError) {
      console.error('[Analyze] Failed to create predictions:', predictionsError);
    }

    // Create pending timeline record
    const { error: timelineError } = await supabase
      .from('timelines')
      .insert({
        analysis_id: analysisId,
        status: 'pending',
      });

    if (timelineError) {
      console.error('[Analyze] Failed to create timeline:', timelineError);
    }

    // Create pending insights record
    const { error: insightsError } = await supabase
      .from('insights')
      .insert({
        analysis_id: analysisId,
        status: 'pending',
      });

    if (insightsError) {
      console.error('[Analyze] Failed to create insights:', insightsError);
    }

    // Trigger all webhooks in parallel
    const webhookRequests = [
      // Model predictions
      ...modelNames.map(modelName =>
        fetch(WEBHOOKS[modelName as keyof typeof WEBHOOKS], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_id: analysisId,
            event_url,
            callback_url: `https://polyradar.io/api/webhooks/predictions/${modelName}`,
          }),
        }).catch(err => {
          console.error(`[Analyze] Failed to trigger ${modelName}:`, err);
          return null;
        })
      ),
      // Timeline
      fetch(WEBHOOKS.timeline, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          event_url,
          callback_url: 'https://polyradar.io/api/webhooks/timeline',
        }),
      }).catch(err => {
        console.error('[Analyze] Failed to trigger timeline:', err);
        return null;
      }),
      // Insights
      fetch(WEBHOOKS.insights, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          event_url,
          callback_url: 'https://polyradar.io/api/webhooks/insights',
        }),
      }).catch(err => {
        console.error('[Analyze] Failed to trigger insights:', err);
        return null;
      }),
    ];

    // Wait for all webhooks to be triggered (but don't wait for responses)
    await Promise.allSettled(webhookRequests);

    console.log('[Analyze] All webhooks triggered for analysis:', analysisId);

    return res.status(200).json({
      success: true,
      analysis_id: analysisId,
      message: 'Analysis started successfully',
    });

  } catch (error: any) {
    console.error('[Analyze] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

