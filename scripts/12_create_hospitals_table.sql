-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample data to hospitals table if not already present
INSERT INTO hospitals (id, name)
VALUES
  ('arcadia-pittwater', 'Arcadia Pittwater'),
  ('esph', 'ESPH'),
  ('manly-waters', 'Manly Waters'),
  ('northern-beaches', 'Northern Beaches'),
  ('other', 'Other')
ON CONFLICT (id) DO NOTHING;
