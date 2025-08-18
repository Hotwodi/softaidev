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

// Get current user's purchases with detailed order information
export async function getUserPurchases() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return { data: null, error: userError || 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        order_id,
        purchase_date,
        expiry_date,
        status,
        amount,
        currency,
        download_url,
        apps (
          id,
          name,
          description,
          version,
          icon_url,
          download_url
        )
      `)
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return { data: null, error };
    }

    // Process the data to include additional calculated fields
    const processedData = (data || []).map(purchase => ({
      ...purchase,
      days_remaining: Math.ceil(
        (new Date(purchase.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      ),
      formatted_purchase_date: new Date(purchase.purchase_date).toLocaleDateString(),
      formatted_expiry_date: new Date(purchase.expiry_date).toLocaleDateString(),
      is_expired: new Date(purchase.expiry_date) < new Date(),
      download_url: purchase.download_url || (purchase.apps?.download_url || '')
    }));

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Unexpected error in getUserPurchases:', error);
    return { data: null, error: error.message || 'An unexpected error occurred' };
  }
}
