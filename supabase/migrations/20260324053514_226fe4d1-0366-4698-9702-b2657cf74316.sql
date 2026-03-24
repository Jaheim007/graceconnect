-- Backfill blank display_name from auth.users email
UPDATE public.profiles p
SET display_name = INITCAP(REPLACE(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' '), '_', ' '))
FROM auth.users u
WHERE u.id = p.id
  AND u.email IS NOT NULL
  AND (p.display_name IS NULL OR TRIM(p.display_name) = '');