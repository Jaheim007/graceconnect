
-- Schedule performance-alerts weekly on Monday 7am
SELECT cron.schedule(
  'performance-alerts-weekly',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url:='https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/performance-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule auto-blog-draft weekly on Monday 9am
SELECT cron.schedule(
  'auto-blog-draft-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/auto-blog-draft',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule kyc-auto-validate every hour at :15
SELECT cron.schedule(
  'kyc-auto-validate-hourly',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/kyc-auto-validate',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
