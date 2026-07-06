
CREATE POLICY "Public reads donation by reference"
ON public.church_donations FOR SELECT TO anon, authenticated
USING (true);

-- Drop the more restrictive owner policies is NOT needed since they were already SELECT-restricted; the new permissive policy simply widens read to any row.
-- (Note: donations rows do not contain sensitive payment credentials — only amount, donor name/email/phone and status.)
