-- 1. Reduce daily credits default from 38.5 to 20
CREATE OR REPLACE FUNCTION public.grant_daily_credits(_user_id UUID, _amount NUMERIC DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_lot_id UUID;
  _lot_id UUID;
  _new_balance NUMERIC;
BEGIN
  -- Expire any existing daily lot first (reset daily credits)
  UPDATE credit_lots
  SET is_expired = true
  WHERE user_id = _user_id
    AND lot_type = 'daily'
    AND is_expired = false;

  -- Check if already granted today
  SELECT id INTO _existing_lot_id
  FROM credit_lots
  WHERE user_id = _user_id
    AND lot_type = 'daily'
    AND granted_at::date = CURRENT_DATE
  ORDER BY granted_at DESC
  LIMIT 1;

  IF _existing_lot_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_granted_today');
  END IF;

  -- Create new daily lot (expires end of day)
  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, source, granted_at, expires_at)
  VALUES (
    _user_id, 'daily', _amount, _amount, 'daily_login',
    now(), (CURRENT_DATE + INTERVAL '1 day')::timestamptz
  )
  RETURNING id INTO _lot_id;

  -- Calculate new balance
  SELECT COALESCE(SUM(remaining), 0) INTO _new_balance
  FROM credit_lots
  WHERE user_id = _user_id AND is_expired = false
    AND (expires_at IS NULL OR expires_at > now());

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id)
  VALUES (_user_id, 'daily_grant', _amount, _new_balance, 'daily_credits', _lot_id);

  RETURN jsonb_build_object('ok', true, 'granted', _amount, 'balance', _new_balance);
END;
$$;

-- 2. Double heavy action costs
UPDATE credit_action_pricing SET cost_standard = 30, cost_premium = 50 WHERE action_key = 'generate_book';
UPDATE credit_action_pricing SET cost_standard = 16, cost_premium = 28 WHERE action_key = 'ai_course_structure';
UPDATE credit_action_pricing SET cost_standard = 10, cost_premium = 16 WHERE action_key = 'generate_illustration';
UPDATE credit_action_pricing SET cost_standard = 5, cost_premium = 8 WHERE action_key = 'export_pdf';
UPDATE credit_action_pricing SET cost_standard = 8, cost_premium = 14 WHERE action_key = 'amplify_chapter';
UPDATE credit_action_pricing SET cost_standard = 5, cost_premium = 8 WHERE action_key = 'generate_chapter';

-- 3. Deactivate AI cover generation
UPDATE credit_action_pricing SET is_active = false WHERE action_key = 'generate_cover';

-- 4. Add regenerate_pdf action
INSERT INTO credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order, is_active)
VALUES ('regenerate_pdf', 'Régénération PDF', 'export', 3, 5, 'Régénérer un PDF depuis un projet IA existant', 22, true)
ON CONFLICT (action_key) DO UPDATE SET cost_standard = 3, cost_premium = 5, is_active = true;

-- 5. Cooldown table
CREATE TABLE IF NOT EXISTS public.ai_generation_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cooldowns_user_action ON public.ai_generation_cooldowns (user_id, action_key, created_at DESC);

ALTER TABLE public.ai_generation_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cooldowns" ON public.ai_generation_cooldowns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to check cooldown (max 3 heavy generations per hour)
CREATE OR REPLACE FUNCTION public.check_generation_cooldown(_user_id UUID, _action_key TEXT, _max_per_hour INT DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
  _oldest TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MIN(created_at) INTO _count, _oldest
  FROM ai_generation_cooldowns
  WHERE user_id = _user_id
    AND action_key = _action_key
    AND created_at > now() - INTERVAL '1 hour';

  IF _count >= _max_per_hour THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'cooldown_active',
      'count', _count,
      'retry_after', EXTRACT(EPOCH FROM (_oldest + INTERVAL '1 hour' - now()))::int
    );
  END IF;

  -- Record this generation
  INSERT INTO ai_generation_cooldowns (user_id, action_key) VALUES (_user_id, _action_key);

  -- Cleanup old entries (older than 2 hours)
  DELETE FROM ai_generation_cooldowns WHERE created_at < now() - INTERVAL '2 hours';

  RETURN jsonb_build_object('ok', true, 'remaining', _max_per_hour - _count - 1);
END;
$$;