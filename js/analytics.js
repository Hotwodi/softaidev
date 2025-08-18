// Analytics tracking for SoftAIDev
const ANALYTICS_ENDPOINT = '/.netlify/functions/track-visit';

class Analytics {
  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.generateSessionId();
    this.pageViewSent = false;
    this.init();
  }

  init() {
    // Track page view
    this.trackPageView();
    
    // Set up event listeners for product views
    this.setupProductViewTracking();
    
    // Handle page visibility changes (for session tracking)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.trackPageView();
      }
    });
  }

  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 15);
  }

  async trackPageView() {
    if (this.pageViewSent) return;
    
    const pageData = {
      type: 'page_view',
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };

    try {
      await this.sendAnalyticsData(pageData);
      this.pageViewSent = true;
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  async trackProductView(productId, productName) {
    const productData = {
      type: 'product_view',
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      product_id: productId,
      product_name: productName,
      timestamp: new Date().toISOString()
    };

    try {
      await this.sendAnalyticsData(productData);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  setupProductViewTracking() {
    // Auto-track product views on pages with data-product-id attributes
    document.addEventListener('DOMContentLoaded', () => {
      const productElements = document.querySelectorAll('[data-product-id]');
      
      productElements.forEach(element => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const productId = element.getAttribute('data-product-id');
              const productName = element.getAttribute('data-product-name') || 'Unknown Product';
              this.trackProductView(productId, productName);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        
        observer.observe(element);
      });
    });
  }

  async sendAnalyticsData(data) {
    // In production, this would send data to your analytics endpoint
    // For now, we'll log it to the console
    console.log('Analytics event:', data);
    
    // Uncomment this in production:
    /*
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send analytics data');
    }
    */
  }
}

// Initialize analytics
if (typeof window !== 'undefined') {
  window.softaidevAnalytics = new Analytics();
}
