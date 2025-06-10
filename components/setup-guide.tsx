"use client"

import { useState } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Database, ExternalLink } from "lucide-react"

interface SetupGuideProps {
  onClose?: () => void
}

export function SetupGuide({ onClose }: SetupGuideProps) {
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- Create customer_accounts table
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

-- Helper function to update updated_at timestamp (if not already created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
        CREATE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END
$$;

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
WHERE patient_name = 'Jane Smith';`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>Database Setup Required</AlertTitle>
        <AlertDescription>
          The accounting module requires database tables to be set up in your Supabase project. You're currently using
          mock data.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="instructions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="sql">SQL Script</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4">
          <h3 className="text-lg font-medium">Setup Instructions</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              Log in to your Supabase dashboard at{" "}
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 inline-flex items-center"
              >
                https://app.supabase.com
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </li>
            <li>Select your project</li>
            <li>
              Go to the <strong>SQL Editor</strong> section in the left sidebar
            </li>
            <li>Create a new query by clicking the "+" button</li>
            <li>Copy the SQL script from the "SQL Script" tab</li>
            <li>Paste the script into the SQL Editor</li>
            <li>Click the "Run" button to execute the SQL code</li>
            <li>Refresh this page after running the SQL script</li>
          </ol>

          <div className="mt-6">
            <h4 className="font-medium mb-2">What this script does:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Creates tables for customer accounts and payment records</li>
              <li>Sets up relationships between tables</li>
              <li>Creates triggers for timestamp management</li>
              <li>Adds sample data to get you started</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="sql">
          <div className="relative">
            <Button variant="outline" size="sm" className="absolute right-2 top-2 z-10" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </>
              )}
            </Button>
            <Code className="text-xs overflow-auto max-h-[400px] p-4">{sqlScript}</Code>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Continue with Mock Data
        </Button>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    </div>
  )
}
