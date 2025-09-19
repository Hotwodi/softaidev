// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// Sign up new user
export async function signUp(email, password, username, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`
      }
    }
  });

  if (data?.user) {
    // Also update the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { data, error: profileError };
    }
  }

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
