
-- Experiments table for A/B testing admin
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '["a","b"]',
  traffic_percent INTEGER NOT NULL DEFAULT 100 CHECK (traffic_percent BETWEEN 1 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active experiments"
ON public.experiments FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Superadmins manage experiments"
ON public.experiments FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Ensure maintenance_mode exists in platform_settings
INSERT INTO public.platform_settings (key, value)
VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Maintenance en cours. Nous serons de retour bientôt."}'),
  ('feature_flags', '{}')
ON CONFLICT (key) DO NOTHING;

-- Trigger for experiments updated_at
CREATE TRIGGER set_experiments_updated_at
BEFORE UPDATE ON public.experiments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
