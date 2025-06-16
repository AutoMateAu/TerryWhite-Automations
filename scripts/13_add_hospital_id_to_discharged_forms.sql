ALTER TABLE discharged_patient_forms
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;

-- Set up Row Level Security (RLS) for discharged_patient_forms
ALTER TABLE discharged_patient_forms ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all forms
CREATE POLICY "Admins can view all discharged forms." ON discharged_patient_forms
  FOR SELECT USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Policy for doctors to view forms from their hospital
CREATE POLICY "Doctors can view discharged forms from their hospital." ON discharged_patient_forms
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'doctor' AND
    hospital_id = (SELECT hospital_id FROM user_profiles WHERE id = auth.uid())
  );

-- Policy for nurses to view forms from their hospital
CREATE POLICY "Nurses can view discharged forms from their hospital." ON discharged_patient_forms
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'nurse' AND
    hospital_id = (SELECT hospital_id FROM user_profiles WHERE id = auth.uid())
  );

-- Policy for doctors to insert forms for their hospital
CREATE POLICY "Doctors can insert discharged forms for their hospital." ON discharged_patient_forms
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'doctor' AND
    hospital_id = (SELECT hospital_id FROM user_profiles WHERE id = auth.uid())
  );

-- Policy for doctors to update forms for their hospital
CREATE POLICY "Doctors can update discharged forms for their hospital." ON discharged_patient_forms
  FOR UPDATE USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'doctor' AND
    hospital_id = (SELECT hospital_id FROM user_profiles WHERE id = auth.uid())
  ) WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'doctor' AND
    hospital_id = (SELECT hospital_id FROM user_profiles WHERE id = auth.uid())
  );

-- Policy for admins to insert/update/delete all forms
CREATE POLICY "Admins can manage all discharged forms." ON discharged_patient_forms
  FOR ALL USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
