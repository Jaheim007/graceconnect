CREATE POLICY "Anyone can read active experiments"
ON public.experiments
FOR SELECT
TO anon
USING (is_active = true);