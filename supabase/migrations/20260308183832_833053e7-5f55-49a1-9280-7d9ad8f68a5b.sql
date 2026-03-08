
-- Add buyer_name and buyer_email to product_purchases (like donations already have donor_name/donor_email)
ALTER TABLE public.product_purchases
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_email text;

-- Backfill buyer_email from auth.users for existing purchases
UPDATE public.product_purchases pp
SET buyer_email = u.email
FROM auth.users u
WHERE pp.user_id = u.id
  AND pp.buyer_email IS NULL;

-- Backfill buyer_name from profiles for existing purchases
UPDATE public.product_purchases pp
SET buyer_name = p.display_name
FROM public.profiles p
WHERE pp.user_id = p.id
  AND pp.buyer_name IS NULL
  AND p.display_name IS NOT NULL;
