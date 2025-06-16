CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

INSERT INTO hospitals (name) VALUES
('General Hospital'),
('City Medical Center'),
('Community Health Clinic')
ON CONFLICT (name) DO NOTHING;
