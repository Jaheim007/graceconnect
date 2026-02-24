
-- Add country and payout method to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'CI',
  ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'bank' CHECK (payout_method IN ('bank', 'mobile_money')),
  ADD COLUMN IF NOT EXISTS momo_provider text,
  ADD COLUMN IF NOT EXISTS momo_number text,
  ADD COLUMN IF NOT EXISTS settlement_released boolean DEFAULT false;

-- Add settlement tracking to transactions
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'held' CHECK (settlement_status IN ('held', 'released', 'disputed', 'frozen')),
  ADD COLUMN IF NOT EXISTS settlement_released_at timestamptz;

ALTER TABLE public.product_purchases
  ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'held' CHECK (settlement_status IN ('held', 'released', 'disputed', 'frozen')),
  ADD COLUMN IF NOT EXISTS settlement_released_at timestamptz;

-- Add dispute tracking  
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS dispute_status text,
  ADD COLUMN IF NOT EXISTS dispute_id text;

ALTER TABLE public.product_purchases
  ADD COLUMN IF NOT EXISTS dispute_status text,
  ADD COLUMN IF NOT EXISTS dispute_id text;

-- Add affiliate freeze flag
ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS freeze_reason text;

-- Add paystack_recipient_code to organizations for direct Transfer API payouts
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS paystack_recipient_code text;

-- Country-payout support table
CREATE TABLE IF NOT EXISTS public.supported_payout_countries (
  country_code text PRIMARY KEY,
  country_name text NOT NULL,
  currency text NOT NULL,
  bank_payout boolean DEFAULT true,
  momo_payout boolean DEFAULT false,
  transfer_api boolean DEFAULT false,
  momo_providers text[] DEFAULT '{}',
  paystack_supported boolean DEFAULT true,
  notes text
);

-- Seed supported countries
INSERT INTO public.supported_payout_countries (country_code, country_name, currency, bank_payout, momo_payout, transfer_api, momo_providers, paystack_supported) VALUES
  ('CI', 'Côte d''Ivoire', 'XOF', true, true, true, ARRAY['orange-ci', 'mtn-ci', 'moov-ci'], true),
  ('NG', 'Nigeria', 'NGN', true, false, true, '{}', true),
  ('GH', 'Ghana', 'GHS', true, true, true, ARRAY['mtn-gh', 'vodafone-gh', 'airteltigo-gh'], true),
  ('KE', 'Kenya', 'KES', true, true, true, ARRAY['mpesa'], true),
  ('ZA', 'South Africa', 'ZAR', true, false, true, '{}', true)
ON CONFLICT (country_code) DO NOTHING;

-- RLS for supported_payout_countries (public read)
ALTER TABLE public.supported_payout_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supported countries" ON public.supported_payout_countries FOR SELECT USING (true);
