const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function setupSchema() {
    try {
        // 1. Check if profiles table exists and has required columns
        console.log('Checking profiles table...');
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (profileError) {
            if (profileError.message.includes('relation "profiles" does not exist')) {
                console.log('Creating profiles table...');
                const { error: createError } = await supabase.rpc('create_profiles_table', {});
                if (createError) throw createError;
            } else {
                throw profileError;
            }
        }

        // 2. Check if name columns exist
        const columns = profileData && profileData.length > 0 ? Object.keys(profileData[0]) : [];
        console.log('Current columns:', columns);

        if (!columns.includes('first_name') || !columns.includes('last_name')) {
            console.log('Adding name columns...');
            const { error: alterError } = await supabase.rpc('add_name_columns', {});
            if (alterError) throw alterError;
        }

        // 3. Test inserting a profile
        console.log('\nTesting profile insert...');
        const testData = {
            id: '00000000-0000-0000-0000-000000000000',
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
            .from('profiles')
            .upsert(testData);

        if (insertError) {
            console.error('Insert test failed:', insertError);
            return;
        }

        // 4. Verify the insert
        const { data: verifyData, error: verifyError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testData.id)
            .single();

        if (verifyError) {
            console.error('Verification failed:', verifyError);
            return;
        }

        console.log('Test profile data:', verifyData);

        // 5. Clean up test data
        await supabase
            .from('profiles')
            .delete()
            .eq('id', testData.id);

        console.log('Schema setup completed successfully');

    } catch (error) {
        console.error('Setup failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

setupSchema();
