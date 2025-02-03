-- Create sms_system_settings table
CREATE TABLE IF NOT EXISTS sms_system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    batch_processing JSONB NOT NULL DEFAULT '{
        "rate": 5,
        "maxRetries": 3,
        "retryDelay": 300000,
        "maxSize": 10000
    }',
    performance JSONB NOT NULL DEFAULT '{
        "slaWarningThreshold": 900000,
        "slaCriticalThreshold": 1800000,
        "sampleRate": 100
    }',
    feature_flags JSONB NOT NULL DEFAULT '{
        "newBatchSystem": true,
        "analyticsDashboard": true,
        "performanceMonitoring": true
    }',
    cache JSONB NOT NULL DEFAULT '{
        "previewSize": 1000,
        "previewTtl": 3600
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Create sms_update_timestamp function
CREATE OR REPLACE FUNCTION sms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS sms_update_system_settings_timestamp ON sms_system_settings;
CREATE TRIGGER sms_update_system_settings_timestamp
    BEFORE UPDATE ON sms_system_settings
    FOR EACH ROW
    EXECUTE FUNCTION sms_update_timestamp();

-- Insert default settings if not exists
INSERT INTO sms_system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies
ALTER TABLE sms_system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
    ON sms_system_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow update access to authenticated users"
    ON sms_system_settings FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create sms_notification_preferences table if not exists
CREATE TABLE IF NOT EXISTS sms_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email BOOLEAN DEFAULT true,
    slack BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    thresholds JSONB NOT NULL DEFAULT '{
        "success_rate": 95,
        "error_rate": 5,
        "credits_used": 1000
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS sms_update_notification_preferences_timestamp ON sms_notification_preferences;
CREATE TRIGGER sms_update_notification_preferences_timestamp
    BEFORE UPDATE ON sms_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION sms_update_timestamp();

-- Create RLS policies for notification_preferences
ALTER TABLE sms_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
    ON sms_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON sms_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON sms_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create sms_slack_webhooks table if not exists
CREATE TABLE IF NOT EXISTS sms_slack_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS sms_update_slack_webhooks_timestamp ON sms_slack_webhooks;
CREATE TRIGGER sms_update_slack_webhooks_timestamp
    BEFORE UPDATE ON sms_slack_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION sms_update_timestamp();

-- Create RLS policies for slack_webhooks
ALTER TABLE sms_slack_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users"
    ON sms_slack_webhooks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow update access to admin users"
    ON sms_slack_webhooks FOR ALL
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    ));
