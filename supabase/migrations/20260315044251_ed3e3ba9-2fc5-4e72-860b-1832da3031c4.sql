-- Create the 'media' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access to media bucket
CREATE POLICY "Public read access to media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'doc-convert');

-- Ensure credit pricing exists for ai_course_structure
INSERT INTO public.credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order, is_active)
VALUES 
  ('ai_course_structure', 'Génération de cours IA', 'programs', 8, 15, 'Génère la structure complète d''un cours (modules + leçons) via l''IA', 20, true)
ON CONFLICT (action_key) DO NOTHING;