import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';

/**
 * stripe-credit-checkout: Creates a Stripe Checkout Session specifically for credit pack purchases.
 * After payment, Stripe redirects to success_url with session_id for verification.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { purchase_id, success_url, cancel_url } = await req.json();
    if (!purchase_id) {
      return jsonResp({ error: 'purchase_id is required' }, 400);
    }

    const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET) {
      return jsonResp({ error: 'Stripe not configured' }, 500);
    }

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Load the pending purchase
    const { data: purchase, error: purchaseErr } = await admin
      .from('credit_purchases')
      .select('*')
      .eq('id', purchase_id)
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .single();

    if (purchaseErr || !purchase) {
      return jsonResp({ error: 'Purchase not found or already completed' }, 404);
    }

    // Get user email
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(auth.userId);
    if (userErr || !user) {
      return jsonResp({ error: 'User not found' }, 404);
    }

    // Load pack name
    const { data: pack } = await admin
      .from('credit_packs')
      .select('name')
      .eq('pack_key', purchase.pack_key)
      .single();

    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2025-08-27.basil' });

    // XOF is a zero-decimal currency
    const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];
    const currency = (purchase.price_currency || 'XOF').toUpperCase();
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const stripeAmount = isZeroDecimal ? Math.round(purchase.price_amount) : Math.round(purchase.price_amount * 100);

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Build success URL with purchase_id and session_id placeholder
    const baseSuccess = success_url || `${req.headers.get('origin')}/credits`;
    const successUrlFull = `${baseSuccess}${baseSuccess.includes('?') ? '&' : '?'}credit_purchase_id=${purchase_id}&stripe_session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${purchase.credits_amount} Crédits IA — ${pack?.name || purchase.pack_key}`,
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrlFull,
      cancel_url: cancel_url || baseSuccess,
      metadata: {
        type: 'credit_purchase',
        purchase_id,
        pack_key: purchase.pack_key,
        credits: String(purchase.credits_amount),
        user_id: auth.userId,
      },
    });

    return jsonResp({
      ok: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (e: any) {
    console.error('stripe-credit-checkout error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
