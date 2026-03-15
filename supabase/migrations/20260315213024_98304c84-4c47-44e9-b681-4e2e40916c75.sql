-- Sync user_credits balance with actual credit_lots for user c073d267-b5ed-45e2-a5df-80dc6ab7d830
UPDATE public.user_credits
SET 
  balance = (
    SELECT COALESCE(SUM(remaining), 0) 
    FROM public.credit_lots 
    WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830' 
      AND is_expired = false 
      AND remaining > 0
      AND (expires_at IS NULL OR expires_at > now())
  ),
  lifetime_earned = lifetime_earned + 350,  -- 200 + 150 previously granted
  updated_at = now()
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830';