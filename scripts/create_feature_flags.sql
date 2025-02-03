-- Create feature flags table
CREATE TABLE IF NOT EXISTS sms_feature_flags (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  percentage INTEGER DEFAULT 100,
  users TEXT[] DEFAULT '{}',
  conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_feature_flags_updated_at
  BEFORE UPDATE ON sms_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_feature_flags_updated_at();

-- Insert default feature flags
INSERT INTO sms_feature_flags (key, enabled, percentage)
VALUES 
  ('new-batch-system', true, 100),
  ('new-preview-system', true, 100),
  ('new-analytics', false, 0)
ON CONFLICT (key) 
DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  percentage = EXCLUDED.percentage;
