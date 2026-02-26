
-- Add offerings_enabled toggle to organizations (default false = opt-in)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS offerings_enabled boolean NOT NULL DEFAULT false;
