-- Add template_type and hospital_name columns to discharged_patient_forms
ALTER TABLE discharged_patient_forms
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255);

-- Add patient_id column and make it a foreign key to the patients table
ALTER TABLE discharged_patient_forms
ADD COLUMN IF NOT EXISTS patient_id UUID;

-- Add a foreign key constraint, ensuring it's not added if it already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discharged_patient_forms_patient_id_fkey') THEN
        ALTER TABLE discharged_patient_forms
        ADD CONSTRAINT discharged_patient_forms_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;
    END IF;
END
$$;
