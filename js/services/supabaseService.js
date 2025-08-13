import { supabase } from '../supabase-config.js';

// App related functions
export const appService = {
  // Get all apps with optional filtering
  async getApps(filters = {}) {
    let query = supabase
      .from('apps')
      .select('*', { count: 'exact' });

    // Apply filters if any
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch(filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('download_count', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
      }
    }

    const { data, error, count } = await query;
    
    if (error) throw error;
    return { data, count };
  },

  // Get a single app by ID
  async getAppById(id) {
    const { data, error } = await supabase
      .from('apps')
      .select('*, reviews(*, profiles(username, avatar_url))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Increment download count
  async incrementDownloadCount(appId) {
    const { data, error } = await supabase.rpc('increment_download_count', {
      app_id: appId
    });
    
    if (error) throw error;
    return data;
  },

  // Get featured apps
  async getFeaturedApps(limit = 5) {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .eq('is_featured', true)
      .limit(limit);

    if (error) throw error;
    return data;
  }
};

// Review related functions
export const reviewService = {
  // Add a new review
  async addReview({ appId, userId, rating, comment }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        { 
          app_id: appId, 
          user_id: userId, 
          rating, 
          comment,
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get reviews for an app
  async getAppReviews(appId) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update a review
  async updateReview({ reviewId, userId, rating, comment }) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, comment, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete a review
  async deleteReview(reviewId, userId) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
};

// User related functions
export const userService = {
  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get user's downloaded apps
  async getUserDownloads(userId) {
    const { data, error } = await supabase
      .from('downloads')
      .select('*, apps(*)')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
