const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
    'https://glplnybcdgbyajdgzjrr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjAzODc5NCwiZXhwIjoyMDA3NjE0Nzk0fQ.GBPHHh5bqpQ7Vf0oyCHUOcJX0JVHf_NjyQHqfXGS0Hs'
);

async function migrateProfiles() {
    try {
        // Add first_name and last_name columns
        console.log('Adding name columns to profiles table...');
        const { error: alterError } = await supabase.rpc('run_sql', {
            query: `
                -- Add name columns if they don't exist
                ALTER TABLE public.profiles 
                ADD COLUMN IF NOT EXISTS first_name text,
                ADD COLUMN IF NOT EXISTS last_name text;

                -- Update existing records to split full_name into first_name and last_name
                UPDATE public.profiles 
                SET 
                    first_name = SPLIT_PART(full_name, ' ', 1),
                    last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
                WHERE 
                    full_name IS NOT NULL 
                    AND first_name IS NULL 
                    AND last_name IS NULL;

                -- Create or replace trigger to maintain full_name
                CREATE OR REPLACE FUNCTION update_full_name()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.full_name = CONCAT_WS(' ', NEW.first_name, NEW.last_name);
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
            console.error('Migration failed:', alterError);
            return;
        }

        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
    }
}

migrateProfiles();
