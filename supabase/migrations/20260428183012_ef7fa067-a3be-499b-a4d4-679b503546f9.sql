
CREATE TABLE IF NOT EXISTS public.mobile_device_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  organization_id UUID,
  token           TEXT NOT NULL UNIQUE,
  platform        TEXT NOT NULL CHECK (platform IN ('ios','android')),
  device_model    TEXT,
  app_version     TEXT,
  last_active_at  TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mdt_user ON public.mobile_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mdt_org  ON public.mobile_device_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_mdt_platform ON public.mobile_device_tokens(platform);

ALTER TABLE public.mobile_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens select"
  ON public.mobile_device_tokens FOR SELECT
  USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "Users manage own device tokens insert"
  ON public.mobile_device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own device tokens update"
  ON public.mobile_device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own device tokens delete"
  ON public.mobile_device_tokens FOR DELETE
  USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

DO $$ BEGIN
  CREATE TRIGGER trg_mdt_updated_at
    BEFORE UPDATE ON public.mobile_device_tokens
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
