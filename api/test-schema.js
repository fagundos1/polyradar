import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Try to insert a minimal record to see what columns are actually available
    const { data: insertData, error: insertError } = await supabase
      .from('analyses')
      .insert({
        event_url: 'https://test.com',
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert test failed:', insertError);
      return res.status(500).json({ 
        error: 'Insert test failed', 
        details: insertError.message,
        hint: 'Check if the table schema matches the expected columns'
      });
    }

    // Clean up the test record
    await supabase
      .from('analyses')
      .delete()
      .eq('id', insertData.id);

    return res.status(200).json({
      success: true,
      message: 'Table schema is correct',
      test_record: insertData
    });

  } catch (error) {
    console.error('Schema test error:', error);
    return res.status(500).json({ 
      error: 'Schema test failed', 
      details: error.message 
    });
  }
}
