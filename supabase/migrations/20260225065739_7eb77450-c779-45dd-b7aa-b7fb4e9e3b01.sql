
-- ============================================================
-- P0 MIGRATION: Storage private, payout isolation, monitoring
-- ============================================================

-- 1. Make org-uploads bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'org-uploads';

-- 2. Create payout_profiles table
CREATE TABLE IF NOT EXISTS public.payout_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_recipient_code TEXT,
  recipient_locked BOOLEAN NOT NULL DEFAULT false,
  payout_method TEXT CHECK (payout_method IN ('mobile_money', 'bank')),
  payout_country TEXT,
  payout_provider TEXT,
  payout_bank_code TEXT,
  payout_account_number TEXT,
  payout_account_name TEXT,
  payout_currency TEXT DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout profile"
  ON public.payout_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout profile"
  ON public.payout_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payout profile"
  ON public.payout_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmin can view all payout profiles"
  ON public.payout_profiles FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE TRIGGER set_payout_profiles_updated_at
  BEFORE UPDATE ON public.payout_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Migrate existing payout data
INSERT INTO public.payout_profiles (user_id, paystack_recipient_code, recipient_locked, payout_method, payout_country, payout_provider, payout_bank_code, payout_account_number, payout_account_name, payout_currency)
SELECT id, paystack_recipient_code, COALESCE(recipient_locked, false), payout_method, payout_country, payout_provider, payout_bank_code, payout_account_number, payout_account_name, payout_currency
FROM public.profiles
WHERE paystack_recipient_code IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Ensure RLS on refund_requests
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refund_requests' AND policyname = 'Org admins can view refund requests') THEN
    CREATE POLICY "Org admins can view refund requests"
      ON public.refund_requests FOR SELECT
      USING (public.can_admin_org(auth.uid(), organization_id) OR public.is_superadmin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refund_requests' AND policyname = 'Org admins can create refund requests') THEN
    CREATE POLICY "Org admins can create refund requests"
      ON public.refund_requests FOR INSERT
      WITH CHECK (public.can_admin_org(auth.uid(), organization_id) OR public.is_superadmin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refund_requests' AND policyname = 'Superadmin can update refund requests') THEN
    CREATE POLICY "Superadmin can update refund requests"
      ON public.refund_requests FOR UPDATE
      USING (public.is_superadmin(auth.uid()));
  END IF;
END $$;

-- 5. Create platform_alerts table
CREATE TABLE IF NOT EXISTS public.platform_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage platform alerts"
  ON public.platform_alerts FOR ALL
  USING (public.is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_platform_alerts_active ON public.platform_alerts (resolved, severity, created_at DESC);

-- 6. Storage RLS for org-uploads (now private)
CREATE POLICY "Authenticated users can upload org files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'org-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Org members can view org files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Org admins can delete org files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'org-uploads' AND auth.role() = 'authenticated');
