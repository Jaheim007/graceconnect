
-- Add gateway column to donations and product_purchases
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'paystack';
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'paystack';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_donations_gateway ON public.donations(gateway);
CREATE INDEX IF NOT EXISTS idx_purchases_gateway ON public.product_purchases(gateway);
