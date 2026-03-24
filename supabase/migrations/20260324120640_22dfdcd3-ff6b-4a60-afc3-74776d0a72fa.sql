-- Fix missing affiliate commission for purchase eed212bb
-- Ambassador: user 6a0b016e (affiliate_link_id: 10017f15), org LD Shop 241's books
-- Purchase: 1500 XAF, commission rate 30% = 450 XAF

-- 1. Update the purchase record with the affiliate link and commission
UPDATE product_purchases
SET affiliate_link_id = '10017f15-b026-477d-a9b1-6f84e51c618d',
    affiliate_commission = 450
WHERE id = 'eed212bb-8e27-4bb7-bec8-c414234526f2'
  AND affiliate_link_id IS NULL;

-- 2. Update affiliate_links stats
UPDATE affiliate_links
SET conversions = COALESCE(conversions, 0) + 1,
    total_earned = COALESCE(total_earned, 0) + 450
WHERE id = '10017f15-b026-477d-a9b1-6f84e51c618d';

-- 3. Create affiliate_sales record
INSERT INTO affiliate_sales (
  affiliate_link_id, affiliate_user_id, organization_id,
  transaction_id, transaction_type, gross_amount,
  commission_percent, commission_amount, status, payable_at
) VALUES (
  '10017f15-b026-477d-a9b1-6f84e51c618d',
  '6a0b016e-1650-4c85-97b2-9c8fc4f127d0',
  '79d655b2-dda9-4794-b12f-213f8db275cc',
  'eed212bb-8e27-4bb7-bec8-c414234526f2',
  'product',
  1500,
  30,
  450,
  'payable',
  NOW() + INTERVAL '15 days'
) ON CONFLICT DO NOTHING;

-- 4. Notify the ambassador
INSERT INTO user_notifications (user_id, title, body, notification_type, action_url)
VALUES (
  '6a0b016e-1650-4c85-97b2-9c8fc4f127d0',
  '💰 Commission reçue !',
  'Tu as gagné 450 FCFA de commission sur une vente via ton lien ambassadeur pour LD Shop 241''s books !',
  'affiliate_sale',
  '/affiliation'
);