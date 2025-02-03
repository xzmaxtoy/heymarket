-- Create batch preview cache table
CREATE TABLE IF NOT EXISTS sms_batch_preview_cache (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  preview_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  character_count INTEGER NOT NULL,
  segments INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(batch_id, customer_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_batch_preview_cache_batch_id ON sms_batch_preview_cache(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_preview_cache_expires_at ON sms_batch_preview_cache(expires_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_preview_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_batch_preview_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically cleanup expired entries
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_preview_cache()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_preview_cache();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_preview_cache_trigger
  AFTER INSERT ON sms_batch_preview_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_preview_cache();

-- Create function to update expires_at timestamp
CREATE OR REPLACE FUNCTION update_preview_cache_expires_at()
RETURNS trigger AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preview_cache_expires_at_trigger
  BEFORE INSERT OR UPDATE ON sms_batch_preview_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_cache_expires_at();
