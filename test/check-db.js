const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjAzODc5NCwiZXhwIjoyMDA3NjE0Nzk0fQ.GBPHHh5bqpQ7Vf0oyCHUOcJX0JVHf_NjyQHqfXGS0Hs'
);

async function checkDatabase() {
    try {
        // Check if we can query the auth schema
        console.log('Checking auth schema access...');
        const { data: authData, error: authError } = await supabase
            .from('auth')
            .select('*')
            .limit(1);

        console.log('Auth schema check:', {
            error: authError ? {
                message: authError.message,
                details: authError.details,
                hint: authError.hint
            } : null,
            data: authData
        });

        // Check if we can query public schema
        console.log('\nChecking public schema access...');
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        console.log('Public schema check:', {
            error: profileError ? {
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
            } : null,
            hasData: profileData && profileData.length > 0
        });

        // Try to get current user if any
        console.log('\nChecking current session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session check:', {
            error: sessionError ? {
                message: sessionError.message,
                details: sessionError.details,
                hint: sessionError.hint
            } : null,
            hasSession: !!session
        });

    } catch (error) {
        console.error('Check failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

checkDatabase();
