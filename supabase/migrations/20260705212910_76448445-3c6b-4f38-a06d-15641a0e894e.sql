
ALTER TABLE public.beauty_bookings
  ADD COLUMN IF NOT EXISTS start_code text,
  ADD COLUMN IF NOT EXISTS completion_code text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_no_show_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_no_show_at timestamptz,
  ADD COLUMN IF NOT EXISTS code_attempts smallint NOT NULL DEFAULT 0;

ALTER TABLE public.beauty_reviews
  ADD COLUMN IF NOT EXISTS reviewer_role text NOT NULL DEFAULT 'client'
    CHECK (reviewer_role IN ('client','provider'));

UPDATE public.beauty_reviews SET reviewer_role = 'client' WHERE reviewer_role IS NULL;

ALTER TABLE public.beauty_reviews DROP CONSTRAINT IF EXISTS beauty_reviews_booking_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS beauty_reviews_booking_direction_key
  ON public.beauty_reviews(booking_id, reviewer_role);

CREATE OR REPLACE FUNCTION public._beauty_gen_code()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  n := (abs(('x' || substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 8))::bit(32)::int)) % 1000000;
  RETURN lpad(n::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public._beauty_bookings_mint_codes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status::text IN ('paid','confirmed') AND (NEW.start_code IS NULL OR NEW.completion_code IS NULL) THEN
    IF NEW.start_code IS NULL THEN NEW.start_code := public._beauty_gen_code(); END IF;
    IF NEW.completion_code IS NULL THEN NEW.completion_code := public._beauty_gen_code(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beauty_bookings_mint_codes ON public.beauty_bookings;
CREATE TRIGGER beauty_bookings_mint_codes
  BEFORE INSERT OR UPDATE OF status ON public.beauty_bookings
  FOR EACH ROW EXECUTE FUNCTION public._beauty_bookings_mint_codes();

UPDATE public.beauty_bookings
   SET start_code      = COALESCE(start_code, public._beauty_gen_code()),
       completion_code = COALESCE(completion_code, public._beauty_gen_code())
 WHERE status::text IN ('paid','confirmed','completed');

CREATE OR REPLACE FUNCTION public.beauty_submit_start_code(_booking_id uuid, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record;
BEGIN
  SELECT bb.*, bp.user_id AS provider_user_id INTO b
    FROM public.beauty_bookings bb
    JOIN public.beauty_providers bp ON bp.id = bb.provider_id
   WHERE bb.id = _booking_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found'); END IF;
  IF auth.uid() IS NULL OR auth.uid() <> b.provider_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF b.started_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_started', true);
  END IF;
  IF b.status::text NOT IN ('paid','confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;
  IF b.code_attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  END IF;
  IF b.start_code IS NULL OR trim(_code) <> b.start_code THEN
    UPDATE public.beauty_bookings SET code_attempts = code_attempts + 1 WHERE id = _booking_id;
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code', 'attempts_left', 5 - (b.code_attempts + 1));
  END IF;
  UPDATE public.beauty_bookings
     SET started_at = now(), status = 'confirmed', code_attempts = 0
   WHERE id = _booking_id;
  INSERT INTO public.beauty_booking_events(booking_id, event, actor_id, payload)
  VALUES (_booking_id, 'service_started', auth.uid(), jsonb_build_object('via','start_code'));
  RETURN jsonb_build_object('ok', true, 'started_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.beauty_complete_service(_booking_id uuid, _code text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; is_client boolean; is_provider boolean;
BEGIN
  SELECT bb.*, bp.user_id AS provider_user_id INTO b
    FROM public.beauty_bookings bb
    JOIN public.beauty_providers bp ON bp.id = bb.provider_id
   WHERE bb.id = _booking_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found'); END IF;
  is_client := (auth.uid() = b.client_id);
  is_provider := (auth.uid() = b.provider_user_id);
  IF NOT (is_client OR is_provider) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF b.started_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_started');
  END IF;
  IF b.completed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_completed', true);
  END IF;
  IF is_provider AND NOT is_client THEN
    IF b.code_attempts >= 5 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts');
    END IF;
    IF _code IS NULL OR trim(_code) <> COALESCE(b.completion_code,'') THEN
      UPDATE public.beauty_bookings SET code_attempts = code_attempts + 1 WHERE id = _booking_id;
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
    END IF;
  END IF;
  UPDATE public.beauty_bookings
     SET completed_at = now(), status = 'completed',
         auto_release_at = now() + interval '24 hours', code_attempts = 0
   WHERE id = _booking_id;
  INSERT INTO public.beauty_booking_events(booking_id, event, actor_id, payload)
  VALUES (_booking_id, 'service_completed', auth.uid(),
          jsonb_build_object('via', CASE WHEN is_client THEN 'client_validation' ELSE 'completion_code' END));
  RETURN jsonb_build_object('ok', true, 'completed_at', now(), 'auto_release_at', now() + interval '24 hours');
END;
$$;

CREATE OR REPLACE FUNCTION public.beauty_mark_no_show(_booking_id uuid, _who text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record;
BEGIN
  IF _who NOT IN ('client','provider') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_who');
  END IF;
  SELECT bb.*, bp.user_id AS provider_user_id INTO b
    FROM public.beauty_bookings bb
    JOIN public.beauty_providers bp ON bp.id = bb.provider_id
   WHERE bb.id = _booking_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found'); END IF;
  IF b.started_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_started');
  END IF;
  IF now() < b.slot_start + interval '15 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_early',
      'wait_until', b.slot_start + interval '15 minutes');
  END IF;
  IF _who = 'client' THEN
    IF auth.uid() <> b.provider_user_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'only_provider_can_mark_client_no_show');
    END IF;
    UPDATE public.beauty_bookings
       SET client_no_show_at = now(), status = 'no_show' WHERE id = _booking_id;
  ELSE
    IF auth.uid() <> b.client_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'only_client_can_mark_provider_no_show');
    END IF;
    UPDATE public.beauty_bookings
       SET provider_no_show_at = now(), status = 'disputed' WHERE id = _booking_id;
  END IF;
  INSERT INTO public.beauty_booking_events(booking_id, event, actor_id, payload)
  VALUES (_booking_id, 'no_show_' || _who, auth.uid(), '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

DROP POLICY IF EXISTS "Client can insert review for own booking" ON public.beauty_reviews;
DROP POLICY IF EXISTS "Provider or client can insert review" ON public.beauty_reviews;
CREATE POLICY "Provider or client can insert review"
ON public.beauty_reviews FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.beauty_bookings bb
    JOIN public.beauty_providers bp ON bp.id = bb.provider_id
    WHERE bb.id = beauty_reviews.booking_id
      AND (
        (reviewer_role = 'client'   AND bb.client_id = auth.uid())
     OR (reviewer_role = 'provider' AND bp.user_id  = auth.uid())
      )
  )
);

GRANT EXECUTE ON FUNCTION public.beauty_submit_start_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.beauty_complete_service(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.beauty_mark_no_show(uuid, text) TO authenticated;
