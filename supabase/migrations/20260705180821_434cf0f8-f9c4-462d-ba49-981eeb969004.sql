
CREATE OR REPLACE FUNCTION public.beauty_set_auto_release()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
    IF NEW.auto_release_at IS NULL THEN NEW.auto_release_at := NEW.completed_at + interval '24 hours'; END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS beauty_bookings_auto_release ON public.beauty_bookings;
CREATE TRIGGER beauty_bookings_auto_release
BEFORE UPDATE ON public.beauty_bookings
FOR EACH ROW EXECUTE FUNCTION public.beauty_set_auto_release();

CREATE OR REPLACE FUNCTION public.beauty_review_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b RECORD;
BEGIN
  SELECT client_id, provider_id, status INTO b FROM public.beauty_bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;
  IF b.status <> 'completed' THEN RAISE EXCEPTION 'review_only_after_completion'; END IF;
  IF NEW.client_id <> b.client_id THEN RAISE EXCEPTION 'only_client_can_review'; END IF;
  NEW.provider_id := b.provider_id;
  IF NEW.rating < 1 OR NEW.rating > 5 THEN RAISE EXCEPTION 'invalid_rating'; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS beauty_reviews_guard ON public.beauty_reviews;
CREATE TRIGGER beauty_reviews_guard
BEFORE INSERT ON public.beauty_reviews
FOR EACH ROW EXECUTE FUNCTION public.beauty_review_guard();

CREATE OR REPLACE FUNCTION public.beauty_refresh_provider_stats(p_provider_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg numeric; v_reviews int; v_total int; v_completed int;
BEGIN
  SELECT COALESCE(AVG(rating), 0)::numeric(3,2), COUNT(*) INTO v_avg, v_reviews
    FROM public.beauty_reviews WHERE provider_id = p_provider_id;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed') INTO v_total, v_completed
    FROM public.beauty_bookings WHERE provider_id = p_provider_id;
  INSERT INTO public.beauty_provider_stats(provider_id, avg_rating, total_reviews, total_bookings, completed_bookings, completion_rate, updated_at)
  VALUES (p_provider_id, v_avg, v_reviews, v_total, v_completed,
    CASE WHEN v_total > 0 THEN (v_completed::numeric / v_total::numeric)::numeric(4,3) ELSE 0 END, now())
  ON CONFLICT (provider_id) DO UPDATE
    SET avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        total_bookings = EXCLUDED.total_bookings,
        completed_bookings = EXCLUDED.completed_bookings,
        completion_rate = EXCLUDED.completion_rate,
        updated_at = now();
END; $$;

CREATE OR REPLACE FUNCTION public.beauty_stats_on_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.beauty_refresh_provider_stats(COALESCE(NEW.provider_id, OLD.provider_id)); RETURN COALESCE(NEW, OLD); END; $$;

DROP TRIGGER IF EXISTS beauty_reviews_stats ON public.beauty_reviews;
CREATE TRIGGER beauty_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON public.beauty_reviews
FOR EACH ROW EXECUTE FUNCTION public.beauty_stats_on_review();

CREATE OR REPLACE FUNCTION public.beauty_stats_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.beauty_refresh_provider_stats(COALESCE(NEW.provider_id, OLD.provider_id)); RETURN COALESCE(NEW, OLD); END; $$;

DROP TRIGGER IF EXISTS beauty_bookings_stats ON public.beauty_bookings;
CREATE TRIGGER beauty_bookings_stats
AFTER INSERT OR UPDATE OF status OR DELETE ON public.beauty_bookings
FOR EACH ROW EXECUTE FUNCTION public.beauty_stats_on_booking();

-- Schedule autorelease every 15 minutes (unschedule prior if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'beauty-autorelease-15m') THEN
    PERFORM cron.unschedule('beauty-autorelease-15m');
  END IF;
END $$;

SELECT cron.schedule(
  'beauty-autorelease-15m',
  '*/15 * * * *',
  $$SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/beauty-autorelease',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('trigger', 'cron')
  );$$
);
