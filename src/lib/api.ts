import { supabase } from './supabase';
import type { Analysis, ModelPrediction, Timeline, Insights, Sources } from './supabase';

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
  console.log('[getAnalysisWithResults] Fetching data for:', analysisId);

  // Test Supabase connection first
  try {
    const { data: testData, error: testError } = await supabase
      .from('analyses')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('[getAnalysisWithResults] Supabase connection test failed:', testError);
      throw new Error('Supabase connection failed');
    }
    
    console.log('[getAnalysisWithResults] Supabase connection successful');
  } catch (error) {
    console.error('[getAnalysisWithResults] Supabase connection error:', error);
    throw error;
  }

  // Получаем основной анализ
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (analysisError) {
    console.error('[getAnalysisWithResults] Error fetching analysis:', analysisError);
    throw new Error('Failed to fetch analysis');
  }

  console.log('[getAnalysisWithResults] Analysis found:', analysis?.status);

  // Получаем предсказания моделей
  const { data: predictions, error: predictionsError } = await supabase
    .from('model_predictions')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('model_name');

  if (predictionsError) {
    console.error('[getAnalysisWithResults] Error fetching predictions:', predictionsError);
  }

  console.log('[getAnalysisWithResults] Predictions found:', predictions?.length || 0);

  // Получаем timeline
  const { data: timeline, error: timelineError } = await supabase
    .from('timelines')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (timelineError && timelineError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('[getAnalysisWithResults] Error fetching timeline:', timelineError);
  }

  console.log('[getAnalysisWithResults] Timeline found:', timeline?.status || 'not found');

  // Получаем insights
  const { data: insights, error: insightsError } = await supabase
    .from('insights')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (insightsError && insightsError.code !== 'PGRST116') {
    console.error('[getAnalysisWithResults] Error fetching insights:', insightsError);
  }

  console.log('[getAnalysisWithResults] Insights found:', insights?.status || 'not found');

  // Получаем sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (sourcesError && sourcesError.code !== 'PGRST116') {
    console.error('[getAnalysisWithResults] Error fetching sources:', sourcesError);
  }

  console.log('[getAnalysisWithResults] Sources found:', sources?.status || 'not found');

  const result = {
    analysis,
    predictions: predictions || [],
    timeline: timeline || null,
    insights: insights || null,
    sources: sources || null,
  };

  console.log('[getAnalysisWithResults] Returning data:', {
    analysisStatus: result.analysis?.status,
    predictionsCount: result.predictions.length,
    timelineStatus: result.timeline?.status,
    insightsStatus: result.insights?.status,
    sourcesStatus: result.sources?.status
  });

  return result;
}

/**
 * Подписка на изменения анализа в реальном времени (с fallback на polling)
 */
export function subscribeToAnalysis(
  analysisId: string,
  callback: (data: {
    analysis?: Analysis;
    predictions?: ModelPrediction[];
    timeline?: Timeline;
    insights?: Insights;
    sources?: Sources;
  }) => void
) {
  console.log('[subscribeToAnalysis] Setting up subscriptions for:', analysisId);
  
  let pollingInterval: NodeJS.Timeout | null = null;
  let isUnsubscribed = false;

  // Функция для обновления данных
  const updateData = async () => {
    if (isUnsubscribed) return;
    
    try {
      console.log('[subscribeToAnalysis] Polling for updates...', analysisId);
      const data = await getAnalysisWithResults(analysisId);
      console.log('[subscribeToAnalysis] Polling data received:', {
        predictionsCount: data.predictions.length,
        completedPredictions: data.predictions.filter(p => p.status === 'success').length,
        timelineStatus: data.timeline?.status,
        insightsStatus: data.insights?.status
      });
      callback({
        predictions: data.predictions,
        timeline: data.timeline,
        insights: data.insights,
        sources: data.sources
      });
    } catch (error) {
      console.error('[subscribeToAnalysis] Polling error:', error);
    }
  };

  // Настраиваем polling каждые 2 секунды
  pollingInterval = setInterval(updateData, 2000);
  
  // Вызываем updateData немедленно
  updateData();

  // Попробуем также настроить real-time подписки
  try {
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
        async (payload) => {
          console.log('[subscribeToAnalysis] Predictions event received:', payload);
          await updateData();
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
        async (payload) => {
          console.log('[subscribeToAnalysis] Timeline event received:', payload);
          await updateData();
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
        async (payload) => {
          console.log('[subscribeToAnalysis] Insights event received:', payload);
          await updateData();
        }
      )
      .subscribe();

    // Подписка на изменения в sources
    const sourcesChannel = supabase
      .channel(`sources:${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sources',
          filter: `analysis_id=eq.${analysisId}`,
        },
        async (payload) => {
          console.log('[subscribeToAnalysis] Sources event received:', payload);
          await updateData();
        }
      )
      .subscribe();

    // Возвращаем функцию для отписки
    return () => {
      console.log('[subscribeToAnalysis] Unsubscribing...');
      isUnsubscribed = true;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      predictionsChannel.unsubscribe();
      timelineChannel.unsubscribe();
      insightsChannel.unsubscribe();
      sourcesChannel.unsubscribe();
    };
  } catch (error) {
    console.error('[subscribeToAnalysis] Error setting up real-time subscriptions:', error);
    // Если real-time не работает, используем только polling
    return () => {
      console.log('[subscribeToAnalysis] Unsubscribing (polling only)...');
      isUnsubscribed = true;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }
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

