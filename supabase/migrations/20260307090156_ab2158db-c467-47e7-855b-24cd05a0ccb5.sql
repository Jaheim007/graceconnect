-- Add Pay What You Want support to digital_products
ALTER TABLE public.digital_products 
  ADD COLUMN IF NOT EXISTS is_pwyw boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_price numeric DEFAULT NULL;

COMMENT ON COLUMN public.digital_products.is_pwyw IS 'Pay What You Want: buyer chooses the price above min_price';
COMMENT ON COLUMN public.digital_products.min_price IS 'Minimum price for PWYW products (e.g. 500 XOF, 1 USD)';