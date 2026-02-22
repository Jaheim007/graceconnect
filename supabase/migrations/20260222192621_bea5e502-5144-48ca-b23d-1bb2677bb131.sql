
-- P0: International-first — Remove CI defaults
-- Change profiles.country default from 'CI' to NULL
ALTER TABLE public.profiles ALTER COLUMN country SET DEFAULT NULL;

-- Change organizations.country default from 'CI' to NULL
ALTER TABLE public.organizations ALTER COLUMN country SET DEFAULT NULL;

-- P0: Payment events table for idempotency
CREATE TABLE public.payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL DEFAULT 'paystack',
  event_id text NOT NULL,
  reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received',
  CONSTRAINT payment_events_event_id_unique UNIQUE (event_id)
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_events_superadmin_select" ON public.payment_events
  FOR SELECT USING (is_superadmin(auth.uid()));

-- P0: Affiliate attributions table
CREATE TABLE public.affiliate_attributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cookie_id text NOT NULL,
  affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  landing_url text,
  user_id uuid,
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attributions_superadmin_select" ON public.affiliate_attributions
  FOR SELECT USING (is_superadmin(auth.uid()));

-- P0: Refund requests table
CREATE TABLE public.refund_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES public.product_purchases(id),
  donation_id uuid REFERENCES public.donations(id),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'XOF',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_select_own" ON public.refund_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "refunds_insert_own" ON public.refund_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "refunds_admin_select" ON public.refund_requests
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id) OR is_superadmin(auth.uid()));

CREATE POLICY "refunds_admin_update" ON public.refund_requests
  FOR UPDATE USING (can_admin_org(auth.uid(), organization_id) OR is_superadmin(auth.uid()));

-- P0: Download logs (proof of delivery)
CREATE TABLE public.download_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES public.product_purchases(id),
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "downloads_select_admin" ON public.download_logs
  FOR SELECT USING (
    user_id = auth.uid() OR is_superadmin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM product_purchases pp
      WHERE pp.id = download_logs.purchase_id
        AND can_admin_org(auth.uid(), pp.organization_id)
    )
  );

CREATE POLICY "downloads_insert_own" ON public.download_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- P1: Support tickets table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  organization_id uuid,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  admin_response text,
  responded_by uuid,
  responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_own" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tickets_insert_own" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_admin_select" ON public.support_tickets
  FOR SELECT USING (
    (organization_id IS NOT NULL AND can_admin_org(auth.uid(), organization_id))
    OR is_superadmin(auth.uid())
  );

CREATE POLICY "tickets_superadmin_update" ON public.support_tickets
  FOR UPDATE USING (is_superadmin(auth.uid()));

-- P1: Payout freeze mechanism on organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS payouts_frozen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_freeze_reason text,
  ADD COLUMN IF NOT EXISTS payouts_frozen_until timestamptz;

-- P0: Platform settings table for directory_mode etc.
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_public_select" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "platform_settings_superadmin_all" ON public.platform_settings
  FOR ALL USING (is_superadmin(auth.uid()));

-- Insert default directory_mode
INSERT INTO public.platform_settings (key, value) VALUES ('directory_mode', 'curated');
