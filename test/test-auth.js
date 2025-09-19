const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function testAuth() {
    try {
        // 1. Try to sign up
        console.log('Attempting to create test user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'test@example.com',
            password: 'test123456'
        });

        if (signUpError) {
            console.error('Sign up error:', {
                message: signUpError.message,
                details: signUpError.details,
                hint: signUpError.hint
            });
        } else {
            console.log('Sign up successful:', signUpData);
        }

        // 2. Try to sign in
        console.log('\nAttempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'test123456'
        });

        if (signInError) {
            console.error('Sign in error:', {
                message: signInError.message,
                details: signInError.details,
                hint: signInError.hint
            });
        } else {
            console.log('Sign in successful:', {
                user: {
                    id: signInData.user.id,
                    email: signInData.user.email,
                    created_at: signInData.user.created_at
                },
                session: {
                    expires_at: signInData.session.expires_at
                }
            });
        }

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

testAuth();
