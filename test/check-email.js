const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function checkEmailConfig() {
    try {
        // Try to send a password reset email
        console.log('Testing email configuration...');
        const { data, error } = await supabase.auth.resetPasswordForEmail(
            'test@example.com'
        );

        if (error) {
            console.error('Email test error:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            
            if (error.message.includes('Email rate limit exceeded')) {
                console.log('Email system is configured but rate-limited');
            } else if (error.message.includes('Email not found')) {
                console.log('Email system is working but user not found (expected)');
            } else if (error.message.includes('SMTP') || error.message.includes('email provider')) {
                console.log('Email system may not be properly configured');
            }
        } else {
            console.log('Email system is working:', data);
        }

    } catch (error) {
        console.error('Check failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

checkEmailConfig();
