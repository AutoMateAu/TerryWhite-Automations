-- Create notifications table based on NotificationItem
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('message', 'reminder')),
    title TEXT NOT NULL,
    content TEXT,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for notifications table
CREATE TRIGGER set_notifications_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
