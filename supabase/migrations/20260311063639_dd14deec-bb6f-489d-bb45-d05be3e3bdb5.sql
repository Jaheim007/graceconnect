
-- Fix: When granting daily credits, force-expire ALL previous daily lots first
-- This prevents accumulation of daily credits across days

CREATE OR REPLACE FUNCTION public.grant_daily_credits(_user_id UUID, _amount NUMERIC DEFAULT 38.5)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_grant DATE;
  _lot_id UUID;
  _new_balance NUMERIC;
  _old_daily_total NUMERIC := 0;
  _lot RECORD;
BEGIN
  INSERT INTO user_credits (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_daily_grant INTO _last_grant
  FROM user_credits WHERE user_id = _user_id FOR UPDATE;

  IF _last_grant IS NOT NULL AND _last_grant >= CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_granted_today');
  END IF;

  -- First, run normal expiration for all lot types
  PERFORM expire_credit_lots(_user_id);

  -- CRITICAL: Force-expire ALL previous daily lots (even if not yet past expires_at)
  -- Daily credits must NEVER accumulate across days
  FOR _lot IN
    SELECT id, remaining FROM credit_lots
    WHERE user_id = _user_id
      AND lot_type = 'daily'
      AND is_expired = false
      AND remaining > 0
    FOR UPDATE
  LOOP
    _old_daily_total := _old_daily_total + _lot.remaining;
    UPDATE credit_lots SET is_expired = true, remaining = 0 WHERE id = _lot.id;
  END LOOP;

  -- Subtract old daily credits from balance
  IF _old_daily_total > 0 THEN
    UPDATE user_credits
    SET balance = GREATEST(balance - _old_daily_total, 0), updated_at = now()
    WHERE user_id = _user_id;

    SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _user_id;

    INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, action_label)
    VALUES (_user_id, 'expiration', -_old_daily_total, COALESCE(_new_balance, 0), 'daily_expired', 'Crédits quotidiens expirés');
  END IF;

  -- Grant new daily credits
  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, expires_at, source)
  VALUES (_user_id, 'daily', _amount, _amount, now() + interval '24 hours', 'daily_grant')
  RETURNING id INTO _lot_id;

  UPDATE user_credits SET
    balance = balance + _amount,
    lifetime_earned = lifetime_earned + _amount,
    last_daily_grant = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = _user_id;

  SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id)
  VALUES (_user_id, 'daily_grant', _amount, _new_balance, 'daily_credits', _lot_id);

  RETURN jsonb_build_object('ok', true, 'granted', _amount, 'balance', _new_balance);
END;
$$;

-- NOW: Clean up all existing accumulated daily lots
-- For each user with multiple active daily lots, keep only the most recent one
DO $$
DECLARE
  _user RECORD;
  _excess_total NUMERIC;
  _new_bal NUMERIC;
BEGIN
  FOR _user IN
    SELECT user_id, count(*) as cnt
    FROM credit_lots
    WHERE lot_type = 'daily' AND is_expired = false AND remaining > 0
    GROUP BY user_id
    HAVING count(*) > 1
  LOOP
    -- Expire all daily lots except the most recent one
    _excess_total := 0;
    
    WITH ranked AS (
      SELECT id, remaining, row_number() OVER (ORDER BY created_at DESC) as rn
      FROM credit_lots
      WHERE user_id = _user.user_id
        AND lot_type = 'daily'
        AND is_expired = false
        AND remaining > 0
    ),
    expired AS (
      UPDATE credit_lots SET is_expired = true, remaining = 0
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
      RETURNING remaining
    )
    SELECT COALESCE(sum(remaining), 0) INTO _excess_total FROM expired;

    IF _excess_total > 0 THEN
      UPDATE user_credits
      SET balance = GREATEST(balance - _excess_total, 0), updated_at = now()
      WHERE user_id = _user.user_id;

      SELECT balance INTO _new_bal FROM user_credits WHERE user_id = _user.user_id;

      INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, action_label)
      VALUES (_user.user_id, 'expiration', -_excess_total, COALESCE(_new_bal, 0), 'daily_cleanup', 'Correction cumul quotidien');
    END IF;
  END LOOP;
END $$;
