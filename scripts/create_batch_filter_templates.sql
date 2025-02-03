-- Create batch filter templates table
CREATE TABLE sms_batch_filter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_sms_batch_filter_templates_created_by ON sms_batch_filter_templates(created_by);
CREATE INDEX idx_sms_batch_filter_templates_last_used ON sms_batch_filter_templates(last_used_at);
CREATE INDEX idx_sms_batch_filter_templates_is_public ON sms_batch_filter_templates(is_public);

-- Add RLS policies
ALTER TABLE sms_batch_filter_templates ENABLE ROW LEVEL SECURITY;

-- Users can read their own templates and public templates
CREATE POLICY "Users can read own and public templates" ON sms_batch_filter_templates
  FOR SELECT USING (
    auth.uid() = created_by OR is_public = true
  );

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON sms_batch_filter_templates
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON sms_batch_filter_templates
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON sms_batch_filter_templates
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- Add comments
COMMENT ON TABLE sms_batch_filter_templates IS 'Saved customer filter templates for batch creation';
COMMENT ON COLUMN sms_batch_filter_templates.filter IS 'JSONB object containing filter conditions and logic';
COMMENT ON COLUMN sms_batch_filter_templates.is_public IS 'Whether this template is available to all users';
COMMENT ON COLUMN sms_batch_filter_templates.metadata IS 'Additional metadata like categories, tags, etc';

-- Create function to update last_used_at
CREATE OR REPLACE FUNCTION update_filter_template_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sms_batch_filter_templates
  SET last_used_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_used_at when template is used
CREATE TRIGGER update_filter_template_last_used_trigger
  AFTER UPDATE OF filter ON sms_batch_filter_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_filter_template_last_used();
