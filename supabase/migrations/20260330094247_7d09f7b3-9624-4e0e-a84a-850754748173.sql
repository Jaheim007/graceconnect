-- Fix RLS: payouts_admin_select targets 'public' role instead of 'authenticated'
DROP POLICY IF EXISTS "payouts_admin_select" ON public.payout_requests;
CREATE POLICY "payouts_admin_select" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (can_admin_org(auth.uid(), organization_id) OR is_superadmin(auth.uid()));

-- Also fix payouts_select_own and payouts_insert_own targeting 'public'
DROP POLICY IF EXISTS "payouts_select_own" ON public.payout_requests;
CREATE POLICY "payouts_select_own" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payouts_insert_own" ON public.payout_requests;
CREATE POLICY "payouts_insert_own" ON public.payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payouts_superadmin_update" ON public.payout_requests;
CREATE POLICY "payouts_superadmin_update" ON public.payout_requests
  FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));