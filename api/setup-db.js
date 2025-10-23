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

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('analyses')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: testError.message,
        suggestion: 'Please run the SQL schema from supabase-schema.sql in your Supabase dashboard'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      tables_exist: true
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ 
      error: 'Setup failed', 
      details: error.message 
    });
  }
}
