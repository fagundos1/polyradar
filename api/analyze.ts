import { createClient } from '@supabase/supabase-js';

/**
 * Извлекает название события из Polymarket URL
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
 * Serverless function для создания анализа
 * POST /api/analyze
 */
export default async function handler(req: any, res: any) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_url, user_id } = req.body;

    // Валидация обязательных полей
    if (!event_url || !user_id) {
      console.error('Missing required fields:', { event_url, user_id });
      return res.status(400).json({ error: 'event_url and user_id are required' });
    }

    // Извлекаем название события из URL
    const eventTitle = extractEventTitleFromUrl(event_url);
    console.log('Extracted event title:', eventTitle, 'from URL:', event_url);

    // Создаем Supabase клиент
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Создаем анализ в базе данных
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
      return res.status(500).json({ error: 'Failed to create analysis', details: error.message });
    }

    console.log('Analysis created successfully:', analysis.id, 'Title:', eventTitle);

    // Возвращаем ID созданного анализа
    return res.status(200).json({ 
      success: true, 
      analysis_id: analysis.id,
      event_title: eventTitle
    });
  } catch (error: any) {
    console.error('Analyze endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

