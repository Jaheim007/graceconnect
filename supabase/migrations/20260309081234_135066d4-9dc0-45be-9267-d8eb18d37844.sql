
-- Table to track all autopilot executions
CREATE TABLE public.ops_autopilot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_mode TEXT NOT NULL CHECK (run_mode IN ('daily', 'weekly')),
  department TEXT NOT NULL CHECK (department IN ('marketing', 'growth', 'partnerships', 'support', 'community', 'content', 'all')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  results JSONB NOT NULL DEFAULT '{}',
  actions_taken JSONB NOT NULL DEFAULT '[]',
  alerts_generated INTEGER NOT NULL DEFAULT 0,
  notifications_sent INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_autopilot_runs_mode_dept ON public.ops_autopilot_runs (run_mode, department, created_at DESC);
CREATE INDEX idx_autopilot_runs_status ON public.ops_autopilot_runs (status, created_at DESC);

-- RLS: only superadmins can read
ALTER TABLE public.ops_autopilot_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can read autopilot runs"
  ON public.ops_autopilot_runs FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Weekly challenges table for auto-generated community challenges
CREATE TABLE public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'shares' CHECK (challenge_type IN ('shares', 'sales', 'referrals', 'products', 'engagement')),
  target_value INTEGER NOT NULL DEFAULT 5,
  badge_reward_name TEXT,
  week_start DATE NOT NULL DEFAULT date_trunc('week', now())::date,
  week_end DATE NOT NULL DEFAULT (date_trunc('week', now()) + interval '6 days')::date,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active challenges"
  ON public.weekly_challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Superadmins can manage challenges"
  ON public.weekly_challenges FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));
