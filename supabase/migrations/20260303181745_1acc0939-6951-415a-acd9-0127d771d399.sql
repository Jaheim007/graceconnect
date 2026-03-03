
-- Add missing columns to partner_payout_requests for edge function compatibility
ALTER TABLE public.partner_payout_requests
  ADD COLUMN IF NOT EXISTS commission_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by uuid,
  ADD COLUMN IF NOT EXISTS paystack_reference text;
