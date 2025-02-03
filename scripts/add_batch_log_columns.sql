-- Add missing columns to sms_batch_log table
ALTER TABLE sms_batch_log
ADD COLUMN IF NOT EXISTS message_id text,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS error_category text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{"priority": "normal", "retryStrategy": {"maxAttempts": 3, "backoffMinutes": 5}}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_batch_log_message_id ON sms_batch_log(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_batch_log_error_category ON sms_batch_log(error_category);

-- Update existing rows with default metadata if null
UPDATE sms_batch_log 
SET metadata = '{"priority": "normal", "retryStrategy": {"maxAttempts": 3, "backoffMinutes": 5}}'::jsonb
WHERE metadata IS NULL;

-- Rename columns to match code
ALTER TABLE sms_batch_log
RENAME COLUMN error TO error_message;

-- Add message_id column for Heymarket API response
ALTER TABLE sms_batch_log
ADD COLUMN IF NOT EXISTS heymarket_message_id text;
