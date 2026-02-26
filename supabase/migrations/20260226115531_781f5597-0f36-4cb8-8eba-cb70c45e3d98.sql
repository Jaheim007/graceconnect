
-- Add is_express_demo flag to products and campaigns
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS is_express_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.donation_campaigns ADD COLUMN IF NOT EXISTS is_express_demo boolean NOT NULL DEFAULT false;
