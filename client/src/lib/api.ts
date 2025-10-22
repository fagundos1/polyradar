import { supabase } from './supabase';
import type { Analysis, Prediction, TimelineEvent, Insight } from './supabase';

export interface CreateAnalysisParams {
  walletAddress: string;
  polymarketUrl: string;
}

export interface AnalysisResult {
  predictions: Prediction[];
  timeline: TimelineEvent[];
  insights: Insight[];
}

/**
 * Создает новый анализ и списывает токены
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

  // Временно отключено для тестирования
  // Проверяем баланс
  // if (user.radar_balance < 100) {
  //   throw new Error('Insufficient RADAR balance');
  // }

  // Списываем токены
  // const { error: updateError } = await supabase
  //   .from('users')
  //   .update({ radar_balance: user.radar_balance - 100 })
  //   .eq('wallet_address', walletAddress);

  // if (updateError) {
  //   throw new Error('Failed to deduct tokens');
  // }

  // Создаем запись анализа
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      polymarket_url: polymarketUrl,
      status: 'pending',
      tokens_spent: 100,
    })
    .select()
    .single();

  if (analysisError || !analysis) {
    console.error('Error creating analysis:', analysisError);
    throw new Error('Failed to create analysis');
  }

  // Создаем транзакцию
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'spend',
    amount: -100,
    description: `Analysis for ${polymarketUrl}`,
  });

  // Отправляем webhook на Make.com для анализа
  try {
    const webhookUrl = 'https://hook.us2.make.com/mio87mwc00gx78v2wo1ex41xwzhrmpd5';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        polymarket_url: polymarketUrl,
        analysis_id: analysis.id,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send webhook:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
    // Не прерываем выполнение, если webhook не отправился
  }

  return analysis.id;
}

/**
 * Обновляет статус анализа
 */
export async function updateAnalysisStatus(
  analysisId: string,
  status: 'analyzing' | 'completed' | 'failed'
): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .update({ 
      status,
      ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {})
    })
    .eq('id', analysisId);

  if (error) {
    throw new Error('Failed to update analysis status');
  }
}

/**
 * Сохраняет результаты анализа
 */
export async function saveAnalysisResults(
  analysisId: string,
  results: AnalysisResult
): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .update({
      status: 'completed',
      predictions: results.predictions,
      timeline: results.timeline,
      insights: results.insights,
      completed_at: new Date().toISOString(),
    })
    .eq('id', analysisId);

  if (error) {
    throw new Error('Failed to save analysis results');
  }
}

/**
 * Получает анализ по ID
 */
export async function getAnalysis(analysisId: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }

  return data;
}

/**
 * Получает все анализы пользователя
 */
export async function getUserAnalyses(walletAddress: string): Promise<Analysis[]> {
  // Сначала получаем user_id
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

/**
 * Возвращает токены пользователю (в случае ошибки анализа)
 */
export async function refundTokens(walletAddress: string, amount: number): Promise<void> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ radar_balance: user.radar_balance + amount })
    .eq('wallet_address', walletAddress);

  if (updateError) {
    throw new Error('Failed to refund tokens');
  }

  // Создаем транзакцию возврата
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'refund',
    amount: amount,
    description: 'Refund for failed analysis',
  });
}

