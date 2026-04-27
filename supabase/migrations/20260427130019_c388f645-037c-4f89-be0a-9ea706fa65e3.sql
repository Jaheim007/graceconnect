CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_org ON public.api_keys(org_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners/admins can view their api keys"
ON public.api_keys FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.organization_id = api_keys.org_id
    AND om.user_id = auth.uid()
    AND om.role::text IN ('owner', 'admin')
));

CREATE POLICY "Org owners/admins can create api keys"
ON public.api_keys FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = api_keys.org_id
      AND om.user_id = auth.uid()
      AND om.role::text IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners/admins can revoke api keys"
ON public.api_keys FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.organization_id = api_keys.org_id
    AND om.user_id = auth.uid()
    AND om.role::text IN ('owner', 'admin')
));

CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  org_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_logs_org_created ON public.api_request_logs(org_id, created_at DESC);
CREATE INDEX idx_api_logs_key_created ON public.api_request_logs(api_key_id, created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners/admins can view their api logs"
ON public.api_request_logs FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.organization_id = api_request_logs.org_id
    AND om.user_id = auth.uid()
    AND om.role::text IN ('owner', 'admin')
));

CREATE OR REPLACE FUNCTION public.verify_api_key(_key_hash TEXT)
RETURNS TABLE (
  api_key_id UUID,
  org_id UUID,
  scopes JSONB,
  is_valid BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ak.id, ak.org_id, ak.scopes,
    (ak.revoked_at IS NULL AND (ak.expires_at IS NULL OR ak.expires_at > now())) AS is_valid
  FROM public.api_keys ak
  WHERE ak.key_hash = _key_hash
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.log_api_request(
  _api_key_id UUID,
  _org_id UUID,
  _endpoint TEXT,
  _method TEXT,
  _status_code INTEGER,
  _latency_ms INTEGER DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_request_logs (
    api_key_id, org_id, endpoint, method, status_code, latency_ms, ip_address, user_agent
  ) VALUES (
    _api_key_id, _org_id, _endpoint, _method, _status_code, _latency_ms, _ip_address, _user_agent
  );

  IF _api_key_id IS NOT NULL THEN
    UPDATE public.api_keys SET last_used_at = now() WHERE id = _api_key_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO service_role;