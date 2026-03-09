-- ============================
-- user_feedback table for NPS + contextual feedback
-- ============================
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context text NOT NULL, -- 'nps', 'publication', 'first_donation', etc.
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Superadmins can read all feedback (via is_superadmin function)
CREATE POLICY "Superadmins can read all feedback" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- ============================
-- Add social_snippets_json to digital_products if not exists
-- ============================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_products' 
    AND column_name = 'social_snippets_json'
  ) THEN
    ALTER TABLE public.digital_products ADD COLUMN social_snippets_json jsonb;
  END IF;
END $$;

-- ============================
-- faq_items table for dynamic FAQ
-- ============================
CREATE TABLE IF NOT EXISTS public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  locale text NOT NULL DEFAULT 'fr',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQs
CREATE POLICY "Anyone can read published FAQs" ON public.faq_items
  FOR SELECT USING (is_published = true);

-- Superadmins can manage FAQs
CREATE POLICY "Superadmins can manage FAQs" ON public.faq_items
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));
