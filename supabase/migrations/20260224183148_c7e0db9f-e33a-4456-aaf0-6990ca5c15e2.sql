-- Update affiliate sales payable delay from 72h to 15 days
ALTER TABLE public.affiliate_sales 
ALTER COLUMN payable_at SET DEFAULT (now() + interval '15 days');