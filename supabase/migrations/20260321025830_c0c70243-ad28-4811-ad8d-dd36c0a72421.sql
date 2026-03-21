
INSERT INTO public.credit_lots (user_id, lot_type, initial_amount, remaining, source, granted_at, expires_at)
VALUES ('c073d267-b5ed-45e2-a5df-80dc6ab7d830', 'bonus', 500, 500, 'admin_grant_march21b', now(), now() + interval '90 days');

UPDATE public.user_credits
SET balance = balance + 500,
    lifetime_earned = lifetime_earned + 500,
    updated_at = now()
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830';
