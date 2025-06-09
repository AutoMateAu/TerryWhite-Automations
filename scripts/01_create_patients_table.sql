-- Create patients table based on PatientProfile
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dob DATE,
    address TEXT,
    medicare TEXT,
    allergies TEXT,
    mrn TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for current medications associated with a patient (from PatientProfile.currentMedications)
CREATE TABLE patient_current_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for patients table
CREATE TRIGGER set_patients_timestamp
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
