const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function createPurchasesTable() {
    const { error } = await supabase.rpc('create_purchases_table');
    if (error) {
        console.error('Error creating purchases table:', error);
        return false;
    }
    return true;
}

async function signInTestUser() {
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
    });

    if (error) throw error;
    return { user, session };
}

async function testPurchaseFlow() {
    try {
        // 1. Sign in as test user
        const { user } = await signInTestUser();
        console.log('Signed in as:', user.email);

        // 2. Get all Drawing Apps
        const { data: apps, error: appError } = await supabase
            .from('apps')
            .select('id, name, description, price, paypal_button_id, is_paid')
            .eq('name', 'Drawing App');

        if (appError) throw appError;
        console.log('Found apps:', apps);

        // 2. Find our specific app
        const app = apps.find(a => a.paypal_button_id === 'ZB2ZRVN3W5HMA');
        if (!app) throw new Error('Drawing App with PayPal button not found');

        console.log('Found Drawing App:', app);

        // 3. Insert test purchase
        const purchaseDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 year access

        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([{
                app_id: app.id,
                user_id: user.id, // Use signed-in user's UUID
                purchase_date: purchaseDate.toISOString(),
                expiry_date: expiryDate.toISOString(),
                payment_id: 'TEST-ORDER-' + Date.now(),
                amount: app.price || 2.99,
                status: 'completed'
            }])
            .select()
            .single();

        if (purchaseError) {
            console.error('Purchase error details:', {
                message: purchaseError.message,
                details: purchaseError.details,
                hint: purchaseError.hint
            });
            throw purchaseError;
        }
        console.log('Created test purchase:', purchase);

        // 4. Get download URL
        const { data: downloadUrl, error: downloadError } = await supabase
            .functions
            .invoke('get-download-url', {
                body: { app_id: app.id }
            });

        if (downloadError) {
            console.error('Download error details:', {
                message: downloadError.message,
                details: downloadError.details,
                hint: downloadError.hint
            });
            throw downloadError;
        }
        console.log('Got download URL:', downloadUrl);

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Run the test
testPurchaseFlow();
