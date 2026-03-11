-- Add user_email and user_name to support_tickets for admin visibility
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_name text;

-- Add screenshot_urls array for multiple screenshots  
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS screenshot_urls text[] DEFAULT '{}';

-- Migrate existing screenshot_url data to screenshot_urls
UPDATE public.support_tickets 
SET screenshot_urls = ARRAY[screenshot_url]
WHERE screenshot_url IS NOT NULL AND (screenshot_urls IS NULL OR screenshot_urls = '{}');

-- Add closed_at and closed_by columns
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by uuid;