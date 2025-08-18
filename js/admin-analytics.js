class AdminAnalytics {
  constructor() {
    this.supabaseUrl = document.body.dataset.supabaseUrl;
    this.supabaseKey = document.body.dataset.supabaseKey;
    this.supabase = null;
    this.init();
  }

  async init() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('Supabase credentials not found');
      return;
    }

    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.7.1/dist/umd/supabase.min.js');
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    await this.loadAnalyticsData();
    this.setupEventListeners();
  }

  async loadAnalyticsData() {
    try {
      // Load visitor stats
      const visitorStats = await this.getVisitorStats();
      this.updateVisitorStats(visitorStats);
      
      // Load page view data
      const pageViews = await this.getPageViews();
      this.renderPageViewsChart(pageViews);
      
      // Load location data
      const locations = await this.getVisitorLocations();
      this.renderLocationMap(locations);
      
      // Load product analytics
      const productStats = await this.getProductStats();
      this.renderProductStats(productStats);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.showError('Failed to load analytics data');
    }
  }

  async getVisitorStats() {
    const { data, error } = await this.supabase
      .rpc('get_visitor_stats');
      
    if (error) throw error;
    return data;
  }

  async getPageViews(days = 30) {
    const { data, error } = await this.supabase
      .rpc('get_page_views', { days_param: days });
      
    if (error) throw error;
    return data;
  }

  async getVisitorLocations() {
    const { data, error } = await this.supabase
      .rpc('get_visitor_locations');
      
    if (error) throw error;
    return data;
  }

  async getProductStats() {
    const { data, error } = await this.supabase
      .rpc('get_product_analytics');
      
    if (error) throw error;
    return data;
  }

  updateVisitorStats(stats) {
    document.getElementById('total-visitors').textContent = stats.total_visitors || 0;
    document.getElementById('unique-visitors').textContent = stats.unique_visitors || 0;
    document.getElementById('page-views').textContent = stats.page_views || 0;
    document.getElementById('conversion-rate').textContent = stats.conversion_rate ? 
      `${(stats.conversion_rate * 100).toFixed(2)}%` : '0%';
  }

  renderPageViewsChart(pageViews) {
    // This is a simplified example - you'd use a charting library like Chart.js
    console.log('Rendering page views chart with data:', pageViews);
    // Implementation would go here
  }

  renderLocationMap(locations) {
    // This would integrate with a mapping library like Leaflet or Google Maps
    console.log('Rendering location map with data:', locations);
    // Implementation would go here
  }

  renderProductStats(stats) {
    const container = document.getElementById('product-stats');
    if (!container) return;
    
    const html = `
      <div class="card">
        <h3>Product Performance</h3>
        <table class="analytics-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Views</th>
              <th>Purchases</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            ${stats.map(product => `
              <tr>
                <td>${product.product_name || 'Unknown'}</td>
                <td>${product.views || 0}</td>
                <td>${product.purchases || 0}</td>
                <td>${product.conversion_rate ? (product.conversion_rate * 100).toFixed(2) + '%' : '0%'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
  }

  setupEventListeners() {
    // Add event listeners for date range filters, etc.
    const dateFilters = document.querySelectorAll('.date-filter');
    dateFilters.forEach(filter => {
      filter.addEventListener('change', () => this.handleDateFilterChange(filter.value));
    });
  }

  async handleDateFilterChange(days) {
    try {
      const pageViews = await this.getPageViews(parseInt(days));
      this.renderPageViewsChart(pageViews);
    } catch (error) {
      console.error('Error filtering data:', error);
      this.showError('Failed to filter data');
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('analytics-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.analytics-dashboard')) {
    window.adminAnalytics = new AdminAnalytics();
  }
});
