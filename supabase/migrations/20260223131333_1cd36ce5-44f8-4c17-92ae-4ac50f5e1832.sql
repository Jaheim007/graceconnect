-- Schedule automated emails daily at 8 AM UTC
SELECT cron.schedule(
  'automated-emails-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/automated-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := '{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);