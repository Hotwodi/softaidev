const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function cleanupDuplicateApps() {
    try {
        // 1. Get all Drawing Apps
        console.log('Finding Drawing Apps...');
        const { data: apps, error: appError } = await supabase
            .from('apps')
            .select('*')
            .eq('name', 'Drawing App');

        if (appError) throw appError;
        console.log(`Found ${apps.length} Drawing App entries:`, apps);

        if (apps.length <= 1) {
            console.log('No duplicates to clean up.');
            return;
        }

        // 2. Find the correct app (the one with PayPal button ID)
        const correctApp = apps.find(app => app.paypal_button_id === 'ZB2ZRVN3W5HMA');
        if (!correctApp) {
            console.log('Could not find Drawing App with correct PayPal button ID');
            return;
        }

        // 3. Delete duplicates
        console.log('Deleting duplicate entries...');
        const duplicateIds = apps
            .filter(app => app.id !== correctApp.id)
            .map(app => app.id);

        if (duplicateIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('apps')
                .delete()
                .in('id', duplicateIds);

            if (deleteError) throw deleteError;
            console.log(`Successfully deleted ${duplicateIds.length} duplicate entries`);
        }

        console.log('Cleanup complete. Remaining Drawing App:', correctApp);

    } catch (error) {
        console.error('Cleanup failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
        process.exit(1);
    }
}

cleanupDuplicateApps();
