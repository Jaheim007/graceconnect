import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Auth & Permission Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { transaction_id, type, reason } = await req.json();

    if (!transaction_id || !type || !['donation', 'product'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch transaction
    const table = type === 'donation' ? 'donations' : 'product_purchases';
    const { data: tx } = await db.from(table).select('*').eq('id', transaction_id).single();

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (tx.status === 'refunded') {
      return new Response(JSON.stringify({ error: 'Already refunded' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify ownership/admin rights
    const { data: member } = await db.from('organization_members')
      .select('role')
      .eq('organization_id', tx.organization_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    const { data: platformRole } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
    const isSuperadmin = platformRole?.role === 'superadmin';

    if (!member && !isSuperadmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Process Refund via Gateway
    let refundRef = '';
    const isStripe = tx.paystack_reference?.startsWith('SV-STRIPE-');
    const gateway = isStripe ? 'stripe' : 'paystack';

    if (gateway === 'paystack') {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx.paystack_reference, customer_note: reason }),
      });
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Paystack refund failed');
      refundRef = data.data.id?.toString() || 'paystack-refund';
    } else {
      // Stripe refund via Refunds API
      const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2025-08-27.basil' });

      // Extract Stripe payment intent ID from reference (format: SV-STRIPE-{pi_xxx})
      const piId = tx.stripe_payment_intent_id || tx.paystack_reference?.replace('SV-STRIPE-', '');

      if (!piId || !piId.startsWith('pi_')) {
        // Cannot auto-refund without a valid PaymentIntent ID — mark for manual processing
        refundRef = 'stripe-manual-required';
        console.warn(`Stripe refund: no valid PI ID for tx ${transaction_id}, marking manual`);
      } else {
        const refund = await stripe.refunds.create({
          payment_intent: piId,
          reason: 'requested_by_customer',
        });
        refundRef = refund.id;
      }
    }

    // 3. Update Database
    await db.from(table).update({
      status: 'refunded',
      settlement_status: 'refunded',
    }).eq('id', transaction_id);

    // 4. Void Affiliate Commission
    if (tx.affiliate_link_id) {
      await db.from('affiliate_sales')
        .update({ status: 'cancelled', commission_amount: 0 })
        .eq('transaction_id', transaction_id);
    }

    // 5. Create Refund Request Record
    await db.from('refund_requests').insert({
      organization_id: tx.organization_id,
      [type === 'donation' ? 'donation_id' : 'purchase_id']: transaction_id,
      reason,
      status: refundRef === 'stripe-manual-required' ? 'pending' : 'completed',
      refunded_amount: tx.amount,
      currency: tx.currency,
      gateway_refund_id: refundRef,
    });

    // 6. Audit Log
    await db.from('audit_logs').insert({
      user_id: user.id,
      organization_id: tx.organization_id,
      action: 'transaction_refunded',
      resource_type: 'transaction',
      resource_id: transaction_id,
      metadata: { amount: tx.amount, currency: tx.currency, reason, gateway, refund_ref: refundRef },
    });

    return new Response(JSON.stringify({
      ok: true,
      status: refundRef === 'stripe-manual-required' ? 'pending_manual' : 'refunded',
      gateway,
      refund_ref: refundRef,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('refund-transaction error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
