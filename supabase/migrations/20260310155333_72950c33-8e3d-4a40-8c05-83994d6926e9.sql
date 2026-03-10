-- Retroactive refund: Grant bonus credits to users who were debited for AI actions
-- in the last 30 days. Conservative 50% goodwill refund since we can't distinguish
-- success from failure in transaction data.

DO $$
DECLARE
  r RECORD;
  total_refunded NUMERIC := 0;
BEGIN
  FOR r IN
    SELECT 
      ct.user_id,
      SUM(ct.amount) as total_debited,
      COUNT(*) as tx_count
    FROM credit_transactions ct
    WHERE ct.tx_type = 'consumption'
      AND ct.action_key IN ('transcribe_media', 'generate_cover', 'generate_illustration', 'generate_book', 'generate_chapter')
      AND ct.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ct.user_id
  LOOP
    IF r.total_debited > 0 THEN
      PERFORM grant_bonus_credits(
        r.user_id,
        GREATEST(1, ROUND(r.total_debited * 0.5)),
        'refund:retroactive_ai_failures',
        30
      );
      total_refunded := total_refunded + ROUND(r.total_debited * 0.5);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Retroactive refund complete. Total credits granted: %', total_refunded;
END $$;