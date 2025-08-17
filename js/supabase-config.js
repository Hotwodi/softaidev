// Supabase configuration
export const SUPABASE_URL = 'https://glplnybcdgbyajdgzjrr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY';

// Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
