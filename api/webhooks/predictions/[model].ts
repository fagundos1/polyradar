import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ghfywkldzzgpyoxkiydt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model } = req.query;
    const body = req.body;

    console.log(`[Webhook] Received prediction from ${model}:`, body);

    // Validate required fields
    const { analysis_id, model_name, status } = body;
    
    if (!analysis_id || !model_name || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: analysis_id, model_name, status' 
      });
    }

    // Prepare data for database
    const predictionData: any = {
      analysis_id,
      model_name,
      status,
      completed_at: new Date().toISOString(),
      raw_response: body,
    };

    // Add optional fields if present
    if (body.outcome) predictionData.outcome = body.outcome;
    if (body.confidence_percent !== undefined) predictionData.confidence_percent = body.confidence_percent;
    if (body.reasoning) predictionData.reasoning = body.reasoning;
    if (body.sources_count !== undefined) predictionData.sources_count = body.sources_count;
    if (body.error) predictionData.error = body.error;

    // Upsert prediction (insert or update if exists)
    const { data, error } = await supabase
      .from('model_predictions')
      .upsert(predictionData, {
        onConflict: 'analysis_id,model_name',
      })
      .select()
      .single();

    if (error) {
      console.error('[Webhook] Database error:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
    }

    console.log('[Webhook] Prediction saved:', data);

    return res.status(200).json({ 
      success: true, 
      data 
    });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

