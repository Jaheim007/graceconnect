// Checkout for paid template clones — routes Paystack (XOF/GHS/KES) or Stripe (others)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_CURRENCIES = new Set(['XOF', 'GHS', 'KES', 'NGN', 'ZAR']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user?.email) return jsonError('Unauthorized', 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { template_id, target_org_id, callback_url } = await req.json();
    if (!template_id || !target_org_id) return jsonError('template_id + target_org_id required', 400);

    // Load template
    const { data: tpl } = await admin.from('marketplace_templates')
      .select('*').eq('id', template_id).eq('status', 'approved').maybeSingle();
    if (!tpl) return jsonError('Template not available', 404);

    // Verify cloner permission on target org
    const { data: member } = await admin.from('organization_members')
      .select('role').eq('organization_id', target_org_id).eq('user_id', user.id).maybeSingle();
    if (!member || !['owner','admin'].includes(member.role)) {
      return jsonError('Only owner/admin can clone into target org', 403);
    }
    if (tpl.author_org_id === target_org_id) return jsonError('Cannot clone your own template', 400);
    if (Number(tpl.clone_price) <= 0) return jsonError('Template is free, use marketplace-templates clone action', 400);

    const amount = Number(tpl.clone_price);
    const currency = tpl.currency || 'XOF';
    const provider = PAYSTACK_CURRENCIES.has(currency) ? 'paystack' : 'stripe';
    const reference = `SV-TPLCLN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Pre-record pending clone
    await admin.from('marketplace_template_pending_clones').insert({
      template_id, cloner_org_id: target_org_id, cloner_user_id: user.id,
      payment_reference: reference, provider, amount, currency, status: 'pending',
    });

    if (provider === 'paystack') {
      const PAYSTACK_SECRET = await getPaystackSecretKey();
      // XOF/GHS/KES are zero-decimal in our pricing but Paystack expects amount in subunits → x100
      const paystackAmount = Math.round(amount * 100);
      const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: paystackAmount,
          currency,
          reference,
          callback_url: callback_url || 'https://siteviral.com/marketplace/templates',
          metadata: {
            type: 'template_clone',
            template_id, target_org_id, user_id: user.id,
            payment_reference: reference,
          },
          channels: currency === 'XOF' ? ['mobile_money', 'card'] : ['card', 'mobile_money', 'bank'],
        }),
      });
      const initData = await initRes.json();
      if (!initData?.status || !initData?.data?.authorization_url) {
        await admin.from('marketplace_template_pending_clones').update({ status: 'failed' }).eq('payment_reference', reference);
        return jsonError(`Paystack init failed: ${initData?.message || 'unknown'}`, 500);
      }
      return jsonOk({ url: initData.data.authorization_url, reference, provider: 'paystack' });
    }

    // Stripe path
    const Stripe = (await import('https://esm.sh/stripe@18.5.0')).default;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2025-08-27.basil' });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(amount * 100),
          product_data: { name: `Template: ${tpl.title}`, description: 'Marketplace SiteViral — clone de template' },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: callback_url || 'https://siteviral.com/marketplace/templates?success=1',
      cancel_url: 'https://siteviral.com/marketplace/templates',
      client_reference_id: reference,
      metadata: {
        type: 'template_clone',
        template_id, target_org_id, user_id: user.id,
        payment_reference: reference,
      },
    });

    return jsonOk({ url: session.url, reference, provider: 'stripe' });
  } catch (e) {
    console.error('checkout-template-clone error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
