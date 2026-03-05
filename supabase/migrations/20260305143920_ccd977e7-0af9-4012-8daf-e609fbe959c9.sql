-- Viral snippets table for shareable content generated from products
CREATE TABLE IF NOT EXISTS public.viral_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snippet_type text NOT NULL DEFAULT 'quote',
  text text NOT NULL,
  platform text NOT NULL DEFAULT 'universal',
  display_order integer DEFAULT 0,
  share_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.viral_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read viral snippets"
  ON public.viral_snippets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Org members can manage snippets"
  ON public.viral_snippets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
        AND organization_id = viral_snippets.organization_id
        AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE INDEX IF NOT EXISTS idx_viral_snippets_product ON public.viral_snippets(product_id);
CREATE INDEX IF NOT EXISTS idx_viral_snippets_org ON public.viral_snippets(organization_id);