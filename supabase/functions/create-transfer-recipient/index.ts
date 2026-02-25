import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Supported payout countries with their currency and MoMo providers
const COUNTRY_CONFIG: Record<string, { currency: string; momo_providers: { code: string; label: string }[]; bank_type: string }> = {
  CI: {
    currency: 'XOF',
    momo_providers: [
      { code: 'orange-ci', label: 'Orange Money' },
      { code: 'mtn-ci', label: 'MTN MoMo' },
      { code: 'moov-ci', label: 'Moov Money' },
    ],
    bank_type: 'mobile_money',
  },
  GH: {
    currency: 'GHS',
    momo_providers: [
      { code: 'mtn-gh', label: 'MTN MoMo' },
      { code: 'vod-gh', label: 'Vodafone Cash' },
      { code: 'tgo-gh', label: 'AirtelTigo Money' },
    ],
    bank_type: 'mobile_money',
  },
  NG: {
    currency: 'NGN',
    momo_providers: [],
    bank_type: 'nuban',
  },
  KE: {
    currency: 'KES',
    momo_providers: [
      { code: 'mpesa', label: 'M-Pesa' },
    ],
    bank_type: 'mobile_money',
  },
  ZA: { currency: 'ZAR', momo_providers: [], bank_type: 'basa' },
  EG: { currency: 'EGP', momo_providers: [], bank_type: 'bank' },
  RW: { currency: 'RWF', momo_providers: [{ code: 'mtn-rw', label: 'MTN MoMo' }], bank_type: 'mobile_money' },
};

// Rate limiter
const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 5): boolean {
  const key = ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.windowStart > 60000) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 5)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check email verified
    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: 'Email must be verified before setting up payouts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { country, method, provider, bank_code, account_number, account_name } = body;

    // ── Validation ──
    if (!country || typeof country !== 'string' || !COUNTRY_CONFIG[country]) {
      return new Response(JSON.stringify({ error: 'Unsupported country', supported: Object.keys(COUNTRY_CONFIG) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!method || !['mobile_money', 'bank'].includes(method)) {
      return new Response(JSON.stringify({ error: 'Invalid method. Must be mobile_money or bank' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!account_number || typeof account_number !== 'string' || account_number.length < 5 || account_number.length > 30) {
      return new Response(JSON.stringify({ error: 'Invalid account number' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!account_name || typeof account_name !== 'string' || account_name.length < 2 || account_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid account name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const config = COUNTRY_CONFIG[country];

    if (method === 'mobile_money') {
      const validProviders = config.momo_providers.map(p => p.code);
      if (!provider || !validProviders.includes(provider)) {
        return new Response(JSON.stringify({ error: 'Invalid MoMo provider for this country', valid_providers: config.momo_providers }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      if (!bank_code || typeof bank_code !== 'string') {
        return new Response(JSON.stringify({ error: 'bank_code is required for bank transfers' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── Check recipient_locked (from payout_profiles) ──
    const { data: payoutProfile } = await db.from('payout_profiles').select('paystack_recipient_code, recipient_locked').eq('user_id', user.id).maybeSingle();
    if (payoutProfile?.recipient_locked) {
      return new Response(JSON.stringify({ error: 'Your payout method is locked after a completed payout. Contact support to change it.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Build Paystack Transfer Recipient payload ──
    const recipientType = method === 'mobile_money' ? 'mobile_money' : config.bank_type;
    const recipientBankCode = method === 'mobile_money' ? provider : bank_code;

    const paystackPayload: Record<string, unknown> = {
      type: recipientType,
      name: account_name,
      account_number: account_number,
      bank_code: recipientBankCode,
      currency: config.currency,
    };

    // Call Paystack
    const psRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(paystackPayload),
    });
    const psData = await psRes.json();

    if (!psData.status) {
      // Log the error
      await db.from('audit_logs').insert({
        user_id: user.id,
        action: 'transfer_recipient_failed',
        resource_type: 'profile',
        resource_id: user.id,
        metadata: { error: psData.message, country, method, provider: provider || bank_code },
      });
      return new Response(JSON.stringify({ error: 'Paystack rejected the recipient', detail: psData.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientCode = psData.data.recipient_code;

    // ── Upsert payout_profiles (isolated from main profiles) ──
    const payoutData = {
      paystack_recipient_code: recipientCode,
      recipient_locked: false,
      payout_method: method,
      payout_country: country,
      payout_provider: method === 'mobile_money' ? provider : null,
      payout_bank_code: method === 'bank' ? bank_code : null,
      payout_account_number: account_number,
      payout_account_name: account_name,
      payout_currency: config.currency,
    };
    if (payoutProfile) {
      await db.from('payout_profiles').update(payoutData).eq('user_id', user.id);
    } else {
      await db.from('payout_profiles').insert({ user_id: user.id, ...payoutData });
    }

    // Audit log
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'transfer_recipient_created',
      resource_type: 'profile',
      resource_id: user.id,
      metadata: { recipient_code: recipientCode, country, method, provider: provider || bank_code, currency: config.currency },
    });

    return new Response(JSON.stringify({
      ok: true,
      recipient_code: recipientCode,
      currency: config.currency,
      method,
      country,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('create-transfer-recipient error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
