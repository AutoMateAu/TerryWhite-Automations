-- Add medications (JSONB) and before-admission specific fields to discharged_patient_forms
ALTER TABLE discharged_patient_forms
ADD COLUMN IF NOT EXISTS medications JSONB,
ADD COLUMN IF NOT EXISTS concession VARCHAR(255),
ADD COLUMN IF NOT EXISTS health_fund VARCHAR(255),
ADD COLUMN IF NOT EXISTS reason_for_admission TEXT,
ADD COLUMN IF NOT EXISTS relevant_past_medical_history TEXT,
ADD COLUMN IF NOT EXISTS community_pharmacist VARCHAR(255),
ADD COLUMN IF NOT EXISTS general_practitioner VARCHAR(255),
ADD COLUMN IF NOT EXISTS medication_risks_comments TEXT,
ADD COLUMN IF NOT EXISTS sources_of_history TEXT,
ADD COLUMN IF NOT EXISTS pharmacist_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_time_signed TIMESTAMP WITH TIME ZONE;
