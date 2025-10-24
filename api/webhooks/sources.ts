import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ghfywkldzzgpyoxkiydt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('[Webhook] Received sources:', body);

    const { analysis_id, links } = body;
    
    if (!analysis_id) {
      return res.status(400).json({ 
        error: 'Missing required field: analysis_id' 
      });
    }

    if (!links || !Array.isArray(links)) {
      return res.status(400).json({ 
        error: 'Missing or invalid field: links (must be an array)' 
      });
    }

    const sourcesData: any = {
      analysis_id,
      links,
      status: 'success',
      completed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sources')
      .upsert(sourcesData, {
        onConflict: 'analysis_id',
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

    console.log('[Webhook] Sources saved:', data);

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

