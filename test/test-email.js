const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function testEmail() {
    try {
        console.log('Testing email configuration...');
        const { error } = await supabase.auth.resetPasswordForEmail(
            'customer.support@softaidev.com'
        );

        if (error) {
            console.error('Email test error:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        } else {
            console.log('Email test successful! Check your inbox.');
        }

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

testEmail();
