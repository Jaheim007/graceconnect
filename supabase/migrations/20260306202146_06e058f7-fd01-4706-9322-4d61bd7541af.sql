
-- Replace raw Supabase URLs with branded custom domain in all stored data

UPDATE public.digital_products SET cover_image_url = replace(cover_image_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE cover_image_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';
UPDATE public.digital_products SET file_url = replace(file_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE file_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';
UPDATE public.digital_products SET external_link = replace(external_link, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE external_link LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.profiles SET avatar_url = replace(avatar_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE avatar_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.organizations SET logo_url = replace(logo_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE logo_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';
UPDATE public.organizations SET banner_url = replace(banner_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE banner_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.events SET image_url = replace(image_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE image_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.announcements SET image_url = replace(image_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE image_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.media_content SET media_url = replace(media_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE media_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';
UPDATE public.media_content SET thumbnail_url = replace(thumbnail_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE thumbnail_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.donation_campaigns SET image_url = replace(image_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE image_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.ai_project_assets SET file_url = replace(file_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE file_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.ai_assets SET storage_path = replace(storage_path, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE storage_path LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.programs SET cover_image_url = replace(cover_image_url, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE cover_image_url LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';

UPDATE public.short_links SET image = replace(image, 'https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com') WHERE image LIKE '%xzgpzbrgsxtcsktiprik.supabase.co%';
