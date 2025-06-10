-- Create call_logs table for tracking phone calls to customers
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comments TEXT,
    created_by TEXT, -- Could be used for user tracking in the future
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by customer
CREATE INDEX idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX idx_call_logs_call_date ON call_logs(call_date);

-- Insert some sample call logs
INSERT INTO call_logs (customer_id, call_date, comments, created_by)
SELECT 
    id, 
    NOW() - INTERVAL '2 days', 
    'Called regarding overdue payment. Patient agreed to pay by end of week.',
    'Pharmacy Staff'
FROM customer_accounts 
WHERE patient_name = 'Robert Johnson';

INSERT INTO call_logs (customer_id, call_date, comments, created_by)
SELECT 
    id, 
    NOW() - INTERVAL '5 days', 
    'Left voicemail about medication pickup reminder.',
    'Pharmacy Staff'
FROM customer_accounts 
WHERE patient_name = 'Jane Smith';

INSERT INTO call_logs (customer_id, call_date, comments, created_by)
SELECT 
    id, 
    NOW() - INTERVAL '1 day', 
    'Discussed payment plan options. Patient will call back tomorrow.',
    'Pharmacy Staff'
FROM customer_accounts 
WHERE patient_name = 'Michael Wilson';
