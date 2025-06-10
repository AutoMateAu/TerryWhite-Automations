-- Create customer_accounts table
CREATE TABLE customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    patient_name TEXT NOT NULL,
    mrn TEXT NOT NULL,
    total_owed DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_payment_date DATE,
    last_payment_amount DECIMAL(10, 2),
    status TEXT CHECK (status IN ('current', 'overdue', 'paid')) NOT NULL DEFAULT 'current',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_records table
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'insurance', 'other')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discharge_form_accounts table to link discharge forms to accounts
CREATE TABLE discharge_form_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE,
    discharge_form_id UUID REFERENCES discharged_patient_forms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for customer_accounts table
CREATE TRIGGER set_customer_accounts_timestamp
BEFORE UPDATE ON customer_accounts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert some sample data
INSERT INTO customer_accounts (patient_id, patient_name, mrn, total_owed, status)
VALUES 
    (gen_random_uuid(), 'John Doe', 'MRN001', 245.50, 'current'),
    (gen_random_uuid(), 'Jane Smith', 'MRN002', 89.25, 'current'),
    (gen_random_uuid(), 'Robert Johnson', 'MRN003', 567.80, 'overdue'),
    (gen_random_uuid(), 'Emily Davis', 'MRN004', 0.00, 'paid'),
    (gen_random_uuid(), 'Michael Wilson', 'MRN005', 423.15, 'overdue');

-- Insert sample payment records
INSERT INTO payment_records (customer_id, amount, payment_date, payment_method, notes)
SELECT 
    id, 
    100.00, 
    NOW() - INTERVAL '10 days', 
    'card', 
    'Initial payment'
FROM customer_accounts 
WHERE patient_name = 'John Doe';

INSERT INTO payment_records (customer_id, amount, payment_date, payment_method, notes)
SELECT 
    id, 
    50.00, 
    NOW() - INTERVAL '5 days', 
    'cash', 
    'Partial payment'
FROM customer_accounts 
WHERE patient_name = 'Jane Smith';
