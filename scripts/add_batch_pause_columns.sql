-- Add columns for pause functionality
ALTER TABLE sms_batches
ADD COLUMN IF NOT EXISTS pause_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resume_time TIMESTAMP WITH TIME ZONE;

-- Add pause status to status enum if not exists
DO $$ 
BEGIN
    -- Check if 'paused' exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
        WHERE typname = 'batch_status' 
        AND enumlabel = 'paused'
    ) THEN
        -- Add 'paused' to the enum
        ALTER TYPE batch_status ADD VALUE 'paused';
    END IF;
END $$;

-- Update existing indexes
REINDEX INDEX idx_sms_batches_status;
