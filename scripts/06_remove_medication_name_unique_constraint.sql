-- Remove the unique constraint from the 'name' column in 'medications_master'
ALTER TABLE medications_master
DROP CONSTRAINT IF EXISTS medications_master_name_key;

-- Optional: If you want to ensure no other unique constraints exist on 'name' that might have a different name,
-- you would typically inspect the table's constraints in Supabase SQL editor or pgAdmin.
-- However, 'medications_master_name_key' is the standard name Postgres/Supabase would assign.

-- Add a basic index on name for faster lookups, as unique constraints also provide an index.
-- This is not strictly necessary for the import to work but good for performance later.
CREATE INDEX IF NOT EXISTS idx_medications_master_name ON medications_master (name);
