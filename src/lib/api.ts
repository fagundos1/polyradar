import { supabase } from './supabase';
import type { Analysis, ModelPrediction, Timeline, Insights } from './supabase';

export interface CreateAnalysisParams {
  walletAddress: string;
  polymarketUrl: string;
}

/**
 * Создает новый анализ и запускает обработку через webhooks
 */
export async function createAnalysis(params: CreateAnalysisParams): Promise<string> {
  const { walletAddress, polymarketUrl } = params;

  // Получаем пользователя
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  // Если пользователь не найден, создаем его
  let userId: string;
  if (userError || !user) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        radar_balance: 500,
        free_searches_used: 0,
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error('Error creating user:', createError);
      throw new Error('Failed to create user');
    }
    userId = newUser.id;
  } else {
    userId = user.id;
  }

  // Вызываем API endpoint для создания анализа и запуска webhooks
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_url: polymarketUrl,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let error;
    
    if (contentType && contentType.includes('application/json')) {
      error = await response.json();
    } else {
      const errorText = await response.text();
      error = { error: errorText || 'Failed to start analysis' };
    }
    
    throw new Error(error.error || 'Failed to start analysis');
  }

  const contentType = response.headers.get('content-type');
  let result;
  
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Unexpected response format: ${text.substring(0, 100)}`);
  }
  
  // Создаем транзакцию
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'spend',
    amount: -100,
    description: `Analysis for ${polymarketUrl}`,
  });

  return result.analysis_id;
}

/**
 * Получает анализ по ID со всеми связанными данными
 */
export async function getAnalysisWithResults(analysisId: string) {
  // Получаем основной анализ
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (analysisError) {
    console.error('Error fetching analysis:', analysisError);
    throw new Error('Failed to fetch analysis');
  }

  // Получаем предсказания моделей
  const { data: predictions, error: predictionsError } = await supabase
    .from('model_predictions')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('model_name');

  if (predictionsError) {
    console.error('Error fetching predictions:', predictionsError);
  }

  // Получаем timeline
  const { data: timeline, error: timelineError } = await supabase
    .from('timelines')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (timelineError && timelineError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching timeline:', timelineError);
  }

  // Получаем insights
  const { data: insights, error: insightsError } = await supabase
    .from('insights')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (insightsError && insightsError.code !== 'PGRST116') {
    console.error('Error fetching insights:', insightsError);
  }

  return {
    analysis,
    predictions: predictions || [],
    timeline: timeline || null,
    insights: insights || null,
  };
}

/**
 * Подписка на изменения анализа в реальном времени
 */
export function subscribeToAnalysis(
  analysisId: string,
  callback: (data: {
    analysis?: Analysis;
    predictions?: ModelPrediction[];
    timeline?: Timeline;
    insights?: Insights;
  }) => void
) {
  // Подписка на изменения в predictions
  const predictionsChannel = supabase
    .channel(`predictions:${analysisId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'model_predictions',
        filter: `analysis_id=eq.${analysisId}`,
      },
      async () => {
        const { data } = await supabase
          .from('model_predictions')
          .select('*')
          .eq('analysis_id', analysisId);
        callback({ predictions: data || [] });
      }
    )
    .subscribe();

  // Подписка на изменения в timeline
  const timelineChannel = supabase
    .channel(`timeline:${analysisId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'timelines',
        filter: `analysis_id=eq.${analysisId}`,
      },
      async () => {
        const { data } = await supabase
          .from('timelines')
          .select('*')
          .eq('analysis_id', analysisId)
          .single();
        callback({ timeline: data || undefined });
      }
    )
    .subscribe();

  // Подписка на изменения в insights
  const insightsChannel = supabase
    .channel(`insights:${analysisId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'insights',
        filter: `analysis_id=eq.${analysisId}`,
      },
      async () => {
        const { data } = await supabase
          .from('insights')
          .select('*')
          .eq('analysis_id', analysisId)
          .single();
        callback({ insights: data || undefined });
      }
    )
    .subscribe();

  // Подписка на изменения в analyses
  const analysisChannel = supabase
    .channel(`analysis:${analysisId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'analyses',
        filter: `id=eq.${analysisId}`,
      },
      async () => {
        const { data } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', analysisId)
          .single();
        callback({ analysis: data || undefined });
      }
    )
    .subscribe();

  // Возвращаем функцию для отписки
  return () => {
    predictionsChannel.unsubscribe();
    timelineChannel.unsubscribe();
    insightsChannel.unsubscribe();
    analysisChannel.unsubscribe();
  };
}

/**
 * Получает все анализы пользователя
 */
export async function getUserAnalyses(walletAddress: string): Promise<Analysis[]> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user analyses:', error);
    return [];
  }

  return data || [];
}

