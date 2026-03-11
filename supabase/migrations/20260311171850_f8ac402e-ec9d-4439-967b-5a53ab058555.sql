ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;