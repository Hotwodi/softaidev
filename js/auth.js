// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';

const supabase = createClient(
  'https://glplnybcdgbyajdgzjrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...'
);

// Check if user is logged in
export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// Sign up new user
export async function signUp(email, password, username, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName
      }
    }
  });
  return { data, error };
}

// Sign in user
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

// Sign out user
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current user's purchases
export async function getUserPurchases() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('purchases')
    .select('*, apps(*)')
    .eq('user_id', user.id)
    .gte('expiry_date', new Date().toISOString());

  return { data, error };
}
