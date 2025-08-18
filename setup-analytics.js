const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAnalytics() {
  try {
    // Create visitors table
    const { error: visitorsError } = await supabase.rpc('create_analytics_tables');
    
    if (visitorsError) {
      console.error('Error creating analytics tables:', visitorsError);
      return;
    }
    
    console.log('✅ Analytics tables created successfully');
    
    // Create RLS policies for secure access
    const { error: policyError } = await supabase.rpc('create_analytics_policies');
    
    if (policyError) {
      console.error('Error creating analytics policies:', policyError);
      return;
    }
    
    console.log('✅ Analytics policies created successfully');
    
  } catch (error) {
    console.error('Error setting up analytics:', error);
  }
}

// Create SQL function for tables and policies
const createTablesSQL = `
  -- Create visitors table
  CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    UNIQUE(visitor_id)
  );

  -- Create page_views table
  CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_u64() PRIMARY KEY,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT
  );

  -- Create product_views table
  CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT
  );

  -- Create purchases table (if not exists)
  CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE SET NULL,
    product_id TEXT,
    amount DECIMAL(10, 2),
    currency TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT
  );
`;

console.log('Run this SQL in your Supabase SQL editor to create the necessary tables:');
console.log(createTablesSQL);

// Uncomment to run the setup
// setupAnalytics();
