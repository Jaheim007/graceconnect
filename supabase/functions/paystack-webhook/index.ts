import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 60): boolean {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Rate limiting (generous for webhooks)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 60)) {
    return new Response('Rate limited', { status: 429 });
  }
  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // ── 1. Validate Paystack signature ─────────────────────────────────────
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing x-paystack-signature header');
      return new Response('Unauthorized', { status: 401 });
    }

    const hash = createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = event.data;
    const reference = txData.reference as string;
    const amountPaid = txData.amount / 100; // kobo to currency units
    const currency = txData.currency || 'XOF';

    if (!reference) {
      console.error('No reference in webhook data');
      return new Response(JSON.stringify({ error: 'No reference' }), { status: 400 });
    }

    // Only process our own references (SV- prefix)
    if (!reference.startsWith('SV-')) {
      console.log('Ignoring non-SV reference:', reference);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 2. Check if already completed in donations ────────────────────────
    const { data: existingDonation } = await db
      .from('donations')
      .select('id, status')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (existingDonation?.status === 'completed') {
      console.log('Donation already completed for ref:', reference);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Check if already completed in product_purchases ────────────────
    const { data: existingPurchase } = await db
      .from('product_purchases')
      .select('id, status')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (existingPurchase?.status === 'completed') {
      console.log('Purchase already completed for ref:', reference);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 4. If pending donation exists, complete it ────────────────────────
    if (existingDonation && existingDonation.status !== 'completed') {
      console.log('Completing pending donation:', existingDonation.id);
      await db.from('donations').update({
        status: 'completed',
        amount: amountPaid,
        currency,
        completed_at: new Date().toISOString(),
      }).eq('id', existingDonation.id);

      return new Response(JSON.stringify({ ok: true, completed: 'donation', id: existingDonation.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 5. If pending purchase exists, complete it ────────────────────────
    if (existingPurchase && existingPurchase.status !== 'completed') {
      console.log('Completing pending purchase:', existingPurchase.id);
      await db.from('product_purchases').update({
        status: 'completed',
        amount: amountPaid,
        currency,
        completed_at: new Date().toISOString(),
      }).eq('id', existingPurchase.id);

      // Increment sales count
      const { data: purchase } = await db
        .from('product_purchases')
        .select('product_id')
        .eq('id', existingPurchase.id)
        .single();

      if (purchase?.product_id) {
        const { data: prod } = await db
          .from('digital_products')
          .select('sales_count')
          .eq('id', purchase.product_id)
          .single();
        if (prod) {
          await db.from('digital_products')
            .update({ sales_count: (prod.sales_count || 0) + 1 })
            .eq('id', purchase.product_id);
        }
      }

      return new Response(JSON.stringify({ ok: true, completed: 'purchase', id: existingPurchase.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 6. No existing record — extract metadata to create one ───────────
    // Paystack metadata should contain our transaction details
    const meta = txData.metadata || {};
    const type = meta.type as string | undefined; // 'donation' or 'product'
    const organizationId = meta.organization_id as string | undefined;
    const productId = meta.product_id as string | undefined;
    const campaignId = meta.campaign_id as string | undefined;
    const userId = meta.user_id as string | undefined;
    const donorName = meta.donor_name as string | undefined;
    const donorEmail = meta.donor_email as string | undefined || txData.customer?.email;
    const affiliateCode = meta.affiliate_code as string | undefined;

    if (!organizationId) {
      console.log('No organization_id in metadata, cannot auto-create record. Ref:', reference);
      // Still return 200 to acknowledge the webhook
      return new Response(JSON.stringify({ ok: true, warning: 'no_metadata' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load org for fee calculation
    const { data: org } = await db.from('organizations').select('*').eq('id', organizationId).single();
    if (!org) {
      console.error('Org not found:', organizationId);
      return new Response(JSON.stringify({ ok: true, warning: 'org_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platformFeePct = org.platform_fee_percent ?? 10;
    const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

    // Affiliate resolution
    let affiliateLinkId: string | null = null;
    let affiliateUserId: string | null = null;
    let affiliateCommission = 0;

    if (affiliateCode && org.affiliation_enabled) {
      const { data: affLink } = await db.from('affiliate_links')
        .select('id, user_id, is_active')
        .eq('code', affiliateCode)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (affLink?.is_active) {
        affiliateLinkId = affLink.id;
        affiliateUserId = affLink.user_id;
        const commPct = org.affiliation_commission_percent ?? 10;
        affiliateCommission = parseFloat((amountPaid * commPct / 100).toFixed(2));
      }
    }

    const organizationAmount = parseFloat((amountPaid - platformFee - affiliateCommission).toFixed(2));

    if (type === 'product' && productId && userId) {
      const { data: inserted } = await db.from('product_purchases').insert({
        product_id: productId,
        organization_id: organizationId,
        user_id: userId,
        amount: amountPaid,
        currency,
        paystack_reference: reference,
        status: 'completed',
        affiliate_link_id: affiliateLinkId,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
      }).select('id').single();

      console.log('Created product purchase from webhook:', inserted?.id);

      // Increment sales count
      const { data: prod } = await db.from('digital_products').select('sales_count').eq('id', productId).single();
      if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', productId);

      // Notify user
      if (userId) {
        await db.from('user_notifications').insert({
          user_id: userId,
          organization_id: organizationId,
          title: '✅ Achat confirmé',
          body: `Votre achat de ${amountPaid.toLocaleString('fr-FR')} ${currency} auprès de ${org.name} est confirmé.`,
          notification_type: 'purchase',
          action_url: '/dashboard',
        });
      }
    } else {
      // Default to donation
      const { data: inserted } = await db.from('donations').insert({
        organization_id: organizationId,
        campaign_id: campaignId || null,
        user_id: userId || null,
        donor_name: donorName || null,
        donor_email: donorEmail || null,
        amount: amountPaid,
        currency,
        paystack_reference: reference,
        status: 'completed',
        is_recurring: false,
        affiliate_link_id: affiliateLinkId,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
      }).select('id').single();

      console.log('Created donation from webhook:', inserted?.id);

      // Update campaign amount
      if (campaignId) {
        const { data: campaign } = await db.from('donation_campaigns').select('current_amount').eq('id', campaignId).single();
        if (campaign) {
          await db.from('donation_campaigns').update({ current_amount: (campaign.current_amount || 0) + amountPaid }).eq('id', campaignId);
        }
      }

      // Notify user
      if (userId) {
        await db.from('user_notifications').insert({
          user_id: userId,
          organization_id: organizationId,
          title: '🙏 Don confirmé',
          body: `Votre don de ${amountPaid.toLocaleString('fr-FR')} ${currency} à ${org.name} a été reçu.`,
          notification_type: 'donation',
          action_url: '/dashboard',
        });
      }
    }

    // Affiliate sales record
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      await db.from('affiliate_sales').insert({
        affiliate_link_id: affiliateLinkId,
        affiliate_user_id: affiliateUserId,
        organization_id: organizationId,
        transaction_type: type || 'donation',
        transaction_id: reference,
        gross_amount: amountPaid,
        commission_amount: affiliateCommission,
        commission_percent: org.affiliation_commission_percent ?? 10,
        status: 'pending',
        payable_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('paystack-webhook error:', err);
    // Always return 200 to prevent Paystack from retrying endlessly
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
