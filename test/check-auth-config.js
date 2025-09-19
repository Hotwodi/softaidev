const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function checkAuthConfig() {
    try {
        // Check if we can get user count (tests admin access)
        console.log('Checking admin access...');
        const { count, error: countError } = await supabase
            .from('auth.users')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Admin access error:', {
                message: countError.message,
                details: countError.details,
                hint: countError.hint
            });
        } else {
            console.log('Admin access OK, user count:', count);
        }

        // Try to get auth settings
        console.log('\nChecking auth settings...');
        const { data: settings, error: settingsError } = await supabase
            .from('auth.config')
            .select('*')
            .single();

        if (settingsError) {
            console.error('Settings access error:', {
                message: settingsError.message,
                details: settingsError.details,
                hint: settingsError.hint
            });
        } else {
            console.log('Auth settings:', settings);
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

checkAuthConfig();
