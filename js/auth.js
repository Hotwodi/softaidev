// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';

const supabase = createClient(
  'https://glplnybcdgbyajdgzjrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...'
);

// Admin email addresses
const ADMIN_EMAILS = [
  'customer.support@softaidev.com',
  // Add other admin emails here as needed
];

// Check if user is logged in
export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// Check if user is an admin
export async function checkAdminAuth() {
  const { session, error } = await checkAuth();
  
  if (error || !session) {
    return { isAdmin: false, session: null, error: error || 'Not authenticated' };
  }
  
  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  return { isAdmin, session, error: null };
}

// Sign up new user
export async function signUp(email, password, username, firstName, lastName) {
  // Determine if this is an admin signup
  const isAdmin = ADMIN_EMAILS.includes(email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`, // Keep full_name for backward compatibility
        role: isAdmin ? 'admin' : 'user'
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
  
  // If sign in successful, update user metadata with role if needed
  if (data?.user && !data.user.user_metadata?.role) {
    const isAdmin = ADMIN_EMAILS.includes(email);
    await supabase.auth.updateUser({
      data: { role: isAdmin ? 'admin' : 'user' }
    });
  }
  
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
