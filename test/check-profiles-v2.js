const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function checkProfiles() {
    try {
        // Try to create a test profile with first/last name
        const testProfile = {
            id: '00000000-0000-0000-0000-000000000000',
            first_name: 'Test',
            last_name: 'User',
            updated_at: new Date().toISOString()
        };

        console.log('Attempting to create test profile...');
        const { error: insertError } = await supabase
            .from('profiles')
            .upsert(testProfile);

        if (insertError) {
            console.error('Insert failed:', insertError);
            return;
        }

        // Fetch and verify the profile
        console.log('\nFetching test profile...');
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testProfile.id)
            .single();

        if (fetchError) {
            console.error('Fetch failed:', fetchError);
            return;
        }

        console.log('Profile structure:', profile);

        // Clean up test profile
        await supabase
            .from('profiles')
            .delete()
            .eq('id', testProfile.id);

    } catch (error) {
        console.error('Operation failed:', error);
    }
}

checkProfiles();
