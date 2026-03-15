-- Force-expire stale daily lots for this user so get_credit_summary returns clean data
UPDATE public.credit_lots
SET is_expired = true, remaining = 0
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830'
  AND is_expired = false
  AND expires_at IS NOT NULL
  AND expires_at <= now();