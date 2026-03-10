import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { corsHeaders, jsonResp } from '../_shared/auth.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';

/**
 * verify-credit-purchase: Verifies a payment for credit pack purchase
 * and grants credits via complete_credit_purchase() SQL function.
 * Supports both Paystack and Stripe gateways.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { reference, purchase_id, gateway } = await req.json();
    if (!reference || !purchase_id) {
      return jsonResp({ error: 'reference and purchase_id are required' }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const paymentGateway = gateway || 'paystack';
    let paymentVerified = false;

    if (paymentGateway === 'stripe') {
      // ── STRIPE verification ──
      const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
      if (!STRIPE_SECRET) {
        return jsonResp({ error: 'Stripe not configured' }, 500);
      }
      const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2025-08-27.basil' });

      // reference is the Stripe checkout session ID
      const session = await stripe.checkout.sessions.retrieve(reference);
      paymentVerified = session.payment_status === 'paid';

      if (!paymentVerified) {
        await db.from('credit_purchases').update({
          status: 'failed',
          payment_reference: reference,
        }).eq('id', purchase_id);
        return jsonResp({ error: 'Stripe payment not completed', details: session.payment_status }, 400);
      }
    } else {
      // ── PAYSTACK verification ──
      const PAYSTACK_SECRET = getPaystackSecretKey();
      const paystackResp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const paystackData = await paystackResp.json();

      paymentVerified = paystackData.status && paystackData.data?.status === 'success';

      if (!paymentVerified) {
        await db.from('credit_purchases').update({
          status: 'failed',
          payment_reference: reference,
        }).eq('id', purchase_id);
        return jsonResp({ error: 'Payment not verified', details: paystackData.data?.gateway_response }, 400);
      }

      // Verify the metadata matches (Paystack only — Stripe metadata is in session)
      const txMeta = paystackData.data?.metadata || {};
      if (txMeta.purchase_id !== purchase_id || txMeta.type !== 'credit_purchase') {
        return jsonResp({ error: 'Payment metadata mismatch' }, 400);
      }
    }

    // Complete the purchase — grants credits atomically
    const { data: result, error: completeErr } = await db.rpc('complete_credit_purchase', {
      _purchase_id: purchase_id,
      _payment_reference: reference,
    });

    if (completeErr) {
      console.error('complete_credit_purchase error:', completeErr);
      return jsonResp({ error: 'Failed to grant credits: ' + completeErr.message }, 500);
    }

    const res = result as any;
    if (!res?.ok) {
      return jsonResp({ error: res?.reason || 'Failed to complete purchase' }, 400);
    }

    // Notify user
    const { data: purchase } = await db.from('credit_purchases')
      .select('user_id, pack_key, credits_amount')
      .eq('id', purchase_id)
      .single();

    if (purchase) {
      await db.from('user_notifications').insert({
        user_id: purchase.user_id,
        title: '💰 Crédits reçus !',
        body: `Vous avez reçu ${purchase.credits_amount} crédits IA. Bon usage créatif !`,
        notification_type: 'credit_purchase',
        action_url: '/credits',
      });
    }

    return jsonResp({
      ok: true,
      credits: res.credits,
      balance: res.balance,
    });
  } catch (e: any) {
    console.error('verify-credit-purchase error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
