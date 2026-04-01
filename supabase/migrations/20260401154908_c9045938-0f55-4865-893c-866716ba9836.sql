-- Add per-product commission rate override (nullable = uses org default)
ALTER TABLE public.digital_products
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.digital_products.commission_rate IS 'Per-product ambassador commission rate override (%). If NULL, org default applies.';