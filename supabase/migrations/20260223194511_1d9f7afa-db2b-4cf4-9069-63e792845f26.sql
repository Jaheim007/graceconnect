-- Fix missing affiliate_sale for the existing purchase
INSERT INTO public.affiliate_sales (
  affiliate_link_id, affiliate_user_id, organization_id,
  transaction_type, transaction_id, gross_amount,
  commission_amount, commission_percent, status, payable_at
) VALUES (
  '26f5b8ee-b90f-4bf9-b33f-2e90e9ddf9c0',
  '06c342dc-a057-403c-8885-63a43a6bfcde',
  'e5366f19-b4d5-4524-b7e3-91cb39f67228',
  'product',
  'fdb976db-d80a-4cf0-b953-8181045f28e5',
  1000,
  200,
  20,
  'pending',
  (NOW() + INTERVAL '72 hours')::timestamptz
) ON CONFLICT DO NOTHING;

-- Update the affiliate link counters
UPDATE public.affiliate_links
SET conversions = COALESCE(conversions, 0) + 1,
    total_earned = COALESCE(total_earned, 0) + 200
WHERE id = '26f5b8ee-b90f-4bf9-b33f-2e90e9ddf9c0';

-- Add missing admin notifications for this purchase
INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
SELECT om.user_id, 'e5366f19-b4d5-4524-b7e3-91cb39f67228',
  '🛍️ Nouvelle vente', '1 000 XOF — Achat de produit confirmé', 'sale_admin', '/admin/analytics'
FROM public.organization_members om
WHERE om.organization_id = 'e5366f19-b4d5-4524-b7e3-91cb39f67228'
  AND om.role IN ('owner', 'admin');

-- Add missing commission notification for the affiliate
INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
VALUES (
  '06c342dc-a057-403c-8885-63a43a6bfcde',
  'e5366f19-b4d5-4524-b7e3-91cb39f67228',
  '💰 Commission gagnée !',
  'Vous avez gagné 200 XOF de commission. Disponible dans 72h.',
  'commission',
  '/affiliation'
);