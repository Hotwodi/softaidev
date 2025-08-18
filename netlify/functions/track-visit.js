// Netlify function to track visitor analytics
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { type, visitor_id, session_id } = data;

    if (!type || !visitor_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Handle different event types
    switch (type) {
      case 'page_view':
        await handlePageView(data);
        break;
      case 'product_view':
        await handleProductView(data);
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid event type' })
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

async function handlePageView(data) {
  const { visitor_id, page_path, referrer, screen_width, screen_height, language } = data;
  
  // Get or create visitor
  const { data: visitor, error: visitorError } = await supabase
    .from('visitors')
    .upsert(
      { 
        visitor_id,
        last_seen: new Date().toISOString(),
        ip_address: event.headers['x-nf-client-connection-ip'],
        user_agent: event.headers['user-agent']
      },
      { onConflict: 'visitor_id' }
    )
    .select()
    .single();

  if (visitorError) throw visitorError;

  // Record page view
  const { error: pageViewError } = await supabase
    .from('page_views')
    .insert({
      visitor_id,
      session_id: data.session_id,
      page_path,
      page_title: data.page_title,
      referrer,
      screen_width,
      screen_height,
      language
    });

  if (pageViewError) throw pageViewError;
}

async function handleProductView(data) {
  const { visitor_id, product_id, product_name, session_id } = data;

  // Record product view
  const { error } = await supabase
    .from('product_views')
    .insert({
      visitor_id,
      session_id,
      product_id,
      product_name
    });

  if (error) throw error;
}
