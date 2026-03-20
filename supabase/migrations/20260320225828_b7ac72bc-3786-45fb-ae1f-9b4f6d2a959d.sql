UPDATE public.user_credits 
SET balance = balance + 700, 
    lifetime_earned = lifetime_earned + 700,
    updated_at = now()
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830';