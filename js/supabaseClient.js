// Supabase client configuration for the frontend
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize the Supabase client with your project's URL and public anon key
const supabaseUrl = 'https://glplnybcdgbyajdgzjrr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Export auth methods for easier imports
export const auth = {
  // Sign in with email and password
  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },
  
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
  },
  
  // Sign out
  async signOut() {
    return await supabase.auth.signOut()
  },
  
  // Send password reset email
  async resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password.html`
    })
  },
  
  // Update user password
  async updatePassword(newPassword) {
    return await supabase.auth.updateUser({
      password: newPassword
    })
  },
  
  // Get current user session
  async getSession() {
    return await supabase.auth.getSession()
  },
  
  // Get current user
  async getUser() {
    return await supabase.auth.getUser()
  },
  
  // Listen for auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }
}

// Export other commonly used Supabase functions
export const database = {
  // Example: Fetch user's purchases
  async getUserPurchases(userId) {
    return await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },
  
  // Add more database functions as needed
}

// Export the full Supabase client in case it's needed
export default supabase
