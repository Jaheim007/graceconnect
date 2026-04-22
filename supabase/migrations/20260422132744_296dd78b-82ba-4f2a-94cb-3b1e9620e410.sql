-- Add unsubscribe column to profiles for future opt-out support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_marketing_opted_out BOOLEAN NOT NULL DEFAULT false;

-- Remove existing job if rerunning
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'inspiration-digest-tue-thu') THEN
    PERFORM cron.unschedule('inspiration-digest-tue-thu');
  END IF;
END $$;

-- Schedule: minute=0, hour=9, day-of-month=*, month=*, day-of-week=2,4 (Tue=2, Thu=4)
SELECT cron.schedule(
  'inspiration-digest-tue-thu',
  '0 9 * * 2,4',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/inspiration-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM'
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'time', now()::text)
  ) AS request_id;
  $$
);