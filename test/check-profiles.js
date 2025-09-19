const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function checkProfiles() {
    try {
        // Get profile table structure
        console.log('Checking profiles table...');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return;
        }

        // Show table structure
        if (data && data.length > 0) {
            console.log('Profile table columns:', Object.keys(data[0]));
            console.log('Sample profile:', data[0]);
        } else {
            console.log('No profiles found, but table exists');
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

checkProfiles();
