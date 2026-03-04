-- Allow anyone (authenticated or anonymous) to submit a partner application
CREATE POLICY "partner_insert_application"
ON public.partners
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- Allow anon users to read their own record by email (for duplicate check)
-- Keep existing select policy for authenticated users