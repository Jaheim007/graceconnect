import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * create-transfer-recipient-partner
 * Registers a partner's bank/MoMo account on Paystack as a Transfer Recipient.
 * Stores the recipient_code in partners.paystack_recipient_code.
 * JWT required (partner must be logged in).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
  NG: { currency: 'NGN', momo_providers: [], bank_type: 'nuban' },
  KE: { currency: 'KES', momo_providers: [{ code: 'mpesa', label: 'M-Pesa' }], bank_type: 'mobile_money' },
  ZA: { currency: 'ZAR', momo_providers: [], bank_type: 'basa' },
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

    // Must be an approved partner
    const { data: partner } = await db.from('partners').select('id, status, paystack_recipient_code').eq('user_id', user.id).maybeSingle();
    if (!partner || partner.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'You must be an approved partner' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Already has recipient? Block changes after first payout (lock check)
    // For now, allow re-registration if no payout has been completed
    const { data: completedPayout } = await db.from('partner_payout_requests')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();
    if (completedPayout) {
      return new Response(JSON.stringify({ error: 'Votre méthode de paiement est verrouillée après un versement. Contactez le support.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { country, method, provider, bank_code, account_number, account_name } = body;

    // Validation
    if (!country || !COUNTRY_CONFIG[country]) {
      return new Response(JSON.stringify({ error: 'Pays non supporté', supported: Object.keys(COUNTRY_CONFIG) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!method || !['mobile_money', 'bank'].includes(method)) {
      return new Response(JSON.stringify({ error: 'Méthode invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!account_number || account_number.length < 5 || account_number.length > 30) {
      return new Response(JSON.stringify({ error: 'Numéro de compte invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!account_name || account_name.length < 2 || account_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Nom du titulaire invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const config = COUNTRY_CONFIG[country];

    if (method === 'mobile_money') {
      const validProviders = config.momo_providers.map(p => p.code);
      if (!provider || !validProviders.includes(provider)) {
        return new Response(JSON.stringify({ error: 'Fournisseur MoMo invalide', valid: config.momo_providers }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (!bank_code) {
      return new Response(JSON.stringify({ error: 'bank_code requis pour virement bancaire' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build Paystack payload
    const recipientType = method === 'mobile_money' ? 'mobile_money' : config.bank_type;
    const recipientBankCode = method === 'mobile_money' ? provider : bank_code;

    const psRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: recipientType,
        name: account_name,
        account_number,
        bank_code: recipientBankCode,
        currency: config.currency,
      }),
    });
    const psData = await psRes.json();

    if (!psData.status) {
      await db.from('audit_logs').insert({
        user_id: user.id,
        action: 'partner.transfer_recipient_failed',
        resource_type: 'partner',
        resource_id: partner.id,
        metadata: { error: psData.message, country, method },
      });
      return new Response(JSON.stringify({ error: 'Paystack a rejeté le destinataire', detail: psData.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientCode = psData.data.recipient_code;

    // Update partner record
    await db.from('partners').update({
      paystack_recipient_code: recipientCode,
      payout_method: method,
      payout_country: country,
      payout_provider: method === 'mobile_money' ? provider : null,
      payout_bank_code: method === 'bank' ? bank_code : null,
      payout_account_number: account_number,
      payout_account_name: account_name,
    }).eq('id', partner.id);

    // Audit
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'partner.transfer_recipient_created',
      resource_type: 'partner',
      resource_id: partner.id,
      metadata: { recipient_code: recipientCode, country, method, currency: config.currency },
    });

    return new Response(JSON.stringify({
      ok: true,
      recipient_code: recipientCode,
      currency: config.currency,
      method,
      country,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('create-transfer-recipient-partner error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
