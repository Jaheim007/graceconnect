
-- Storage RLS policies for church-sermons bucket
CREATE POLICY "Church owners upload sermon audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'church-sermons'
  AND EXISTS (
    SELECT 1 FROM public.church_providers c
    WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
  )
);

CREATE POLICY "Church owners read own sermon audio"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'church-sermons'
  AND EXISTS (
    SELECT 1 FROM public.church_providers c
    WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
  )
);

CREATE POLICY "Church owners delete own sermon audio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'church-sermons'
  AND EXISTS (
    SELECT 1 FROM public.church_providers c
    WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
  )
);

CREATE POLICY "Church owners update own sermon audio"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'church-sermons'
  AND EXISTS (
    SELECT 1 FROM public.church_providers c
    WHERE c.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
  )
);
