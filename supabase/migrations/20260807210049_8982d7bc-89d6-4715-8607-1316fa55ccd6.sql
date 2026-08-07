ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS linked_product_id uuid REFERENCES public.digital_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS programs_linked_product_id_idx ON public.programs (linked_product_id);