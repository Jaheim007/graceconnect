
-- Fix permissive RLS: badges are only inserted by SECURITY DEFINER triggers
DROP POLICY IF EXISTS "System inserts badges" ON public.user_badges;
