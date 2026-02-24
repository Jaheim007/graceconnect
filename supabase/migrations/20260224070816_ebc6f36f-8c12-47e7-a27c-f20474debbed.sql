
-- ══════════════════════════════════════════════
-- P2.1 — GAMIFICATION: Streaks & Badges
-- ══════════════════════════════════════════════

-- User activity streaks
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_activity_days integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own" ON public.user_streaks FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "streaks_upsert_own" ON public.user_streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "streaks_update_own" ON public.user_streaks FOR UPDATE
  USING (user_id = auth.uid());

-- User badges (earned achievements)
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  badge_label text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_type)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_own" ON public.user_badges FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "badges_insert_own" ON public.user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "badges_superadmin_select" ON public.user_badges FOR SELECT
  USING (is_superadmin(auth.uid()));

-- ══════════════════════════════════════════════
-- P2.4 — SUBSCRIPTION PLANS & USER SUBSCRIPTIONS
-- ══════════════════════════════════════════════

CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  interval text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'quarterly', 'yearly')),
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_select" ON public.subscription_plans FOR SELECT
  USING (is_published = true AND is_active = true);
CREATE POLICY "plans_manager_select" ON public.subscription_plans FOR SELECT
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "plans_manager_insert" ON public.subscription_plans FOR INSERT
  WITH CHECK (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "plans_manager_update" ON public.subscription_plans FOR UPDATE
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "plans_admin_delete" ON public.subscription_plans FOR DELETE
  USING (can_admin_org(auth.uid(), organization_id));

CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  paystack_subscription_code text,
  paystack_email_token text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs_select_own" ON public.user_subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "subs_insert_own" ON public.user_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "subs_update_own" ON public.user_subscriptions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "subs_admin_select" ON public.user_subscriptions FOR SELECT
  USING (can_admin_org(auth.uid(), organization_id));
CREATE POLICY "subs_superadmin_select" ON public.user_subscriptions FOR SELECT
  USING (is_superadmin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_org ON public.user_subscriptions(organization_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_streaks_user ON public.user_streaks(user_id);
