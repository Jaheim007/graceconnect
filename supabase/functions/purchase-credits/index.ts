import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';

/**
 * purchase-credits: Initiates a credit pack purchase.
 * Creates a pending credit_purchases record and returns pack info for frontend payment.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { pack_key } = await req.json();
    if (!pack_key || typeof pack_key !== 'string') {
      return jsonResp({ error: 'pack_key is required' }, 400);
    }

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Load pack
    const { data: pack, error: packErr } = await admin
      .from('credit_packs')
      .select('*')
      .eq('pack_key', pack_key)
      .eq('is_active', true)
      .single();

    if (packErr || !pack) {
      return jsonResp({ error: 'Pack not found or inactive' }, 404);
    }

    // Get user email for Paystack
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(auth.userId);
    if (userErr || !user) {
      return jsonResp({ error: 'User not found' }, 404);
    }

    // Calculate total credits (base + bonus)
    const bonusCredits = Math.round(pack.credits * (pack.bonus_percent || 0) / 100);
    const totalCredits = pack.credits + bonusCredits;

    // Create pending purchase record
    const { data: purchase, error: purchaseErr } = await admin
      .from('credit_purchases')
      .insert({
        user_id: auth.userId,
        pack_key: pack.pack_key,
        credits_amount: totalCredits,
        price_amount: pack.price_xof,
        price_currency: 'XOF',
        payment_gateway: 'paystack',
        status: 'pending',
      })
      .select('id')
      .single();

    if (purchaseErr || !purchase) {
      console.error('Failed to create purchase:', purchaseErr);
      return jsonResp({ error: 'Failed to create purchase record' }, 500);
    }

    return jsonResp({
      ok: true,
      purchase_id: purchase.id,
      email: user.email,
      amount: pack.price_xof,
      currency: 'XOF',
      credits: totalCredits,
      pack_name: pack.name,
      metadata: {
        purchase_id: purchase.id,
        pack_key: pack.pack_key,
        credits: totalCredits,
        type: 'credit_purchase',
      },
    });
  } catch (e: any) {
    console.error('purchase-credits error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
