const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
);

async function addNameColumns() {
    try {
        // Simple ALTER TABLE to add the columns
        const { error } = await supabase.rpc('run_sql', {
            query: `
                ALTER TABLE public.profiles 
                ADD COLUMN IF NOT EXISTS first_name text,
                ADD COLUMN IF NOT EXISTS last_name text;
            `
        });

        if (error) {
            console.error('Failed to add columns:', error);
            return;
        }

        console.log('Successfully added name columns');

    } catch (error) {
        console.error('Operation failed:', error);
    }
}

addNameColumns();
