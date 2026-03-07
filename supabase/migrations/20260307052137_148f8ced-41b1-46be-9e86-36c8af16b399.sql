
SELECT cron.schedule(
  'aggregate-metrics-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/aggregate-metrics',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
