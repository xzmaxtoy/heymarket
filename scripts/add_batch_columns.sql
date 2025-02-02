-- Add columns for tracking batch progress
ALTER TABLE sms_batches
ADD COLUMN IF NOT EXISTS pending_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_batches_status ON sms_batches(status);
CREATE INDEX IF NOT EXISTS idx_sms_batches_created_at ON sms_batches(created_at);
