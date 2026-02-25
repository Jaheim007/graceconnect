-- Fix Supabase linter WARN: permissive RLS policy always true on waitlist_entries INSERT
DROP POLICY IF EXISTS "waitlist_entries_public_insert" ON public.waitlist_entries;

CREATE POLICY "waitlist_entries_public_insert"
ON public.waitlist_entries
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.waitlists w
    WHERE w.id = waitlist_entries.waitlist_id
      AND w.is_active = true
  )
  AND email IS NOT NULL
  AND length(email) <= 255
  AND position('@' in email) > 1
  AND position('.' in email) > position('@' in email) + 1
  AND (name IS NULL OR length(name) <= 120)
);
