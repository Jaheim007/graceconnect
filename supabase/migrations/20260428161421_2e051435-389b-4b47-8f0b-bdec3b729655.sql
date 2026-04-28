-- Enum statuts marketplace
DO $$ BEGIN
  CREATE TYPE public.marketplace_template_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.marketplace_template_kind AS ENUM ('formation', 'ebook', 'prompt', 'landing', 'email_sequence', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Templates publiés
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  source_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  kind public.marketplace_template_kind NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  preview_url TEXT,
  tags TEXT[] DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'fr',
  clone_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  author_commission_percent NUMERIC NOT NULL DEFAULT 50 CHECK (author_commission_percent BETWEEN 30 AND 70),
  content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.marketplace_template_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  clones_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  avg_rating NUMERIC,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_templates_status ON public.marketplace_templates(status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_author_org ON public.marketplace_templates(author_org_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_kind ON public.marketplace_templates(kind);

ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved templates"
  ON public.marketplace_templates FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authors can view own templates"
  ON public.marketplace_templates FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = author_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Superadmins can view all templates"
  ON public.marketplace_templates FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Authors can insert templates"
  ON public.marketplace_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = author_org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

CREATE POLICY "Authors can update own templates"
  ON public.marketplace_templates FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = author_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Superadmins can update any template"
  ON public.marketplace_templates FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Authors can delete own draft templates"
  ON public.marketplace_templates FOR DELETE
  TO authenticated
  USING (
    status IN ('draft','rejected')
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = author_org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

CREATE TRIGGER trg_marketplace_templates_updated
  BEFORE UPDATE ON public.marketplace_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Historique des clonages
CREATE TABLE IF NOT EXISTS public.marketplace_template_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
  cloner_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cloner_user_id UUID NOT NULL,
  cloned_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  author_commission_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_clones_template ON public.marketplace_template_clones(template_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_clones_cloner ON public.marketplace_template_clones(cloner_org_id);

ALTER TABLE public.marketplace_template_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors see clones of their templates"
  ON public.marketplace_template_clones FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_templates t
    JOIN public.organization_members om ON om.organization_id = t.author_org_id
    WHERE t.id = template_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Cloners see their own clones"
  ON public.marketplace_template_clones FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = cloner_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Superadmins see all clones"
  ON public.marketplace_template_clones FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Avis sur templates
CREATE TABLE IF NOT EXISTS public.marketplace_template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
  reviewer_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, reviewer_org_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_template ON public.marketplace_template_reviews(template_id);

ALTER TABLE public.marketplace_template_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews"
  ON public.marketplace_template_reviews FOR SELECT
  USING (true);

CREATE POLICY "Cloners can review templates they cloned"
  ON public.marketplace_template_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_template_clones c
      JOIN public.organization_members om ON om.organization_id = c.cloner_org_id
      WHERE c.template_id = marketplace_template_reviews.template_id
        AND c.cloner_org_id = reviewer_org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

CREATE POLICY "Reviewers can update own reviews"
  ON public.marketplace_template_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_user_id = auth.uid());

CREATE POLICY "Reviewers can delete own reviews"
  ON public.marketplace_template_reviews FOR DELETE
  TO authenticated
  USING (reviewer_user_id = auth.uid());

CREATE TRIGGER trg_marketplace_reviews_updated
  BEFORE UPDATE ON public.marketplace_template_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: maj avg_rating et reviews_count sur le template
CREATE OR REPLACE FUNCTION public.update_marketplace_template_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
BEGIN
  v_template_id := COALESCE(NEW.template_id, OLD.template_id);
  UPDATE public.marketplace_templates t
  SET 
    avg_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM public.marketplace_template_reviews WHERE template_id = v_template_id),
    reviews_count = (SELECT COUNT(*) FROM public.marketplace_template_reviews WHERE template_id = v_template_id),
    updated_at = now()
  WHERE t.id = v_template_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_marketplace_template_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_template_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_template_rating();

-- RPC: clone template (transactionnel, à appeler depuis edge function après paiement)
CREATE OR REPLACE FUNCTION public.register_template_clone(
  _template_id UUID,
  _cloner_org_id UUID,
  _cloner_user_id UUID,
  _cloned_product_id UUID,
  _amount_paid NUMERIC,
  _currency TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_author_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_clone_id UUID;
BEGIN
  SELECT * INTO v_template FROM public.marketplace_templates WHERE id = _template_id AND status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found or not approved'; END IF;

  v_author_amount := ROUND(_amount_paid * v_template.author_commission_percent / 100, 2);
  v_platform_amount := _amount_paid - v_author_amount;

  INSERT INTO public.marketplace_template_clones (
    template_id, cloner_org_id, cloner_user_id, cloned_product_id,
    amount_paid, currency, author_commission_amount, platform_fee_amount
  ) VALUES (
    _template_id, _cloner_org_id, _cloner_user_id, _cloned_product_id,
    _amount_paid, _currency, v_author_amount, v_platform_amount
  ) RETURNING id INTO v_clone_id;

  UPDATE public.marketplace_templates
  SET clones_count = clones_count + 1,
      total_revenue = total_revenue + v_author_amount,
      updated_at = now()
  WHERE id = _template_id;

  RETURN v_clone_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_template_clone(UUID, UUID, UUID, UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_template_clone(UUID, UUID, UUID, UUID, NUMERIC, TEXT) TO service_role;