-- Remove monetization_allowed requirement from insert policies for products and campaigns.
-- KYC/monetization should only be enforced at payout time, not at content creation.

DROP POLICY IF EXISTS products_manager_insert ON public.digital_products;
CREATE POLICY products_manager_insert ON public.digital_products
  FOR INSERT WITH CHECK (can_manage_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS campaigns_manager_insert ON public.donation_campaigns;
CREATE POLICY campaigns_manager_insert ON public.donation_campaigns
  FOR INSERT WITH CHECK (can_manage_org(auth.uid(), organization_id));