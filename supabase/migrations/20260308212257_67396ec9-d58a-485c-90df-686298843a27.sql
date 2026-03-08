
-- Schedule: Release matured affiliate sales every 6 hours
SELECT cron.schedule(
  'release-matured-affiliate-sales',
  '0 */6 * * *',
  $$SELECT public.release_matured_affiliate_sales()$$
);

-- Schedule: Release matured partner commissions every 6 hours
SELECT cron.schedule(
  'release-matured-partner-commissions',
  '0 */6 * * *',
  $$SELECT public.release_matured_partner_commissions()$$
);

-- Schedule: Weekly report every Monday at 7am
SELECT cron.schedule(
  'weekly-report-monday',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/weekly-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule: Review request emails daily at 9am
SELECT cron.schedule(
  'review-request-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/review-request',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
