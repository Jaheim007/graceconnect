
-- Schedule rate_limits cleanup every 5 minutes
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/5 * * * *',
  $$SELECT public.cleanup_rate_limits()$$
);
