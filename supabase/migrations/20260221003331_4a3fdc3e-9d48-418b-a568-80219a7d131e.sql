
-- Allow document and media MIME types in org-uploads bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
  'application/epub+zip',
  'application/zip',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/quicktime'
]
WHERE id = 'org-uploads';

-- Enable monetization for the organization so payments can be verified
UPDATE public.organizations 
SET monetization_enabled = true 
WHERE id = '86fa2d71-2337-4dd8-9883-532a1786701b';
