CREATE TABLE public.ai_safety_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  surface text NOT NULL,
  category text NOT NULL,
  verdict jsonb,
  message_excerpt text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_safety_flags TO service_role;
GRANT SELECT ON public.ai_safety_flags TO authenticated;

ALTER TABLE public.ai_safety_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view safety flags"
ON public.ai_safety_flags
FOR SELECT TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE INDEX ai_safety_flags_created_idx ON public.ai_safety_flags (created_at DESC);
CREATE INDEX ai_safety_flags_category_idx ON public.ai_safety_flags (category);