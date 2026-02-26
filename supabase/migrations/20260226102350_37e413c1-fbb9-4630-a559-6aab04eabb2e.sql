
-- Update cron job for automated-emails to use new custom domain
SELECT cron.unschedule('automated-emails-daily');
SELECT cron.schedule(
  'automated-emails-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://api.siteviral.com/functions/v1/automated-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);

-- Update cron job for release-settlement to use new custom domain
SELECT cron.unschedule('release-settlement-hourly');
SELECT cron.schedule(
  'release-settlement-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://api.siteviral.com/functions/v1/release-settlement',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
