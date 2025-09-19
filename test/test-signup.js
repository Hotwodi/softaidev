const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjAzODc5NCwiZXhwIjoyMDA3NjE0Nzk0fQ.GBPHHh5bqpQ7Vf0oyCHUOcJX0JVHf_NjyQHqfXGS0Hs'
);

async function testSignup() {
    try {
        console.log('Testing user signup...');
        const { data, error } = await supabase.auth.signUp({
            email: 'test@softaidev.com',
            password: 'test123456'
        });

        if (error) {
            console.error('Signup error:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        } else {
            console.log('Signup successful:', {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    emailConfirmed: data.user.email_confirmed_at,
                    createdAt: data.user.created_at
                },
                session: data.session ? {
                    expires: data.session.expires_at
                } : null
            });
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

testSignup();
