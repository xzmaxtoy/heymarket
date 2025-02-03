-- Add columns for tracking batch progress and errors
ALTER TABLE sms_batches
ADD COLUMN IF NOT EXISTS errors JSONB DEFAULT '{"categories": {}, "samples": []}'::jsonb,
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{"total": 0, "pending": 0, "processing": 0, "completed": 0, "failed": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS timing JSONB DEFAULT '{"created": null, "estimated_completion": null}'::jsonb,
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{"messages_per_second": 0, "success_rate": 0, "credits_used": 0}'::jsonb;
