-- Refund ALL credits consumed for transcribe_media actions in last 30 days.
-- Full 100% refund as bonus credits valid 60 days since the system was broken.

DO $$
DECLARE
  r RECORD;
  total_refunded NUMERIC := 0;
  user_count INT := 0;
BEGIN
  FOR r IN
    SELECT 
      ct.user_id,
      SUM(ct.amount) as total_debited,
      COUNT(*) as tx_count
    FROM credit_transactions ct
    WHERE ct.tx_type = 'consumption'
      AND ct.action_key = 'transcribe_media'
      AND ct.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ct.user_id
    HAVING SUM(ct.amount) > 0
  LOOP
    PERFORM grant_bonus_credits(
      r.user_id,
      r.total_debited,
      'refund:transcribe_media_failures_v2',
      60
    );
    total_refunded := total_refunded + r.total_debited;
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Refunded % credits to % users for failed transcriptions', total_refunded, user_count;
END $$;