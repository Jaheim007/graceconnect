
-- Drop old user_badges first
DROP TABLE IF EXISTS public.user_badges CASCADE;

-- ═══ 1. Internal Messaging ═══
CREATE TABLE public.org_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  reply_to_id uuid REFERENCES public.org_messages(id) ON DELETE SET NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_messages_org ON public.org_messages(organization_id, created_at DESC);
ALTER TABLE public.org_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_member" ON public.org_messages FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "msg_insert_member" ON public.org_messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND is_org_member(auth.uid(), organization_id));
CREATE POLICY "msg_delete_admin" ON public.org_messages FOR DELETE USING (can_admin_org(auth.uid(), organization_id) OR sender_id = auth.uid());
CREATE POLICY "msg_update_admin" ON public.org_messages FOR UPDATE USING (can_admin_org(auth.uid(), organization_id));

-- ═══ 2. Gamification ═══
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_user_points_org ON public.user_points(organization_id, points DESC);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_select_member" ON public.user_points FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "points_select_own" ON public.user_points FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "points_upsert_own" ON public.user_points FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(auth.uid(), organization_id));
CREATE POLICY "points_update_own" ON public.user_points FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ptx_select_own" ON public.point_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ptx_select_admin" ON public.point_transactions FOR SELECT USING (can_admin_org(auth.uid(), organization_id));
CREATE POLICY "ptx_insert_own" ON public.point_transactions FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(auth.uid(), organization_id));

CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  condition_type text NOT NULL DEFAULT 'points',
  condition_value integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_public" ON public.badges FOR SELECT USING (is_active = true);
CREATE POLICY "badges_manage_admin" ON public.badges FOR ALL USING (can_admin_org(auth.uid(), organization_id));

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ubadges_select_member" ON public.user_badges FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "ubadges_select_own" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ubadges_insert_own" ON public.user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

-- ═══ 3. Program Certificates ═══
CREATE TABLE public.program_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_number text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);
ALTER TABLE public.program_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_select_own" ON public.program_certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cert_select_admin" ON public.program_certificates FOR SELECT USING (can_admin_org(auth.uid(), organization_id));
CREATE POLICY "cert_insert_own" ON public.program_certificates FOR INSERT WITH CHECK (user_id = auth.uid());
