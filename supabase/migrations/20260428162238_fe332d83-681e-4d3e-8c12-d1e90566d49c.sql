CREATE TABLE IF NOT EXISTS public.marketplace_template_pending_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
  cloner_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cloner_user_id UUID NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cloned_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  clone_id UUID REFERENCES public.marketplace_template_clones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_clones_ref ON public.marketplace_template_pending_clones(payment_reference);
CREATE INDEX IF NOT EXISTS idx_pending_clones_user ON public.marketplace_template_pending_clones(cloner_user_id);

ALTER TABLE public.marketplace_template_pending_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cloner sees own pending"
  ON public.marketplace_template_pending_clones FOR SELECT
  TO authenticated
  USING (cloner_user_id = auth.uid());

CREATE POLICY "Superadmin sees all pending"
  ON public.marketplace_template_pending_clones FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- RPC: finalise un clone après paiement (idempotent)
CREATE OR REPLACE FUNCTION public.finalize_template_clone_payment(_payment_reference TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_template RECORD;
  v_snap JSONB;
  v_new_product_id UUID;
  v_clone_id UUID;
BEGIN
  SELECT * INTO v_pending FROM public.marketplace_template_pending_clones WHERE payment_reference = _payment_reference;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'pending_not_found'); END IF;
  IF v_pending.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already_completed', true, 'product_id', v_pending.cloned_product_id, 'clone_id', v_pending.clone_id);
  END IF;

  SELECT * INTO v_template FROM public.marketplace_templates WHERE id = v_pending.template_id AND status = 'approved';
  IF NOT FOUND THEN
    UPDATE public.marketplace_template_pending_clones SET status = 'failed' WHERE id = v_pending.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'template_not_available');
  END IF;

  v_snap := COALESCE(v_template.content_snapshot, '{}'::jsonb);

  INSERT INTO public.digital_products (
    organization_id, title, description, cover_image_url, content,
    product_type, is_published, is_free, price, currency, created_by
  ) VALUES (
    v_pending.cloner_org_id,
    COALESCE(v_snap->>'title', v_template.title) || ' (copie)',
    COALESCE(v_snap->>'description', v_template.description),
    COALESCE(v_snap->>'cover_image_url', v_template.cover_image_url),
    v_snap->'content',
    COALESCE(v_snap->>'product_type', 'ebook'),
    false, false, 0, 'XOF',
    v_pending.cloner_user_id
  ) RETURNING id INTO v_new_product_id;

  SELECT public.register_template_clone(
    v_pending.template_id,
    v_pending.cloner_org_id,
    v_pending.cloner_user_id,
    v_new_product_id,
    v_pending.amount,
    v_pending.currency
  ) INTO v_clone_id;

  UPDATE public.marketplace_template_pending_clones
  SET status = 'completed',
      cloned_product_id = v_new_product_id,
      clone_id = v_clone_id,
      completed_at = now()
  WHERE id = v_pending.id;

  RETURN jsonb_build_object('ok', true, 'product_id', v_new_product_id, 'clone_id', v_clone_id);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_template_clone_payment(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_template_clone_payment(TEXT) TO service_role;