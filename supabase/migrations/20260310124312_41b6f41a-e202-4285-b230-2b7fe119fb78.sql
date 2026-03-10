-- Drop the trigger that references non-existent badge_key column
DROP TRIGGER IF EXISTS trg_badge_purchase ON public.product_purchases;
DROP TRIGGER IF EXISTS trg_badge_affiliate ON public.affiliate_sales;
DROP FUNCTION IF EXISTS public.auto_award_badge() CASCADE;