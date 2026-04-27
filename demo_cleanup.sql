-- Run this in Supabase SQL Editor

-- 1. Function to delete demo workspaces older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_demo_workspaces()
RETURNS void AS $$
BEGIN
  DELETE FROM workspaces
  WHERE user_id IN (
    SELECT user_id FROM subscriptions
    WHERE plan = 'demo'
    AND created_at < NOW() - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule it every hour via pg_cron (enable pg_cron extension first)
-- In Supabase: Dashboard > Database > Extensions > enable pg_cron
SELECT cron.schedule(
  'cleanup-demo-workspaces',
  '0 * * * *',
  $$SELECT cleanup_demo_workspaces()$$
);

-- 3. Also update subscriptions table to mark expired demos
CREATE OR REPLACE FUNCTION expire_demo_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE plan = 'demo'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'expire-demo-subscriptions',
  '*/10 * * * *',
  $$SELECT expire_demo_subscriptions()$$
);
