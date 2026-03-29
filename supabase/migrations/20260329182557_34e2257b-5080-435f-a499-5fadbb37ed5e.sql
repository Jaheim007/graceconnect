CREATE TABLE public.org_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  domain_type text NOT NULL DEFAULT 'subdomain',
  is_verified boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  ssl_status text NOT NULL DEFAULT 'pending',
  dns_instructions jsonb DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_domain UNIQUE (domain)
);

CREATE INDEX idx_org_domains_domain ON public.org_domains(domain);
CREATE INDEX idx_org_domains_org ON public.org_domains(organization_id);

ALTER TABLE public.org_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read domains"
  ON public.org_domains FOR SELECT
  USING (true);

CREATE POLICY "Org admins can insert domains"
  ON public.org_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = org_domains.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update domains"
  ON public.org_domains FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = org_domains.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete domains"
  ON public.org_domains FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = org_domains.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.auto_create_org_subdomain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_domains (organization_id, domain, domain_type, is_verified, is_primary, ssl_status)
  VALUES (NEW.id, NEW.slug || '.siteviral.com', 'subdomain', true, true, 'active')
  ON CONFLICT (domain) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_org_subdomain
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_org_subdomain();

INSERT INTO public.org_domains (organization_id, domain, domain_type, is_verified, is_primary, ssl_status)
SELECT id, slug || '.siteviral.com', 'subdomain', true, true, 'active'
FROM public.organizations
WHERE slug IS NOT NULL
  AND slug != ''
ON CONFLICT (domain) DO NOTHING;