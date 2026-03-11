DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.credit_lots
    WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830'
      AND source = 'manual_refund:generate_illustration_404_20260311'
  ) THEN
    RAISE NOTICE 'Manual refund already applied';
    RETURN;
  END IF;

  PERFORM public.grant_bonus_credits(
    _user_id => 'c073d267-b5ed-45e2-a5df-80dc6ab7d830',
    _amount => 81.20,
    _source => 'manual_refund:generate_illustration_404_20260311',
    _expires_in_days => 60
  );

  INSERT INTO public.audit_logs (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    'c073d267-b5ed-45e2-a5df-80dc6ab7d830',
    'c93a8030-882b-446b-b432-5b2fcd2a6543',
    'credits.manual_refund',
    'credit_transactions',
    NULL,
    jsonb_build_object(
      'action_key', 'generate_illustration',
      'reason', 'gemini_404_failures',
      'amount', 81.20,
      'failed_charges', 14,
      'window_start', '2026-03-11T20:52:54Z',
      'window_end', '2026-03-11T20:55:51.5Z'
    )
  );
END $$;