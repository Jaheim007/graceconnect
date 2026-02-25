
-- Add payout fields to profiles for affiliate Transfer Recipient
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paystack_recipient_code text,
  ADD COLUMN IF NOT EXISTS payout_method text, -- 'mobile_money' or 'bank'
  ADD COLUMN IF NOT EXISTS payout_country text, -- e.g. 'CI', 'GH', 'NG'
  ADD COLUMN IF NOT EXISTS payout_provider text, -- e.g. 'orange-ci', 'mtn-ci'
  ADD COLUMN IF NOT EXISTS payout_bank_code text,
  ADD COLUMN IF NOT EXISTS payout_account_number text,
  ADD COLUMN IF NOT EXISTS payout_account_name text,
  ADD COLUMN IF NOT EXISTS payout_currency text DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS recipient_locked boolean DEFAULT false;

-- Allow users to read/update their own payout fields
-- (existing RLS should already cover profiles, but let's ensure update policy exists)
