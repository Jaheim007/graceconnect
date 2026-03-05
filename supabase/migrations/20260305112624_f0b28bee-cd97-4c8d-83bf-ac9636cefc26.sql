
-- Fix permissive INSERT policy on scripture_references
-- Replace WITH CHECK (true) with a check that user can use studio on at least one org
DROP POLICY IF EXISTS "studio_insert_scriptures" ON public.scripture_references;
CREATE POLICY "studio_insert_scriptures" ON public.scripture_references
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
  );
