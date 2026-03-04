import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';
import { rateLimit } from '../_shared/rate-limit.ts';

/**
 * verify-payment: Called by frontend after Paystack popup closes.
 * Validates with Paystack API, then delegates to shared processTransaction().
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyPaymentBody {
  reference: string;
  type?: 'donation' | 'product';
  organization_id?: string;
  campaign_id?: string;
  product_id?: string;
  affiliate_code?: string;
  donor_name?: string;
  donor_email?: string;
  promo_code?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readMetaString(meta: unknown, key: string): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const record = meta as Record<string, unknown>;
  return asString(record[key]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  const rl = await rateLimit(clientIp, 20);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
    });
  }

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body: VerifyPaymentBody = await req.json();
    const { reference, type, organization_id, campaign_id, product_id, affiliate_code, donor_name, donor_email, promo_code } = body;

    // Input validation
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validationErrors: string[] = [];
    if (!reference || typeof reference !== 'string' || reference.length > 100) validationErrors.push('Invalid reference');
    if (type && !['donation', 'product'].includes(type)) validationErrors.push('Invalid type');
    if (organization_id && !UUID_RE.test(organization_id)) validationErrors.push('Invalid organization_id');
    if (campaign_id && !UUID_RE.test(campaign_id)) validationErrors.push('Invalid campaign_id');
    if (product_id && !UUID_RE.test(product_id)) validationErrors.push('Invalid product_id');
    if (affiliate_code && (typeof affiliate_code !== 'string' || affiliate_code.length > 50)) validationErrors.push('Invalid affiliate_code');
    if (donor_name && (typeof donor_name !== 'string' || donor_name.length > 200)) validationErrors.push('Invalid donor_name');
    if (donor_email && (typeof donor_email !== 'string' || donor_email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor_email))) validationErrors.push('Invalid donor_email');
    if (promo_code && (typeof promo_code !== 'string' || promo_code.length > 50)) validationErrors.push('Invalid promo_code');
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validationErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Resolve authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await db.auth.getUser(token);
      userId = authUser?.id ?? null;
    }

    // ── Verify with Paystack API ──
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const psData = await psRes.json();

    if (!psData.status || psData.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not successful', paystack: psData }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const amountPaid = psData.data.amount / 100;
    const currency = psData.data.currency || 'XOF';

    const metadata = psData.data?.metadata || {};
    const metaType = readMetaString(metadata, 'type');

    const resolvedType: 'donation' | 'product' | undefined =
      type === 'donation' || type === 'product'
        ? type
        : (metaType === 'donation' || metaType === 'product' ? metaType : undefined);

    const resolvedOrganizationId = organization_id || readMetaString(metadata, 'organization_id');
    const resolvedCampaignId = campaign_id || readMetaString(metadata, 'campaign_id');
    const resolvedProductId = product_id || readMetaString(metadata, 'product_id');
    const resolvedAffiliateCode = affiliate_code || readMetaString(metadata, 'affiliate_code');
    const resolvedDonorName = donor_name || readMetaString(metadata, 'donor_name') || readMetaString(metadata, 'buyer_name') || asString(psData.data?.customer?.name);
    const resolvedDonorEmail = donor_email || readMetaString(metadata, 'donor_email') || readMetaString(metadata, 'buyer_email') || asString(psData.data?.customer?.email);
    const resolvedPromoCode = promo_code || readMetaString(metadata, 'promo_code');

    if (!resolvedType) {
      return new Response(JSON.stringify({ error: 'Missing payment type in request and Paystack metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!resolvedOrganizationId || !UUID_RE.test(resolvedOrganizationId)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid organization_id in request and Paystack metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (resolvedCampaignId && !UUID_RE.test(resolvedCampaignId)) {
      return new Response(JSON.stringify({ error: 'Invalid campaign_id in Paystack metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (resolvedProductId && !UUID_RE.test(resolvedProductId)) {
      return new Response(JSON.stringify({ error: 'Invalid product_id in Paystack metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Delegate to shared core ──
    const result = await processTransaction(db, {
      reference,
      type: resolvedType,
      organization_id: resolvedOrganizationId,
      gateway: 'paystack',
      source: 'verify',
      amount_paid: amountPaid,
      currency,
      campaign_id: resolvedCampaignId,
      product_id: resolvedProductId,
      user_id: userId,
      donor_name: resolvedDonorName,
      donor_email: resolvedDonorEmail,
      affiliate_code: resolvedAffiliateCode,
      promo_code: resolvedPromoCode,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.error('verify_payment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
