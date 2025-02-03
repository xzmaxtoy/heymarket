-- Function to get channel distribution
CREATE OR REPLACE FUNCTION sms_get_channel_distribution()
RETURNS TABLE (
  name text,
  value bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(channels) as channel,
    COUNT(*) as count
  FROM notifications
  GROUP BY channel
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily notification volume
CREATE OR REPLACE FUNCTION sms_get_daily_notification_volume(start_date timestamp)
RETURNS TABLE (
  date date,
  count bigint,
  errors bigint,
  warnings bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      date_trunc('day', start_date),
      date_trunc('day', CURRENT_TIMESTAMP),
      '1 day'::interval
    )::date as date
  )
  SELECT
    dates.date,
    COUNT(n.id) as count,
    COUNT(CASE WHEN n.severity = 'error' THEN 1 END) as errors,
    COUNT(CASE WHEN n.severity = 'warning' THEN 1 END) as warnings
  FROM dates
  LEFT JOIN notifications n ON date_trunc('day', n.delivered_at) = dates.date
  GROUP BY dates.date
  ORDER BY dates.date;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification metrics
CREATE OR REPLACE FUNCTION sms_get_notification_metrics()
RETURNS TABLE (
  total_count bigint,
  unread_count bigint,
  error_count bigint,
  warning_count bigint,
  avg_daily_volume numeric,
  peak_daily_volume bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_counts AS (
    SELECT
      date_trunc('day', delivered_at) as day,
      COUNT(*) as daily_count
    FROM notifications
    GROUP BY day
  )
  SELECT
    (SELECT COUNT(*) FROM notifications) as total_count,
    (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) as unread_count,
    (SELECT COUNT(*) FROM notifications WHERE severity = 'error') as error_count,
    (SELECT COUNT(*) FROM notifications WHERE severity = 'warning') as warning_count,
    COALESCE(AVG(daily_count), 0) as avg_daily_volume,
    COALESCE(MAX(daily_count), 0) as peak_daily_volume
  FROM daily_counts;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification trends
CREATE OR REPLACE FUNCTION sms_get_notification_trends(days_back integer)
RETURNS TABLE (
  period date,
  total_count bigint,
  error_rate numeric,
  read_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH periods AS (
    SELECT generate_series(
      date_trunc('day', CURRENT_TIMESTAMP - (days_back || ' days')::interval),
      date_trunc('day', CURRENT_TIMESTAMP),
      '1 day'::interval
    )::date as period
  )
  SELECT
    p.period,
    COUNT(n.id) as total_count,
    COALESCE(
      COUNT(CASE WHEN n.severity = 'error' THEN 1 END)::numeric / 
      NULLIF(COUNT(n.id), 0) * 100,
      0
    ) as error_rate,
    COALESCE(
      COUNT(CASE WHEN n.read_at IS NOT NULL THEN 1 END)::numeric / 
      NULLIF(COUNT(n.id), 0) * 100,
      0
    ) as read_rate
  FROM periods p
  LEFT JOIN notifications n ON date_trunc('day', n.delivered_at) = p.period
  GROUP BY p.period
  ORDER BY p.period;
END;
$$ LANGUAGE plpgsql;
