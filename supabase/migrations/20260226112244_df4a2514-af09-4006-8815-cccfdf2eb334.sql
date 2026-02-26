
-- Offerings: org-level offering types with configurable preset amounts
CREATE TABLE public.offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_recurring_allowed BOOLEAN NOT NULL DEFAULT true,
  preset_amounts INTEGER[] DEFAULT ARRAY[1000, 2500, 5000, 10000],
  currency TEXT NOT NULL DEFAULT 'XOF',
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active offerings
CREATE POLICY "Active offerings are publicly viewable"
  ON public.offerings FOR SELECT
  USING (is_active = true);

-- Org admins can manage offerings
CREATE POLICY "Org admins can insert offerings"
  ON public.offerings FOR INSERT
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "Org admins can update offerings"
  ON public.offerings FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete offerings"
  ON public.offerings FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- Offering transactions
CREATE TABLE public.offering_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  donor_name TEXT,
  donor_email TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('weekly', 'monthly', 'yearly')),
  payment_reference TEXT,
  payment_gateway TEXT DEFAULT 'paystack',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  platform_fee INTEGER DEFAULT 0,
  organization_amount INTEGER DEFAULT 0,
  affiliate_link_id UUID REFERENCES public.affiliate_links(id),
  affiliate_commission INTEGER DEFAULT 0,
  settlement_status TEXT DEFAULT 'pending',
  settlement_released_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offering_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own offering transactions
CREATE POLICY "Users can view own offering transactions"
  ON public.offering_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Org admins can view all org offering transactions
CREATE POLICY "Org admins can view org offering transactions"
  ON public.offering_transactions FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

-- Anyone can insert (for guest donations)
CREATE POLICY "Anyone can create offering transactions"
  ON public.offering_transactions FOR INSERT
  WITH CHECK (true);

-- Superadmins can view all
CREATE POLICY "Superadmins can view all offering transactions"
  ON public.offering_transactions FOR SELECT
  USING (public.is_superadmin(auth.uid()));

-- Superadmins can update (for settlement processing)
CREATE POLICY "Superadmins can update offering transactions"
  ON public.offering_transactions FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

-- Trigger for updated_at on offerings
CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON public.offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add indexes
CREATE INDEX idx_offerings_org ON public.offerings(organization_id);
CREATE INDEX idx_offering_tx_org ON public.offering_transactions(organization_id);
CREATE INDEX idx_offering_tx_offering ON public.offering_transactions(offering_id);
CREATE INDEX idx_offering_tx_status ON public.offering_transactions(status);
