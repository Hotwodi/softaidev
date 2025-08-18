# Analytics Setup for SoftAIDev

This document outlines the steps to set up the analytics system for tracking visitor data and displaying it in the admin dashboard.

## Prerequisites

1. Supabase project with the following tables:
   - `visitors`
   - `page_views`
   - `product_views`
   - `purchases`

2. Supabase service role key with appropriate permissions

## Setup Instructions

### 1. Database Setup

Run the SQL functions from `setup-supabase-analytics.js` in your Supabase SQL Editor to create the necessary database functions.

### 2. Environment Variables

Add the following environment variables to your Netlify project:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### 3. Enable Row Level Security (RLS)

Make sure to enable Row Level Security on all analytics tables and create appropriate policies for secure access.

### 4. Update Admin Dashboard

In `admin-dashboard.html`, update the Supabase credentials:

```javascript
document.body.dataset.supabaseUrl = 'YOUR_SUPABASE_URL';
document.body.dataset.supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

## Tracking Implementation

### Page Views

Add the following script to all pages you want to track:

```html
<script src="/js/analytics.js"></script>
```

### Product Views

Add `data-product-id` and `data-product-name` attributes to product elements:

```html
<div class="product" data-product-id="123" data-product-name="Product Name">
  <!-- Product content -->
</div>
```

### Purchases

Track purchases by calling:

```javascript
if (window.softaidevAnalytics) {
  softaidevAnalytics.trackPurchase({
    productId: '123',
    productName: 'Product Name',
    amount: 99.99,
    currency: 'USD'
  });
}
```

## Admin Dashboard

Access the analytics dashboard by navigating to the "Analytics" section in the admin panel.

## Troubleshooting

1. **No data showing**
   - Check browser console for errors
   - Verify Supabase tables have data
   - Ensure RLS policies allow access

2. **Charts not loading**
   - Make sure Chart.js is included
   - Check network requests for 403/500 errors

3. **Location data missing**
   - Verify IP geolocation is enabled
   - Check if visitor IP addresses are being recorded
