-- Allow authenticated users to read ALL experiments (not just active)
DROP POLICY IF EXISTS "Anyone can read active experiments" ON public.experiments;
CREATE POLICY "Authenticated can read experiments" ON public.experiments
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert experiments they create
CREATE POLICY "Users can insert own experiments" ON public.experiments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own experiments
CREATE POLICY "Users can update own experiments" ON public.experiments
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Allow users to delete their own experiments
CREATE POLICY "Users can delete own experiments" ON public.experiments
  FOR DELETE TO authenticated USING (auth.uid() = created_by);