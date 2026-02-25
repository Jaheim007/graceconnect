import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function fnUrl(name: string) {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}`;
}

export async function callFn(name: string, body: unknown, requireAuth = true) {
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
    signal: AbortSignal.timeout(90_000), // 90s timeout for payment operations
  });

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error(`[callFn] Non-JSON response from ${name}:`, text.substring(0, 200));
    throw new Error('Server returned an unexpected response. Please try again.');
  }

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
  promo_code?: string;
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
    discount_amount?: number;
    promo_applied?: boolean;
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
  const result = await callFn('create-paystack-subaccount', args, true);
  // After successful subaccount creation, auto-settle any pre-subaccount funds
  if (result?.ok && !result?.existing) {
    try {
      const settleResult = await callFn('settle-pre-subaccount', { organization_id: args.organization_id }, true);
      result.pre_subaccount_settlement = settleResult;
    } catch (err) {
      console.warn('Pre-subaccount settlement failed (non-blocking):', err);
      result.pre_subaccount_settlement = { error: 'Settlement will be retried' };
    }
  }
  return result;
}

export async function settlePreSubaccount(organization_id: string) {
  return callFn('settle-pre-subaccount', { organization_id }, true);
}

export async function requestAffiliatePayout(organization_id: string) {
  return callFn('request-affiliate-payout', { organization_id }, true);
}

export async function processPayout(payout_request_id: string, action: 'approve' | 'reject') {
  return callFn('process-payout', { payout_request_id, action }, true);
}

export async function releaseSettlement(organization_id?: string) {
  return callFn('release-settlement', { organization_id }, true);
}

export async function migrateSubaccounts(batch_size = 10, dry_run = false) {
  return callFn('migrate-subaccounts', { batch_size, dry_run }, true);
}

// ── Email sending ──
export type EmailTemplate =
  // Auth & Onboarding
  | 'welcome' | 'onboarding_day1' | 'onboarding_day3' | 'onboarding_day7'
  | 'account_deleted' | 'new_device_login' | 'password_changed' | 'email_changed'
  | 'data_export_ready'
  // Re-engagement
  | 'inactive_7d' | 'inactive_14d' | 'inactive_30d' | 'anniversary_1y'
  // Donations
  | 'donation_receipt' | 'new_donation_received' | 'first_donation_milestone'
  | 'campaign_goal_reached' | 'campaign_expiring_soon' | 'payment_failed'
  // Products
  | 'purchase_confirmation' | 'new_purchase_received' | 'download_ready'
  | 'first_sale_milestone'
  // Programs
  | 'program_enrolled' | 'program_completed' | 'lesson_reminder'
  | 'new_module_added' | 'certificate_ready'
  // KYC
  | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
  // Org lifecycle
  | 'org_created' | 'org_deleted' | 'org_suspended' | 'org_unsuspended'
  | 'org_inactive_30d' | 'member_milestone'
  // Members
  | 'new_member_joined' | 'member_left' | 'invite_to_org' | 'role_changed'
  | 'invite_accepted'
  // Payouts
  | 'payout_requested' | 'payout_approved' | 'payout_rejected' | 'payouts_frozen'
  // Affiliates
  | 'affiliate_sale' | 'affiliate_payout_requested' | 'affiliate_payout_completed'
  | 'affiliate_welcome' | 'affiliate_first_click' | 'affiliate_first_conversion'
  | 'affiliate_commission_payable' | 'affiliate_monthly_recap'
  | 'pre_subaccount_settled'
  // Directory
  | 'directory_approved' | 'directory_rejected'
  // Support
  | 'ticket_created' | 'ticket_replied' | 'ticket_resolved'
  // Refunds
  | 'refund_initiated' | 'refund_completed'
  // Content & Social
  | 'content_report_resolved' | 'content_liked' | 'content_saved'
  | 'new_event_published' | 'new_announcement_published'
  | 'new_media_published' | 'new_product_published' | 'new_campaign_published'
  | 'new_program_published'
  // Recaps
  | 'weekly_recap_user' | 'daily_recap_admin' | 'daily_recap_superadmin'
  // Superadmin
  | 'fraud_alert' | 'new_org_alert';

export async function sendEmailNotification(
  template: EmailTemplate,
  to: string,
  data: Record<string, string | number>,
  organization_id?: string,
) {
  try {
    return await callFn('send-email', { template, to, data, organization_id }, true);
  } catch (err) {
    console.error('sendEmailNotification error:', err);
    return { ok: false };
  }
}
