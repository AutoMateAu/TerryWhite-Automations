-- Add a new column for payment due date to the customer_accounts table
ALTER TABLE customer_accounts
ADD COLUMN due_date DATE;

-- Optional: Backfill existing accounts with a default due date (e.g., 30 days from creation or last payment)
-- This is a one-time operation and can be adjusted based on business logic.
-- For simplicity, we'll set it to 30 days from created_at if total_owed > 0, otherwise NULL.
UPDATE customer_accounts
SET due_date = (created_at + INTERVAL '30 days')::date
WHERE total_owed > 0 AND due_date IS NULL;
