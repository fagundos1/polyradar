const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_url, user_id } = req.body;

    if (!event_url) {
      return res.status(400).json({ error: 'event_url is required' });
    }

    // Check environment variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      return res.status(500).json({ 
        error: 'Supabase credentials not configured',
        hasUrl: !!process.env.VITE_SUPABASE_URL,
        hasKey: !!process.env.VITE_SUPABASE_ANON_KEY
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Test database connection
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user_id || null,
        event_url,
        status: 'processing',
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error creating analysis:', analysisError);
      return res.status(500).json({ 
        error: 'Failed to create analysis',
        details: analysisError.message 
      });
    }

    return res.status(200).json({
      success: true,
      analysis_id: analysis.id,
      message: 'Analysis created successfully (test mode - no webhooks triggered)',
    });
  } catch (error) {
    console.error('Error in analyze-test endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
};

