-- Add winner_variant column to preserve metadata when declaring winner
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS winner_variant text;

-- Add organization_id for multi-tenant support
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add slot_key for dynamic content resolution (e.g. "product-cta", "product-title")
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS slot_key text;

-- Create index for fast slot lookups
CREATE INDEX IF NOT EXISTS idx_experiments_slot_active ON public.experiments (slot_key, is_active) WHERE is_active = true;

-- Create index for org scoping
CREATE INDEX IF NOT EXISTS idx_experiments_org ON public.experiments (organization_id);
