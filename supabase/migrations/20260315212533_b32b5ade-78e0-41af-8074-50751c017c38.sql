-- Grant 200 non-expiring credits to user c073d267-b5ed-45e2-a5df-80dc6ab7d830

DO $$
DECLARE
  _user_id uuid := 'c073d267-b5ed-45e2-a5df-80dc6ab7d830';
  _amount numeric := 200;
  _lot_id uuid;
  _current_balance numeric;
BEGIN
  -- Get current balance
  SELECT COALESCE(SUM(remaining), 0) INTO _current_balance
  FROM public.credit_lots
  WHERE user_id = _user_id AND is_expired = false;

  -- Create a new purchased lot (never expires)
  INSERT INTO public.credit_lots (
    user_id,
    lot_type,
    initial_amount,
    remaining,
    source,
    granted_at,
    expires_at
  ) VALUES (
    _user_id,
    'purchased',
    _amount,
    _amount,
    'manual_grant_admin',
    now(),
    NULL  -- Purchased credits never expire
  ) RETURNING id INTO _lot_id;

  -- Log the transaction using 'purchase' tx_type
  INSERT INTO public.credit_transactions (
    user_id,
    tx_type,
    amount,
    balance_after,
    lot_id,
    action_key,
    action_label,
    metadata
  ) VALUES (
    _user_id,
    'purchase',
    _amount,
    _current_balance + _amount,
    _lot_id,
    'admin_grant',
    'Crédits offerts par l''administrateur',
    jsonb_build_object('granted_by', 'admin', 'reason', 'manual_grant')
  );

  RAISE NOTICE 'Successfully granted % credits to user %', _amount, _user_id;
END $$;