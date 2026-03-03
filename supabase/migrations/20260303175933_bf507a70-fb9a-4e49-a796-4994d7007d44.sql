
-- Add missing payout detail columns to partners table
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS payout_country text,
  ADD COLUMN IF NOT EXISTS payout_provider text,
  ADD COLUMN IF NOT EXISTS payout_bank_code text,
  ADD COLUMN IF NOT EXISTS payout_account_number text,
  ADD COLUMN IF NOT EXISTS payout_account_name text;
