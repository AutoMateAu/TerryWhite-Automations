-- Create a master table for all available medications with comments
DROP TABLE IF EXISTS medications_master CASCADE; -- Add CASCADE to drop dependent objects if any during dev

CREATE TABLE medications_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    comment TEXT, -- Ensuring lowercase 'comment'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to update updated_at timestamp (if not already created by other scripts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
        CREATE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Trigger for medications_master table
CREATE TRIGGER set_medications_master_timestamp
BEFORE UPDATE ON medications_master
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
