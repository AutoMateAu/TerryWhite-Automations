-- Add hospital_id column to patients table
ALTER TABLE patients
ADD COLUMN hospital_id TEXT;

-- Optionally, add a foreign key constraint if you have a hospitals table
-- ALTER TABLE patients
-- ADD CONSTRAINT fk_hospital
-- FOREIGN KEY (hospital_id)
-- REFERENCES hospitals(id);
