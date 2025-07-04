-- Add hospital_id column to discharged_patient_forms table
ALTER TABLE discharged_patient_forms
ADD COLUMN IF NOT EXISTS hospital_id UUID;

-- Add foreign key constraint to link with hospitals table
-- This assumes the hospitals table already exists (created by 12_create_hospitals_table.sql)
ALTER TABLE discharged_patient_forms
DROP CONSTRAINT IF EXISTS fk_discharged_form_hospital; -- Drop if exists to avoid errors on re-run

ALTER TABLE discharged_patient_forms
ADD CONSTRAINT fk_discharged_form_hospital
FOREIGN KEY (hospital_id)
REFERENCES hospitals(id)
ON DELETE SET NULL; -- Or ON DELETE CASCADE, depending on desired behavior
