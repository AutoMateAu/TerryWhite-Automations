-- Create a master table for all available medications
CREATE TABLE medications_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: You'll need to populate this table with your list of ~1700 medications.
-- Example insert (repeat for all medications):
-- INSERT INTO medications_master (name) VALUES ('ABIRATERONE 250MG TABS');
