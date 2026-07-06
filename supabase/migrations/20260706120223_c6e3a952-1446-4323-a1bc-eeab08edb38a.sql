
CREATE TABLE public.church_sermon_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES public.church_sermons(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.church_sermon_variants(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'notes',
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  page_count INTEGER,
  file_size_bytes INTEGER,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sales_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_church_sermon_pdfs_sermon ON public.church_sermon_pdfs(sermon_id);
CREATE INDEX idx_church_sermon_pdfs_church ON public.church_sermon_pdfs(church_id);
CREATE INDEX idx_church_sermon_pdfs_published ON public.church_sermon_pdfs(is_published) WHERE is_published = true;

GRANT SELECT ON public.church_sermon_pdfs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_sermon_pdfs TO authenticated;
GRANT ALL ON public.church_sermon_pdfs TO service_role;

ALTER TABLE public.church_sermon_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published sermon PDFs"
  ON public.church_sermon_pdfs FOR SELECT
  USING (is_published = true);
CREATE POLICY "Church owners can view their sermon PDFs"
  ON public.church_sermon_pdfs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers c WHERE c.id = church_id AND c.user_id = auth.uid()));
CREATE POLICY "Church owners can insert their sermon PDFs"
  ON public.church_sermon_pdfs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers c WHERE c.id = church_id AND c.user_id = auth.uid()));
CREATE POLICY "Church owners can update their sermon PDFs"
  ON public.church_sermon_pdfs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers c WHERE c.id = church_id AND c.user_id = auth.uid()));
CREATE POLICY "Church owners can delete their sermon PDFs"
  ON public.church_sermon_pdfs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers c WHERE c.id = church_id AND c.user_id = auth.uid()));

CREATE TRIGGER trg_church_sermon_pdfs_touch
  BEFORE UPDATE ON public.church_sermon_pdfs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.church_sermon_pdf_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID NOT NULL REFERENCES public.church_sermon_pdfs(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  buyer_user_id UUID,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  gateway TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  download_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sermon_pdf_purchases_pdf ON public.church_sermon_pdf_purchases(pdf_id);
CREATE INDEX idx_sermon_pdf_purchases_church ON public.church_sermon_pdf_purchases(church_id);
CREATE INDEX idx_sermon_pdf_purchases_email ON public.church_sermon_pdf_purchases(buyer_email);
CREATE INDEX idx_sermon_pdf_purchases_status ON public.church_sermon_pdf_purchases(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_sermon_pdf_purchases TO authenticated;
GRANT ALL ON public.church_sermon_pdf_purchases TO service_role;

ALTER TABLE public.church_sermon_pdf_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church owners can view their PDF purchases"
  ON public.church_sermon_pdf_purchases FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers c WHERE c.id = church_id AND c.user_id = auth.uid()));

CREATE TRIGGER trg_church_sermon_pdf_purchases_touch
  BEFORE UPDATE ON public.church_sermon_pdf_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
