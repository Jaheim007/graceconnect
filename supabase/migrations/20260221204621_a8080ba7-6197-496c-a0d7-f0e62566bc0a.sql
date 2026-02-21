
-- =============================================
-- 1. PROMO CODES TABLE
-- =============================================
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 10 CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_public_select" ON public.promo_codes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "promo_codes_manager_select" ON public.promo_codes
  FOR SELECT USING (can_manage_org(auth.uid(), organization_id));

CREATE POLICY "promo_codes_manager_insert" ON public.promo_codes
  FOR INSERT WITH CHECK (can_manage_org(auth.uid(), organization_id));

CREATE POLICY "promo_codes_manager_update" ON public.promo_codes
  FOR UPDATE USING (can_manage_org(auth.uid(), organization_id));

CREATE POLICY "promo_codes_admin_delete" ON public.promo_codes
  FOR DELETE USING (can_admin_org(auth.uid(), organization_id));

-- =============================================
-- 2. REFERRAL REWARDS TABLE (user-to-user referrals)
-- =============================================
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered',  -- registered, converted (first purchase)
  reward_amount NUMERIC DEFAULT 0,
  reward_currency TEXT DEFAULT 'XOF',
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.user_referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "referrals_insert_self" ON public.user_referrals
  FOR INSERT WITH CHECK (referred_id = auth.uid());

CREATE POLICY "referrals_superadmin_select" ON public.user_referrals
  FOR SELECT USING (is_superadmin(auth.uid()));

-- =============================================
-- 3. ADD referral_code TO profiles for user referral program
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Generate referral codes for existing users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles 
    SET referral_code = 'SV-' || upper(substring(r.id::text from 1 for 8))
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- =============================================
-- 4. ADD promo_code_id TO product_purchases and donations
-- =============================================
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id);
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id);
