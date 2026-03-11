-- Public-safe profile accessor for review cards (avoids exposing sensitive profile columns)
create or replace function public.get_public_profiles(_user_ids uuid[])
returns table (
  id uuid,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url
  from public.profiles p
  where p.id = any(coalesce(_user_ids, '{}'::uuid[]));
$$;

grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;

-- Enforce mandatory review title + description + published state for user-created reviews
DROP POLICY IF EXISTS reviews_insert_own ON public.product_reviews;
CREATE POLICY reviews_insert_own
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND rating BETWEEN 1 AND 5
  AND title IS NOT NULL
  AND btrim(title) <> ''
  AND comment IS NOT NULL
  AND btrim(comment) <> ''
  AND is_published = true
);

DROP POLICY IF EXISTS reviews_update_own ON public.product_reviews;
CREATE POLICY reviews_update_own
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND rating BETWEEN 1 AND 5
  AND title IS NOT NULL
  AND btrim(title) <> ''
  AND comment IS NOT NULL
  AND btrim(comment) <> ''
  AND is_published = true
);