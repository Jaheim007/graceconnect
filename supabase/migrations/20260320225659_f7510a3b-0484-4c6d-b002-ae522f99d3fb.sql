INSERT INTO public.credit_lots (user_id, lot_type, initial_amount, remaining, source, expires_at)
VALUES (
  'c073d267-b5ed-45e2-a5df-80dc6ab7d830',
  'bonus',
  700,
  700,
  'admin_grant',
  now() + interval '365 days'
);

INSERT INTO public.credit_transactions (user_id, tx_type, amount, balance_after, action_key, action_label, metadata)
SELECT 
  'c073d267-b5ed-45e2-a5df-80dc6ab7d830',
  'bonus_grant',
  700,
  COALESCE(SUM(remaining), 0) + 700,
  'admin_grant',
  'Bonus admin',
  '{"source": "admin_grant"}'::jsonb
FROM public.credit_lots
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830'
  AND is_expired = false;