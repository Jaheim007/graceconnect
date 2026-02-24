-- Add flash sale support to digital_products
ALTER TABLE public.digital_products
ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz DEFAULT NULL;