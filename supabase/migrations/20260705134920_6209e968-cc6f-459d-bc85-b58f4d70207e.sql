
-- 1) beauty_provider_stats -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beauty_provider_stats (
  provider_id UUID PRIMARY KEY REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  completed_bookings INTEGER NOT NULL DEFAULT 0,
  cancelled_bookings INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  response_time_minutes INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.beauty_provider_stats TO anon, authenticated;
GRANT ALL ON public.beauty_provider_stats TO service_role;

ALTER TABLE public.beauty_provider_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read beauty provider stats" ON public.beauty_provider_stats;
CREATE POLICY "Anyone can read beauty provider stats"
  ON public.beauty_provider_stats FOR SELECT
  USING (true);

-- 2) Refresh stats when a review changes ------------------------------------
CREATE OR REPLACE FUNCTION public.beauty_recompute_provider_stats(_provider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.beauty_provider_stats AS s (provider_id, review_count, avg_rating, updated_at)
  SELECT
    _provider_id,
    COUNT(*)::INT,
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0),
    now()
  FROM public.beauty_reviews
  WHERE provider_id = _provider_id
  ON CONFLICT (provider_id) DO UPDATE
    SET review_count = EXCLUDED.review_count,
        avg_rating   = EXCLUDED.avg_rating,
        updated_at   = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.beauty_reviews_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.beauty_recompute_provider_stats(COALESCE(NEW.provider_id, OLD.provider_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_reviews_stats ON public.beauty_reviews;
CREATE TRIGGER trg_beauty_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON public.beauty_reviews
FOR EACH ROW EXECUTE FUNCTION public.beauty_reviews_after_change();

-- 3) Block reviews on non-completed bookings --------------------------------
CREATE OR REPLACE FUNCTION public.beauty_reviews_enforce_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b_status TEXT;
BEGIN
  SELECT status::TEXT INTO b_status
  FROM public.beauty_bookings
  WHERE id = NEW.booking_id;

  IF b_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Reviews are only allowed for completed bookings (booking status: %)', b_status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_reviews_completed ON public.beauty_reviews;
CREATE TRIGGER trg_beauty_reviews_completed
BEFORE INSERT ON public.beauty_reviews
FOR EACH ROW EXECUTE FUNCTION public.beauty_reviews_enforce_completed();

-- 4) Auto-open a conversation when a booking is created ---------------------
CREATE OR REPLACE FUNCTION public.beauty_bookings_open_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.beauty_conversations (booking_id, provider_id, client_id, last_message_at)
  VALUES (NEW.id, NEW.provider_id, NEW.client_id, now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_bookings_conversation ON public.beauty_bookings;
CREATE TRIGGER trg_beauty_bookings_conversation
AFTER INSERT ON public.beauty_bookings
FOR EACH ROW EXECUTE FUNCTION public.beauty_bookings_open_conversation();

-- 5) Available-slots generator ---------------------------------------------
-- Returns bookable start times for the given service between two dates.
-- Uses the service duration, provider weekly hours, blocked periods, and
-- existing non-cancelled bookings.
CREATE OR REPLACE FUNCTION public.beauty_get_available_slots(
  _service_id UUID,
  _date_from  DATE,
  _date_to    DATE,
  _step_min   INT DEFAULT 30
)
RETURNS TABLE(slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_duration    INT;
BEGIN
  SELECT provider_id, duration_min INTO v_provider_id, v_duration
  FROM public.beauty_services WHERE id = _service_id;

  IF v_provider_id IS NULL THEN RETURN; END IF;
  IF _date_to > _date_from + INTERVAL '31 days' THEN
    _date_to := (_date_from + INTERVAL '31 days')::DATE;
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(_date_from, _date_to, INTERVAL '1 day')::DATE AS d
  ),
  windows AS (
    SELECT
      d,
      (d + a.start_time)::TIMESTAMPTZ AS win_start,
      (d + a.end_time)::TIMESTAMPTZ   AS win_end
    FROM days
    JOIN public.beauty_availability a
      ON a.provider_id = v_provider_id
     AND a.weekday = EXTRACT(ISODOW FROM d)::SMALLINT % 7  -- match 0=Sunday convention
  ),
  candidates AS (
    SELECT
      generate_series(win_start, win_end - make_interval(mins => v_duration), make_interval(mins => _step_min)) AS s_start
    FROM windows
  )
  SELECT
    c.s_start AS slot_start,
    c.s_start + make_interval(mins => v_duration) AS slot_end
  FROM candidates c
  WHERE c.s_start > now()
    -- not inside a blocked period
    AND NOT EXISTS (
      SELECT 1 FROM public.beauty_availability_blocks b
      WHERE b.provider_id = v_provider_id
        AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(c.s_start, c.s_start + make_interval(mins => v_duration), '[)')
    )
    -- not overlapping an existing non-cancelled booking
    AND NOT EXISTS (
      SELECT 1 FROM public.beauty_bookings bk
      WHERE bk.provider_id = v_provider_id
        AND bk.status::TEXT NOT IN ('cancelled','refunded','expired')
        AND tstzrange(bk.slot_start, bk.slot_end, '[)') && tstzrange(c.s_start, c.s_start + make_interval(mins => v_duration), '[)')
    )
  ORDER BY c.s_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.beauty_get_available_slots(UUID, DATE, DATE, INT) TO anon, authenticated;

-- 6) Realtime -------------------------------------------------------------
ALTER TABLE public.beauty_messages REPLICA IDENTITY FULL;
ALTER TABLE public.beauty_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.beauty_booking_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='beauty_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='beauty_bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_bookings';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='beauty_booking_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_booking_events';
  END IF;
END $$;
