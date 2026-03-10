
-- Add reject_reason to payout_requests if missing
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS reject_reason text;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS processed_by uuid;

-- Reset all payout_requests to clean state (no payouts have been made yet)
DELETE FROM public.manual_payouts;
DELETE FROM public.payout_requests;

-- Add RLS policies for payout_requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own org's payout requests
DROP POLICY IF EXISTS "Users can view own org payouts" ON public.payout_requests;
CREATE POLICY "Users can view own org payouts" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Users can insert payout requests for their own org
DROP POLICY IF EXISTS "Users can request payouts" ON public.payout_requests;
CREATE POLICY "Users can request payouts" ON public.payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Superadmins can do everything
DROP POLICY IF EXISTS "Superadmins can manage payouts" ON public.payout_requests;
CREATE POLICY "Superadmins can manage payouts" ON public.payout_requests
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));
