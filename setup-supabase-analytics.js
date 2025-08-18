// SQL Functions for Supabase Analytics
// Run these in your Supabase SQL Editor

const SQL_FUNCTIONS = `
-- Create or replace the get_visitor_stats function
CREATE OR REPLACE FUNCTION public.get_visitor_stats()
RETURNS TABLE (
    total_visitors bigint,
    unique_visitors bigint,
    page_views bigint,
    conversion_rate decimal
)
LANGUAGE sql
AS $$
WITH visitor_stats AS (
    SELECT 
        COUNT(DISTINCT id) as total_visitors,
        COUNT(DISTINCT visitor_id) as unique_visitors
    FROM public.visitors
    WHERE last_seen >= NOW() - INTERVAL '30 days'
),
page_view_stats AS (
    SELECT COUNT(*) as page_views
    FROM public.page_views
    WHERE timestamp >= NOW() - INTERVAL '30 days'
),
purchase_stats AS (
    SELECT 
        COUNT(DISTINCT visitor_id) as purchasing_visitors
    FROM public.purchases
    WHERE timestamp >= NOW() - INTERVAL '30 days'
)
SELECT 
    vs.total_visitors,
    vs.unique_visitors,
    pvs.page_views,
    COALESCE(ps.purchasing_visitors::decimal / NULLIF(vs.unique_visitors, 0), 0) as conversion_rate
FROM 
    visitor_stats vs,
    page_view_stats pvs,
    purchase_stats ps;
$$;

-- Create or replace the get_page_views function
CREATE OR REPLACE FUNCTION public.get_page_views(days_param integer DEFAULT 30)
RETURNS TABLE (
    date date,
    view_count bigint,
    unique_visitors bigint
)
LANGUAGE sql
AS $$
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as view_count,
    COUNT(DISTINCT visitor_id) as unique_visitors
FROM 
    public.page_views
WHERE 
    timestamp >= NOW() - (days_param || ' days')::interval
GROUP BY 
    DATE(timestamp)
ORDER BY 
    date;
$$;

-- Create or replace the get_visitor_locations function
CREATE OR REPLACE FUNCTION public.get_visitor_locations()
RETURNS TABLE (
    country text,
    region text,
    city text,
    visitor_count bigint,
    latitude double precision,
    longitude double precision
)
LANGUAGE sql
AS $$
SELECT 
    COALESCE(country, 'Unknown') as country,
    COALESCE(region, 'Unknown') as region,
    COALESCE(city, 'Unknown') as city,
    COUNT(DISTINCT visitor_id) as visitor_count,
    AVG(latitude) as latitude,
    AVG(longitude) as longitude
FROM 
    public.visitors
WHERE 
    last_seen >= NOW() - INTERVAL '30 days'
    AND (country IS NOT NULL OR region IS NOT NULL OR city IS NOT NULL)
GROUP BY 
    country, region, city
ORDER BY 
    visitor_count DESC
LIMIT 100;
$$;

-- Create or replace the get_product_analytics function
CREATE OR REPLACE FUNCTION public.get_product_analytics()
RETURNS TABLE (
    product_id text,
    product_name text,
    views bigint,
    purchases bigint,
    conversion_rate decimal
)
LANGUAGE sql
AS $$
WITH product_views AS (
    SELECT 
        product_id,
        MAX(product_name) as product_name,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as unique_viewers
    FROM 
        public.product_views
    WHERE 
        timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY 
        product_id
),
product_purchases AS (
    SELECT 
        product_id,
        COUNT(*) as purchases,
        COUNT(DISTINCT visitor_id) as unique_buyers
    FROM 
        public.purchases
    WHERE 
        timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY 
        product_id
)
SELECT 
    COALESCE(pv.product_id, pp.product_id) as product_id,
    COALESCE(pv.product_name, 'Unknown Product') as product_name,
    COALESCE(pv.views, 0) as views,
    COALESCE(pp.purchases, 0) as purchases,
    ROUND(COALESCE(pp.purchases::decimal / NULLIF(pv.views, 0), 0), 4) as conversion_rate
FROM 
    product_views pv
FULL OUTER JOIN 
    product_purchases pp ON pv.product_id = pp.product_id
ORDER BY 
    pv.views DESC NULLS LAST;
$$;
`;

console.log('Copy and run the following SQL in your Supabase SQL Editor to set up the analytics functions:');
console.log(SQL_FUNCTIONS);
