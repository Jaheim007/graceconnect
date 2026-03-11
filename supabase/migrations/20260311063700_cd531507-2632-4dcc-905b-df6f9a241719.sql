
-- Force-sync all user balances to match actual remaining lots
UPDATE user_credits uc
SET balance = COALESCE((
  SELECT sum(remaining) FROM credit_lots cl
  WHERE cl.user_id = uc.user_id AND cl.is_expired = false AND cl.remaining > 0
), 0),
updated_at = now();
