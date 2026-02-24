
-- Fix overly permissive INSERT policy on abandoned_carts
DROP POLICY IF EXISTS "abandoned_carts_insert" ON public.abandoned_carts;

CREATE POLICY "abandoned_carts_insert_auth" ON public.abandoned_carts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
