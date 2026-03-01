
-- 1. Atomic increment for sales_count
CREATE OR REPLACE FUNCTION public.increment_sales_count(_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.digital_products
  SET sales_count = COALESCE(sales_count, 0) + 1
  WHERE id = _product_id;
END;
$$;

-- 2. Atomic increment for campaign current_amount
CREATE OR REPLACE FUNCTION public.increment_campaign_amount(_campaign_id uuid, _amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.donation_campaigns
  SET current_amount = COALESCE(current_amount, 0) + _amount
  WHERE id = _campaign_id;
END;
$$;

-- 3. Persistent rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only used by service role in edge functions
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL USING (false);

-- 4. Atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(_key text, _max integer DEFAULT 30, _window_seconds integer DEFAULT 60)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _entry record;
  _now timestamptz := now();
  _remaining integer;
BEGIN
  SELECT * INTO _entry FROM public.rate_limits WHERE key = _key FOR UPDATE;

  IF _entry IS NULL OR (_now - _entry.window_start) > make_interval(secs => _window_seconds) THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (_key, 1, _now)
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = _now;
    RETURN jsonb_build_object('allowed', true, 'remaining', _max - 1);
  END IF;

  UPDATE public.rate_limits SET count = count + 1 WHERE key = _key;

  _remaining := GREATEST(0, _max - (_entry.count + 1));

  IF _entry.count + 1 > _max THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', _remaining);
END;
$$;

-- 5. Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE (now() - window_start) > interval '5 minutes';
END;
$$;
