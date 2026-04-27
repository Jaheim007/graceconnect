-- Create enum for platform plan tiers
DO $$ BEGIN
  CREATE TYPE public.platform_plan_tier AS ENUM ('free', 'pro', 'org');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.platform_plan_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan public.platform_plan_tier NOT NULL,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  note TEXT,
  source TEXT,
  locale TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_platform_plan_waitlist_plan ON public.platform_plan_waitlist(plan);
CREATE INDEX IF NOT EXISTS idx_platform_plan_waitlist_user ON public.platform_plan_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_plan_waitlist_created ON public.platform_plan_waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE public.platform_plan_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can insert into the waitlist
CREATE POLICY "Anyone can join waitlist"
ON public.platform_plan_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated users can view their own entries
CREATE POLICY "Users see own waitlist entries"
ON public.platform_plan_waitlist
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Superadmins can view everything (using existing has_role function if available)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_superadmin'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Superadmins manage waitlist"
      ON public.platform_plan_waitlist
      FOR ALL
      TO authenticated
      USING (public.is_superadmin(auth.uid()))
      WITH CHECK (public.is_superadmin(auth.uid()))
    $POLICY$;
  END IF;
END $$;