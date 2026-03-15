-- Record the credit transaction for the lot already inserted
INSERT INTO public.credit_transactions (user_id, amount, balance_after, tx_type, action_label, metadata)
VALUES (
  'c073d267-b5ed-45e2-a5df-80dc6ab7d830',
  150,
  (SELECT COALESCE(SUM(remaining), 0) FROM public.credit_lots WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830' AND is_expired = false),
  'bonus_grant',
  'Admin bonus grant',
  '{"reason": "manual_admin_grant"}'::jsonb
);