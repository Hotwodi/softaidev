// Supabase configuration
export const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
