-- Fix 1: Allow any authenticated user to insert themselves as a member
-- The existing policy only allows admins to insert members (invites)
-- We need a separate policy allowing users to self-join
CREATE POLICY "orgmem_self_insert"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fix 2: Create storage bucket for org media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-uploads',
  'org-uploads',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for org-uploads bucket
CREATE POLICY "org_uploads_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-uploads');

CREATE POLICY "org_uploads_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-uploads'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "org_uploads_auth_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-uploads'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "org_uploads_auth_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-uploads'
    AND auth.uid() IS NOT NULL
  );