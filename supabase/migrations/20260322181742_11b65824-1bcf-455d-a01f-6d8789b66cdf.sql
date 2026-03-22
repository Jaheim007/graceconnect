-- Schedule retry-webhooks to run every 2 minutes
SELECT cron.schedule(
  'retry-failed-webhooks',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/retry-webhooks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);