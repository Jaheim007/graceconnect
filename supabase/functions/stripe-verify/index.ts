import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * stripe-verify: Called by the frontend after Stripe redirects back.
 * Verifies the Checkout Session status and returns transaction details.
 * The actual transaction recording is done by stripe-webhook,
 * this just returns the result to the frontend.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to find the transaction (webhook may have already processed it)
    // Check both tables
    const { data: purchase } = await db.from('product_purchases')
      .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (purchase) {
      return new Response(JSON.stringify({
        ok: true,
        transaction_id: purchase.id,
        breakdown: {
          amount: purchase.amount,
          currency: purchase.currency,
          platform_fee: purchase.platform_fee,
          affiliate_commission: purchase.affiliate_commission,
          organization_amount: purchase.organization_amount,
          affiliate_attributed: (purchase.affiliate_commission || 0) > 0,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: donation } = await db.from('donations')
      .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (donation) {
      return new Response(JSON.stringify({
        ok: true,
        transaction_id: donation.id,
        breakdown: {
          amount: donation.amount,
          currency: donation.currency,
          platform_fee: donation.platform_fee,
          affiliate_commission: donation.affiliate_commission,
          organization_amount: donation.organization_amount,
          affiliate_attributed: (donation.affiliate_commission || 0) > 0,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Not found yet — webhook may not have processed yet
    return new Response(JSON.stringify({
      ok: false,
      pending: true,
      message: 'Transaction is being processed. Please wait a moment.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[stripe-verify] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
