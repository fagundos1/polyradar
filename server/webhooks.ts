import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const webhooksRouter = Router();

// Ленивая инициализация Supabase клиента
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Endpoint для приема результатов анализа от Make.com
 * POST /api/webhooks/analysis-result
 */
webhooksRouter.post('/analysis-result', async (req, res) => {
  try {
    const {
      analysis_id,
      predictions,
      timeline,
      insights,
      status = 'completed'
    } = req.body;

    // Валидация обязательных полей
    if (!analysis_id) {
      return res.status(400).json({ error: 'analysis_id is required' });
    }

    // Обновляем анализ в базе данных
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

    res.json({ success: true, analysis_id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Endpoint для обработки ошибок анализа
 * POST /api/webhooks/analysis-error
 */
webhooksRouter.post('/analysis-error', async (req, res) => {
  try {
    const { analysis_id, error_message } = req.body;

    if (!analysis_id) {
      return res.status(400).json({ error: 'analysis_id is required' });
    }

    // Обновляем статус анализа на failed
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

    res.json({ success: true, analysis_id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

