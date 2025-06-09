-- Create discharged_patient_forms table based on PatientFormData/DischargedPatient
CREATE TABLE discharged_patient_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Patient details from PatientFormData
    name TEXT NOT NULL,
    address TEXT,
    medicare TEXT,
    allergies TEXT,
    dob DATE,
    mrn TEXT NOT NULL,
    admission_date DATE,
    discharge_date DATE,
    pharmacist TEXT,
    date_list_prepared DATE,
    -- page_info TEXT, -- This was removed from the UI, but keeping schema flexible if needed later
    -- Discharge specific fields
    discharge_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for medications associated with a discharged patient form
-- This represents the 'medications: Medication[]' array in PatientFormData
CREATE TABLE discharged_form_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES discharged_patient_forms(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL, -- Name of the medication as entered/selected
    -- Dosage times
    time_7am TEXT,
    time_8am TEXT,
    time_noon TEXT,
    time_2pm TEXT,
    time_6pm TEXT,
    time_8pm TEXT,
    time_10pm TEXT,
    status TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for discharged_patient_forms table
CREATE TRIGGER set_discharged_forms_timestamp
BEFORE UPDATE ON discharged_patient_forms
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
