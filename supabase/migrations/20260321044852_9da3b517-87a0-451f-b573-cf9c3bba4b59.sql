INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, source, granted_at, expires_at)
VALUES ('c073d267-b5ed-45e2-a5df-80dc6ab7d830', 'bonus', 1000, 1000, 'admin_grant', now(), now() + interval '365 days');

INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, action_label, metadata)
VALUES ('c073d267-b5ed-45e2-a5df-80dc6ab7d830', 'bonus_grant', 1000, 1023.20, 'admin_grant', 'Admin Grant +1000', '{"reason": "manual_admin_grant"}'::jsonb);

UPDATE user_credits 
SET balance = balance + 1000, 
    lifetime_earned = lifetime_earned + 1000, 
    updated_at = now()
WHERE user_id = 'c073d267-b5ed-45e2-a5df-80dc6ab7d830';