
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS siteviral_type text,
  ADD COLUMN IF NOT EXISTS enabled_features text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS type_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS features_confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS organizations_enabled_features_gin
  ON public.organizations USING gin (enabled_features);

CREATE INDEX IF NOT EXISTS organizations_siteviral_type_idx
  ON public.organizations (siteviral_type);

CREATE TABLE IF NOT EXISTS public.feature_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  action text NOT NULL DEFAULT 'activated' CHECK (action IN ('activated','deactivated')),
  source text NOT NULL DEFAULT 'user' CHECK (source IN ('user','onboarding','migration','system','admin')),
  activated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feature_activations_org_id_idx
  ON public.feature_activations (org_id, created_at DESC);

GRANT SELECT, INSERT ON public.feature_activations TO authenticated;
GRANT ALL ON public.feature_activations TO service_role;

ALTER TABLE public.feature_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can view feature activations"
  ON public.feature_activations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = feature_activations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','editor')
    )
  );

CREATE POLICY "Org managers can insert feature activations"
  ON public.feature_activations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    activated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = feature_activations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','editor')
    )
  );

UPDATE public.organizations o
SET
  siteviral_type = COALESCE(o.siteviral_type, 'digital_products'),
  enabled_features = (
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        ARRAY['order_generator','kyc','affiliation','payment']
        || CASE WHEN EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.organization_id = o.id)
             THEN ARRAY['digital_products'] ELSE ARRAY[]::text[] END
        || CASE WHEN EXISTS (SELECT 1 FROM public.donations d WHERE d.organization_id = o.id)
                 OR EXISTS (SELECT 1 FROM public.donation_campaigns dc WHERE dc.organization_id = o.id)
                 OR EXISTS (SELECT 1 FROM public.offerings off WHERE off.organization_id = o.id)
             THEN ARRAY['donation_gifts'] ELSE ARRAY[]::text[] END
        || CASE WHEN EXISTS (SELECT 1 FROM public.events ev WHERE ev.organization_id = o.id)
             THEN ARRAY['events'] ELSE ARRAY[]::text[] END
        || CASE WHEN EXISTS (SELECT 1 FROM public.product_reviews pr WHERE pr.organization_id = o.id)
             THEN ARRAY['reviews','product_comments'] ELSE ARRAY[]::text[] END
        || CASE WHEN EXISTS (SELECT 1 FROM public.programs pg WHERE pg.organization_id = o.id)
             THEN ARRAY['ai_formation_creation'] ELSE ARRAY[]::text[] END
      ) AS f
    )
  )
WHERE o.features_confirmed_at IS NULL;
