-- Delete download logs linked to the 2 test purchases
DELETE FROM public.download_logs 
WHERE purchase_id IN (
  'ba1f6533-a301-4bce-b57d-7aa7e0212243',
  'c9777650-5ce3-48de-a58f-5ec2016a552c'
);

-- Delete the 2 test purchases
DELETE FROM public.product_purchases 
WHERE id IN (
  'ba1f6533-a301-4bce-b57d-7aa7e0212243',
  'c9777650-5ce3-48de-a58f-5ec2016a552c'
);

-- Decrement sales_count: product 3c505ea0 had 1 sale (now 0)
UPDATE public.digital_products 
SET sales_count = GREATEST(COALESCE(sales_count, 0) - 1, 0) 
WHERE id = '3c505ea0-0b50-4a10-812b-c5483453781c';

-- Decrement sales_count: product f64aa72b had 7 sales (now 6)
UPDATE public.digital_products 
SET sales_count = GREATEST(COALESCE(sales_count, 0) - 1, 0) 
WHERE id = 'f64aa72b-ec37-4dbd-962a-a851acba27f0';