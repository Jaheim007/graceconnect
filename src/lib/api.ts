import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function fnUrl(name: string) {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}`;
}

async function callFn(name: string, body: unknown, requireAuth = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  const res = await fetch(fnUrl(name), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export interface VerifyPaymentArgs {
  reference: string;
  type: 'donation' | 'product';
  organization_id: string;
  campaign_id?: string;
  product_id?: string;
  affiliate_code?: string | null;
  donor_name?: string;
  donor_email?: string;
}

export interface VerifyPaymentResult {
  ok: boolean;
  transaction_id: string;
  idempotent?: boolean;
  breakdown: {
    amount: number;
    currency: string;
    platform_fee: number;
    affiliate_commission: number;
    organization_amount: number;
    affiliate_attributed: boolean;
  };
}

export async function verifyPayment(args: VerifyPaymentArgs): Promise<VerifyPaymentResult> {
  return callFn('verify-payment', args, true);
}

export async function createPaystackSubaccount(args: {
  organization_id: string;
  business_name: string;
  settlement_bank: string;
  account_number: string;
}) {
  return callFn('create-paystack-subaccount', args, true);
}

export async function requestAffiliatePayout(organization_id: string) {
  return callFn('request-affiliate-payout', { organization_id }, true);
}

export async function processPayout(payout_request_id: string, action: 'approve' | 'reject') {
  return callFn('process-payout', { payout_request_id, action }, true);
}
