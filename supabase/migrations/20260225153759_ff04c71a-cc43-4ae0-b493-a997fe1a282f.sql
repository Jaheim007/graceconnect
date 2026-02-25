-- 1. Secure Storage Buckets (P0 Security)
-- Ensure buckets exist and are private
INSERT INTO storage.buckets (id, name, public) VALUES ('org-uploads', 'org-uploads', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('private-products', 'private-products', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS for org-uploads (KYC docs)
-- Only owner or superadmin can upload/select
DROP POLICY IF EXISTS "Org owners can upload KYC docs" ON storage.objects;
CREATE POLICY "Org owners can upload KYC docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Superadmins can view all KYC docs" ON storage.objects;
CREATE POLICY "Superadmins can view all KYC docs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'org-uploads' AND 
  public.is_superadmin(auth.uid())
);

-- RLS for private-products
DROP POLICY IF EXISTS "Org owners can manage their products" ON storage.objects;
CREATE POLICY "Org owners can manage their products" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'private-products' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Audit Log Enforcement
-- Ensure audit_logs table has RLS (read-only for org admins, write for system/functions)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view own org logs" ON public.audit_logs;
CREATE POLICY "Admins view own org logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR public.is_superadmin(auth.uid())
);

-- 3. Affiliate on Donations Block (Database Constraint)
-- Although logic exists in code, enforce in DB to prevent accidental data corruption
ALTER TABLE public.donations 
ADD CONSTRAINT donations_affiliate_check 
CHECK (affiliate_commission IS NULL OR affiliate_commission = 0); 
-- Note: Existing data might violate this if logic wasn't perfect before. 
-- For now, we apply it. If it fails, it means we have bad data to clean up.
-- If verify-payment already ensures this, this is a safety net.

-- 4. Refund Requests Enhancements
ALTER TABLE public.refund_requests 
ADD COLUMN IF NOT EXISTS gateway_refund_id text,
ADD COLUMN IF NOT EXISTS refunded_amount numeric,
ADD COLUMN IF NOT EXISTS currency text;

-- 5. Payout Profiles RLS (Security)
ALTER TABLE public.payout_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payout profile" ON public.payout_profiles;
CREATE POLICY "Users view own payout profile" ON public.payout_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own payout profile" ON public.payout_profiles;
CREATE POLICY "Users update own payout profile" ON public.payout_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND recipient_locked = false); -- Lock enforcement

DROP POLICY IF EXISTS "Superadmin full access payout profiles" ON public.payout_profiles;
CREATE POLICY "Superadmin full access payout profiles" ON public.payout_profiles
FOR ALL TO authenticated
USING (public.is_superadmin(auth.uid()));
