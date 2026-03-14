-- Backfill display_name from OAuth metadata for existing users
UPDATE public.profiles p
SET display_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE u.id = p.id
AND (p.display_name IS NULL OR p.display_name = '')
AND u.raw_user_meta_data->>'full_name' IS NOT NULL
AND u.raw_user_meta_data->>'full_name' != '';

-- Backfill display_name from purchase buyer_name for remaining nulls
UPDATE public.profiles p
SET display_name = pp.buyer_name
FROM (
  SELECT DISTINCT ON (user_id) user_id, buyer_name
  FROM public.product_purchases
  WHERE buyer_name IS NOT NULL AND buyer_name != ''
  ORDER BY user_id, completed_at DESC
) pp
WHERE pp.user_id = p.id
AND (p.display_name IS NULL OR p.display_name = '');