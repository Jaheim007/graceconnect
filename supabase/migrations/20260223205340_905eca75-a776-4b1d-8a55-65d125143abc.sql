
-- Fix affiliate_sales: drop restrictive policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "aff_sales_select_own" ON public.affiliate_sales;
DROP POLICY IF EXISTS "aff_sales_admin_select" ON public.affiliate_sales;
DROP POLICY IF EXISTS "aff_sales_superadmin_select" ON public.affiliate_sales;

CREATE POLICY "aff_sales_select_own" ON public.affiliate_sales
  FOR SELECT USING (affiliate_user_id = auth.uid());

CREATE POLICY "aff_sales_admin_select" ON public.affiliate_sales
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id));

CREATE POLICY "aff_sales_superadmin_select" ON public.affiliate_sales
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Fix affiliate_links: drop restrictive policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "aff_links_select_own" ON public.affiliate_links;
DROP POLICY IF EXISTS "aff_links_admin_select" ON public.affiliate_links;
DROP POLICY IF EXISTS "aff_links_superadmin_select" ON public.affiliate_links;
DROP POLICY IF EXISTS "aff_links_insert" ON public.affiliate_links;
DROP POLICY IF EXISTS "aff_links_update_own" ON public.affiliate_links;

CREATE POLICY "aff_links_select_own" ON public.affiliate_links
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "aff_links_admin_select" ON public.affiliate_links
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id));

CREATE POLICY "aff_links_superadmin_select" ON public.affiliate_links
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "aff_links_insert" ON public.affiliate_links
  FOR INSERT WITH CHECK (
    (user_id = auth.uid()) AND is_org_member(auth.uid(), organization_id) AND org_affiliation_allowed(organization_id)
  );

CREATE POLICY "aff_links_update_own" ON public.affiliate_links
  FOR UPDATE USING (
    (user_id = auth.uid()) OR can_admin_org(auth.uid(), organization_id)
  );
