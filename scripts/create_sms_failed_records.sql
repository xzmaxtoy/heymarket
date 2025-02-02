CREATE TABLE sms_failed_records (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    batch_id VARCHAR(255),
    message_text TEXT NOT NULL,
    error_message TEXT,
    error_category VARCHAR(50),
    attempts INTEGER DEFAULT 1,
    rate_limit_info JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_failed_phone ON sms_failed_records(phone_number);
CREATE INDEX idx_sms_failed_batch ON sms_failed_records(batch_id);
