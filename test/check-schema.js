const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function checkSchema() {
    try {
        // Check profiles table
        console.log('Checking profiles table schema...');
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select()
            .limit(1);

        if (profileError) {
            console.error('Error checking profiles:', profileError);
            return;
        }

        // Get column info by examining the response structure
        if (profileData && profileData.length > 0) {
            console.log('Profiles table columns:', Object.keys(profileData[0]));
        } else {
            console.log('Profiles table exists but is empty');
        }

        // Check if we can write to the profiles table
        const testId = '00000000-0000-0000-0000-000000000000';
        const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: testId,
                first_name: 'Test',
                last_name: 'User',
                full_name: 'Test User',
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error testing profile insert:', insertError);
        } else {
            console.log('Successfully tested profile insert');
            
            // Clean up test data
            await supabase
                .from('profiles')
                .delete()
                .eq('id', testId);
        }

    } catch (error) {
        console.error('Schema check failed:', error);
    }
}

checkSchema();
