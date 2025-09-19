const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function migrateProfiles() {
    try {
        // 1. Check if columns exist
        console.log('Checking profiles table structure...');
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select()
            .limit(1);

        if (profileError) {
            console.error('Error checking profiles:', profileError);
            return;
        }

        // Get column info
        const columns = profileData && profileData.length > 0 ? Object.keys(profileData[0]) : [];
        console.log('Current columns:', columns);

        // 2. Create RPC function to add columns if they don't exist
        console.log('\nAdding name columns if needed...');
        const { error: rpcError } = await supabase.rpc('add_name_columns', {});

        if (rpcError) {
            console.error('Error adding columns:', rpcError);
            return;
        }

        // 3. Test inserting a profile with first/last name
        console.log('\nTesting profile insert...');
        const testId = '00000000-0000-0000-0000-000000000000';
        const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: testId,
                first_name: 'Test',
                last_name: 'User',
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error testing insert:', insertError);
            return;
        }

        // 4. Clean up test data
        await supabase
            .from('profiles')
            .delete()
            .eq('id', testId);

        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateProfiles();
