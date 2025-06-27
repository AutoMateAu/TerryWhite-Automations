-- Add hospital_id column to patients table
-- Using UUID type for consistency with Supabase primary keys
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS hospital_id UUID;

-- Add foreign key constraint to link with hospitals table
-- This assumes the hospitals table already exists (created by 12_create_hospitals_table.sql)
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS fk_hospital_patient; -- Drop if exists to avoid errors on re-run

ALTER TABLE patients
ADD CONSTRAINT fk_hospital_patient
FOREIGN KEY (hospital_id)
REFERENCES hospitals(id)
ON DELETE SET NULL; -- Or ON DELETE CASCADE, depending on desired behavior
