import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { corsHeaders, jsonResp } from '../_shared/auth.ts';

/**
 * verify-credit-purchase: Verifies a Paystack payment for credit pack purchase
 * and grants credits via complete_credit_purchase() SQL function.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { reference, purchase_id } = await req.json();
    if (!reference || !purchase_id) {
      return jsonResp({ error: 'reference and purchase_id are required' }, 400);
    }

    const PAYSTACK_SECRET = getPaystackSecretKey();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify with Paystack
    const paystackResp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const paystackData = await paystackResp.json();

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      // Mark purchase as failed
      await db.from('credit_purchases').update({
        status: 'failed',
        payment_reference: reference,
      }).eq('id', purchase_id);

      return jsonResp({ error: 'Payment not verified', details: paystackData.data?.gateway_response }, 400);
    }

    // Verify the metadata matches
    const txMeta = paystackData.data?.metadata || {};
    if (txMeta.purchase_id !== purchase_id || txMeta.type !== 'credit_purchase') {
      return jsonResp({ error: 'Payment metadata mismatch' }, 400);
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
