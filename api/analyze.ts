import type { Request, Response } from 'express';
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

/**
 * Извлекает название события из Polymarket URL
 * Пример: https://polymarket.com/event/what-will-be-the-top-global-netflix-movie-this-week-638
 * Результат: "What will be the top global Netflix movie this week?"
 */
function extractEventTitleFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Извлекаем slug из URL (часть между /event/ и номером в конце)
    const match = pathname.match(/\/event\/([^?]+)/);
    if (!match) return null;
    
    let slug = match[1];
    
    // Убираем номер в конце (например, -638)
    slug = slug.replace(/-\d+$/, '');
    
    // Заменяем дефисы на пробелы и делаем первую букву каждого слова заглавной
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

/**
 * Endpoint для создания анализа
 * POST /api/analyze
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_url, user_id } = req.body;

    // Валидация обязательных полей
    if (!event_url || !user_id) {
      return res.status(400).json({ error: 'event_url and user_id are required' });
    }

    // Извлекаем название события из URL
    const eventTitle = extractEventTitleFromUrl(event_url);

    // Создаем анализ в базе данных
    const supabase = getSupabaseClient();
    const { data: analysis, error } = await supabase
      .from('analyses')
      .insert({
        user_id,
        polymarket_url: event_url,
        event_title: eventTitle,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating analysis:', error);
      return res.status(500).json({ error: 'Failed to create analysis' });
    }

    console.log('Analysis created:', analysis.id, 'Title:', eventTitle);

    // Возвращаем ID созданного анализа
    res.json({ 
      success: true, 
      analysis_id: analysis.id,
      event_title: eventTitle
    });
  } catch (error) {
    console.error('Analyze endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

