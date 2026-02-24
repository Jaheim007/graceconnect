-- First, sync like_count from actual media_likes data
UPDATE media_content mc
SET like_count = (SELECT count(*) FROM media_likes ml WHERE ml.media_id = mc.id);

-- Create a function to increment view_count (used from client)
CREATE OR REPLACE FUNCTION public.increment_view_count(media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE media_content SET view_count = COALESCE(view_count, 0) + 1 WHERE id = media_id;
END;
$$;

-- Create a function to increment like_count
CREATE OR REPLACE FUNCTION public.increment_like_count(media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE media_content SET like_count = COALESCE(like_count, 0) + 1 WHERE id = media_id;
END;
$$;

-- Create a function to decrement like_count
CREATE OR REPLACE FUNCTION public.decrement_like_count(media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE media_content SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = media_id;
END;
$$;