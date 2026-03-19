-- Allow authenticated users to see profiles of members in the same org
CREATE POLICY "profiles_select_org_members"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id IN (
        SELECT om2.organization_id FROM public.organization_members om2
        WHERE om2.user_id = auth.uid()
      )
    )
  );