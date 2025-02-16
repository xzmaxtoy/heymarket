-- Add feature flag for advanced batch filters
INSERT INTO sms_feature_flags (
    key,
    enabled,
    percentage,
    users,
    conditions,
    created_at,
    updated_at
)
VALUES (
    'advanced_batch_filters',
    false, -- Start disabled for gradual rollout
    100,   -- Available to 100% of users when enabled
    '{}',  -- No specific user targeting initially
    '{"description": "Enable advanced filtering capabilities in batch creation process"}'::jsonb,
    NOW(),
    NOW()
);

-- Add settings for filter templates
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS sms_batch_filter_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        filter_config JSONB NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add indexes if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_batch_filter_templates_name'
    ) THEN
        CREATE INDEX idx_batch_filter_templates_name 
        ON sms_batch_filter_templates (name);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_batch_filter_templates_created_by'
    ) THEN
        CREATE INDEX idx_batch_filter_templates_created_by 
        ON sms_batch_filter_templates (created_by);
    END IF;
END $$;
