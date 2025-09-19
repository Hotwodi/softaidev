const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for admin access
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjAzODc5NCwiZXhwIjoyMDA3NjE0Nzk0fQ.GBPHHh5bqpQ7Vf0oyCHUOcJX0JVHf_NjyQHqfXGS0Hs'
);

async function updateProfilesTable() {
    try {
        // 1. Add first_name and last_name columns
        console.log('Adding name columns...');
        const { error: alterError } = await supabase.rpc('run_sql', {
            query: `
                ALTER TABLE public.profiles
                ADD COLUMN IF NOT EXISTS first_name text,
                ADD COLUMN IF NOT EXISTS last_name text;

                -- Update full_name trigger
                CREATE OR REPLACE FUNCTION update_full_name()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.full_name = CONCAT(NEW.first_name, ' ', NEW.last_name);
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS set_full_name ON public.profiles;
                CREATE TRIGGER set_full_name
                    BEFORE INSERT OR UPDATE OF first_name, last_name
                    ON public.profiles
                    FOR EACH ROW
                    EXECUTE FUNCTION update_full_name();
            `
        });

        if (alterError) {
            console.error('Error updating table:', alterError);
            return;
        }

        console.log('Successfully updated profiles table structure');

    } catch (error) {
        console.error('Migration failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

updateProfilesTable();
