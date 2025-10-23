import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Ленивая инициализация Supabase клиента
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = req.url?.split('/api/webhooks')[1] || '';

  try {
    // Обработка успешного анализа
    if (path === '/analysis-result') {
      const {
        analysis_id,
        predictions,
        timeline,
        insights,
        status = 'completed'
      } = req.body;

      if (!analysis_id) {
        return res.status(400).json({ error: 'analysis_id is required' });
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('analyses')
        .update({
          status,
          predictions: predictions || null,
          timeline: timeline || null,
          insights: insights || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id);

      if (error) {
        console.error('Error updating analysis:', error);
        return res.status(500).json({ error: 'Failed to update analysis' });
      }

      return res.json({ success: true, analysis_id });
    }

    // Обработка ошибки анализа
    if (path === '/analysis-error') {
      const { analysis_id, error_message } = req.body;

      if (!analysis_id) {
        return res.status(400).json({ error: 'analysis_id is required' });
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('analyses')
        .update({
          status: 'failed',
          error_message: error_message || 'Analysis failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id);

      if (error) {
        console.error('Error updating analysis:', error);
        return res.status(500).json({ error: 'Failed to update analysis' });
      }

      return res.json({ success: true, analysis_id });
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

