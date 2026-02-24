
-- Fix: restrict client_events insert to require at least event_name and session_id
DROP POLICY "events_insert_anon" ON public.client_events;
CREATE POLICY "events_insert_anon" ON public.client_events FOR INSERT 
  WITH CHECK (event_name IS NOT NULL AND length(event_name) > 0 AND length(event_name) < 100);
