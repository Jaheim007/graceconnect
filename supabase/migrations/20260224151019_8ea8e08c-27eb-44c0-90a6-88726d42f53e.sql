
-- Allow free product purchases (amount=0) even for non-monetized orgs
DROP POLICY IF EXISTS "purchases_insert_monetized" ON public.product_purchases;

CREATE POLICY "purchases_insert_monetized" ON public.product_purchases
FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) AND (
    amount = 0 
    OR org_monetization_allowed(organization_id) 
    OR is_superadmin(auth.uid())
  )
);
