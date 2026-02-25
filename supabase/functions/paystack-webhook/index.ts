import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from '../_shared/send-email-helper.ts';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

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

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 60)) {
    return new Response('Rate limited', { status: 429 });
  }

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // ── 1. Validate Paystack signature ──
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
    const eventId = event.id || `${event.event}-${Date.now()}`;
    console.log('Paystack webhook event:', event.event, 'id:', eventId);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 2. Idempotency: upsert payment_events ──
    const { data: existingEvent } = await db.from('payment_events')
      .select('id, status')
      .eq('event_id', String(eventId))
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      console.log('Event already processed:', eventId);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = event.data;
    const reference = txData?.reference as string | undefined;

    // Log the event
    if (!existingEvent) {
      await db.from('payment_events').insert({
        event_id: String(eventId),
        provider: 'paystack',
        reference: reference || null,
        payload: event,
        status: 'received',
      });
    }

    // ── Handle dispute events ──
    if (event.event === 'charge.dispute.create' || event.event === 'charge.dispute.remind' || event.event === 'charge.dispute.resolve') {
      const disputeRef = txData?.transaction?.reference || txData?.reference;
      const disputeId = txData?.id || txData?.dispute_id;
      const disputeStatus = event.event === 'charge.dispute.resolve' ? 'resolved' : 'active';

      if (disputeRef) {
        // Mark in donations
        await db.from('donations').update({
          dispute_status: disputeStatus,
          dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        // Mark in purchases
        await db.from('product_purchases').update({
          dispute_status: disputeStatus,
          dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        // Freeze org payouts if active dispute
        if (disputeStatus === 'active') {
          const { data: donation } = await db.from('donations').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const { data: purchase } = await db.from('product_purchases').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const orgId = donation?.organization_id || purchase?.organization_id;
          if (orgId) {
            // Log dispute in audit
            await db.from('audit_logs').insert({
              organization_id: orgId,
              action: 'dispute_opened',
              resource_type: 'payment',
              metadata: { reference: disputeRef, dispute_id: disputeId, event: event.event },
            });
          }
        }
      }

      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, dispute_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Handle transfer events ──
    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const transferStatus = event.event === 'transfer.success' ? 'completed' : event.event === 'transfer.failed' ? 'failed' : 'reversed';
      const reason = txData?.reason || txData?.complete_message || '';

      // Log transfer event
      await db.from('audit_logs').insert({
        action: `transfer_${transferStatus}`,
        resource_type: 'transfer',
        metadata: { transfer_code: txData?.transfer_code, recipient_code: txData?.recipient?.recipient_code, amount: txData?.amount, reason, event: event.event },
      });

      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, transfer_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only process successful charges
    if (event.event !== 'charge.success') {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() })
        .eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountPaid = txData.amount / 100;
    const currency = txData.currency || 'XOF';

    if (!reference) {
      console.error('No reference in webhook data');
      return new Response(JSON.stringify({ error: 'No reference' }), { status: 400 });
    }

    // Only process our own references (SV- prefix)
    if (!reference.startsWith('SV-')) {
      console.log('Ignoring non-SV reference:', reference);
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() })
        .eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Check if already fully processed ──
    // A transaction is "fully processed" only if BOTH the main record is completed
    // AND the affiliate_sales record exists (if applicable)
    const { data: existingDonation } = await db.from('donations').select('id, status, affiliate_link_id, affiliate_commission').eq('paystack_reference', reference).maybeSingle();
    const { data: existingPurchase } = await db.from('product_purchases').select('id, status, affiliate_link_id, affiliate_commission, product_id, user_id, organization_id').eq('paystack_reference', reference).maybeSingle();

    // ── 4. Extract metadata for affiliate/notification processing ──
    const meta = txData.metadata || {};
    const type = meta.type as string | undefined;
    const organizationId = meta.organization_id as string | undefined;
    const productId = meta.product_id as string | undefined;
    const campaignId = meta.campaign_id as string | undefined;
    const userId = meta.user_id as string | undefined;
    const donorName = meta.donor_name as string | undefined;
    const donorEmail = (meta.donor_email as string | undefined) || txData.customer?.email;
    const affiliateCode = meta.affiliate_code as string | undefined;

    // Helper: ensure affiliate processing is complete for a transaction
    async function ensureAffiliateProcessed(
      orgId: string,
      affLinkId: string | null,
      affCommission: number | null,
      txType: string,
      txId: string,
      txAmountPaid: number,
    ) {
      if (!affLinkId || !affCommission || affCommission <= 0) return;

      // Check if affiliate_sale already exists
      const { data: existingSale } = await db.from('affiliate_sales')
        .select('id')
        .eq('affiliate_link_id', affLinkId)
        .eq('transaction_id', txId)
        .maybeSingle();

      if (existingSale) return; // Already processed

      // Get affiliate user ID from link
      const { data: affLink } = await db.from('affiliate_links')
        .select('id, user_id, clicks, conversions, total_earned')
        .eq('id', affLinkId)
        .single();

      if (!affLink) return;

      const { data: org } = await db.from('organizations').select('name, affiliation_commission_percent').eq('id', orgId).single();

      // Insert affiliate sale
      await db.from('affiliate_sales').insert({
        affiliate_link_id: affLinkId,
        affiliate_user_id: affLink.user_id,
        organization_id: orgId,
        transaction_type: txType,
        transaction_id: txId,
        gross_amount: txAmountPaid,
        commission_amount: affCommission,
        commission_percent: org?.affiliation_commission_percent ?? 10,
        status: 'pending',
        payable_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days hold for affiliates
      });

      // Update affiliate link counters
      await db.from('affiliate_links').update({
        conversions: (affLink.conversions || 0) + 1,
        total_earned: (affLink.total_earned || 0) + affCommission,
      }).eq('id', affLinkId);

      // Notification for affiliate
      const commissionFmt = affCommission.toLocaleString('fr-FR');
      await db.from('user_notifications').insert({
        user_id: affLink.user_id,
        organization_id: orgId,
        title: '💰 Commission gagnée !',
        body: `Vous avez gagné ${commissionFmt} ${currency} de commission via ${org?.name || 'une organisation'}.`,
        notification_type: 'commission',
        action_url: '/affiliation',
      });

      // Email to affiliate
      const affEmail = await getUserEmail(affLink.user_id);
      if (affEmail) {
        sendEmail({
          template: 'affiliate_sale',
          to: affEmail,
          data: {
            commission: affCommission, currency, org_name: org?.name || '',
            transaction_type: txType, gross_amount: txAmountPaid,
            commission_percent: org?.affiliation_commission_percent ?? 10,
          },
          organization_id: orgId,
        }).catch(() => {});
      }
    }

    // ── 5. Handle already-completed transactions (ensure affiliate processing) ──
    if (existingDonation?.status === 'completed') {
      // Ensure affiliate was processed
      await ensureAffiliateProcessed(
        existingDonation.affiliate_link_id ? (organizationId || '') : '',
        existingDonation.affiliate_link_id,
        existingDonation.affiliate_commission,
        'donation',
        existingDonation.id,
        amountPaid,
      );
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, idempotent: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existingPurchase?.status === 'completed') {
      // Ensure affiliate was processed
      await ensureAffiliateProcessed(
        existingPurchase.organization_id,
        existingPurchase.affiliate_link_id,
        existingPurchase.affiliate_commission,
        'product',
        existingPurchase.id,
        amountPaid,
      );
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, idempotent: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 6. Complete pending records ──
    if (existingDonation && existingDonation.status !== 'completed') {
      await db.from('donations').update({ status: 'completed', amount: amountPaid, currency, completed_at: new Date().toISOString() }).eq('id', existingDonation.id);
      await ensureAffiliateProcessed(
        organizationId || '',
        existingDonation.affiliate_link_id,
        existingDonation.affiliate_commission,
        'donation',
        existingDonation.id,
        amountPaid,
      );
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, completed: 'donation', id: existingDonation.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existingPurchase && existingPurchase.status !== 'completed') {
      await db.from('product_purchases').update({ status: 'completed', amount: amountPaid, currency, completed_at: new Date().toISOString() }).eq('id', existingPurchase.id);
      // Update sales count
      if (existingPurchase.product_id) {
        const { data: prod } = await db.from('digital_products').select('sales_count').eq('id', existingPurchase.product_id).single();
        if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', existingPurchase.product_id);
      }
      await ensureAffiliateProcessed(
        existingPurchase.organization_id,
        existingPurchase.affiliate_link_id,
        existingPurchase.affiliate_commission,
        'product',
        existingPurchase.id,
        amountPaid,
      );
      // Buyer notification
      if (existingPurchase.user_id) {
        const { data: existingNotif } = await db.from('user_notifications')
          .select('id').eq('user_id', existingPurchase.user_id)
          .eq('notification_type', 'purchase')
          .gte('created_at', new Date(Date.now() - 60000).toISOString())
          .maybeSingle();
        if (!existingNotif) {
          const { data: org } = await db.from('organizations').select('name').eq('id', existingPurchase.organization_id).single();
          await db.from('user_notifications').insert({
            user_id: existingPurchase.user_id,
            organization_id: existingPurchase.organization_id,
            title: '✅ Achat confirmé',
            body: `Votre achat de ${amountPaid.toLocaleString('fr-FR')} ${currency} chez ${org?.name || 'Organisation'} est confirmé.`,
            notification_type: 'purchase',
            action_url: '/resources',
          });
        }
      }
      // Admin notifications
      const { data: admins } = await db.from('organization_members')
        .select('user_id')
        .eq('organization_id', existingPurchase.organization_id)
        .in('role', ['owner', 'admin']);
      if (admins?.length) {
        const { data: org } = await db.from('organizations').select('name').eq('id', existingPurchase.organization_id).single();
        const adminNotifs = admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          organization_id: existingPurchase.organization_id,
          title: '🛍️ Nouvelle vente',
          body: `${amountPaid.toLocaleString('fr-FR')} ${currency} — via ${org?.name || 'Organisation'}`,
          notification_type: 'sale_admin',
          action_url: '/admin/analytics',
        }));
        await db.from('user_notifications').insert(adminNotifs);
      }
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, completed: 'purchase', id: existingPurchase.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 7. No existing record — create one from metadata ──
    if (!organizationId) {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, warning: 'no_metadata' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: org } = await db.from('organizations').select('*').eq('id', organizationId).single();
    if (!org) {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, warning: 'org_not_found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const platformFeePct = org.platform_fee_percent ?? 10;
    const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

    let affiliateLinkId: string | null = null;
    let affiliateUserId: string | null = null;
    let affiliateCommission = 0;

    // Affiliate commission: ONLY on products, NEVER on donations
    if (affiliateCode && org.affiliation_enabled && type === 'product') {
      const { data: affLink } = await db.from('affiliate_links').select('id, user_id, is_active').eq('code', affiliateCode).eq('organization_id', organizationId).maybeSingle();
      if (affLink?.is_active && affLink.user_id !== userId) {
        affiliateLinkId = affLink.id;
        affiliateUserId = affLink.user_id;
        const commPct = org.affiliation_commission_percent ?? 10;
        affiliateCommission = parseFloat((amountPaid * commPct / 100).toFixed(2));
      }
    }

    const organizationAmount = parseFloat((amountPaid - platformFee - affiliateCommission).toFixed(2));

    let transactionId: string;
    if (type === 'product' && productId && userId) {
      const { data: inserted } = await db.from('product_purchases').insert({
        product_id: productId, organization_id: organizationId, user_id: userId,
        amount: amountPaid, currency, paystack_reference: reference, status: 'completed',
        affiliate_link_id: affiliateLinkId, platform_fee: platformFee,
        affiliate_commission: affiliateCommission, organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
      }).select('id').single();
      transactionId = inserted.id;
      const { data: prod } = await db.from('digital_products').select('sales_count, title').eq('id', productId).single();
      if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', productId);
      if (userId) {
        await db.from('user_notifications').insert({ user_id: userId, organization_id: organizationId, title: '✅ Achat confirmé', body: `Votre achat de ${amountPaid.toLocaleString('fr-FR')} ${currency} auprès de ${org.name} est confirmé.`, notification_type: 'purchase', action_url: '/resources' });
        const buyerEmail = await getUserEmail(userId);
        if (buyerEmail) {
          sendEmail({ template: 'purchase_confirmation', to: buyerEmail, data: { product_name: prod?.title || 'Product', org_name: org.name, amount: amountPaid, currency, reference, access_link: 'https://siteviral.com/resources' }, organization_id: organizationId }).catch(() => {});
        }
        sendEmailToOrgAdmins('new_purchase_received', organizationId, { buyer_name: 'A customer', product_name: prod?.title || 'Product', amount: amountPaid, currency, reference }).catch(() => {});
      }
    } else {
      const { data: inserted } = await db.from('donations').insert({
        organization_id: organizationId, campaign_id: campaignId || null, user_id: userId || null,
        donor_name: donorName || null, donor_email: donorEmail || null,
        amount: amountPaid, currency, paystack_reference: reference, status: 'completed', is_recurring: false,
        affiliate_link_id: affiliateLinkId, platform_fee: platformFee,
        affiliate_commission: affiliateCommission, organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
      }).select('id').single();
      transactionId = inserted.id;
      if (campaignId) {
        const { data: campaign } = await db.from('donation_campaigns').select('current_amount').eq('id', campaignId).single();
        if (campaign) await db.from('donation_campaigns').update({ current_amount: (campaign.current_amount || 0) + amountPaid }).eq('id', campaignId);
      }
      if (userId) {
        await db.from('user_notifications').insert({ user_id: userId, organization_id: organizationId, title: '🙏 Don confirmé', body: `Votre don de ${amountPaid.toLocaleString('fr-FR')} ${currency} à ${org.name} a été reçu.`, notification_type: 'donation', action_url: '/dashboard' });
      }
      const donorAddr = donorEmail || (userId ? await getUserEmail(userId) : null);
      if (donorAddr) {
        sendEmail({ template: 'donation_receipt', to: donorAddr, data: { org_name: org.name, amount: amountPaid, currency, reference, date: new Date().toLocaleDateString('fr-FR') }, organization_id: organizationId }).catch(() => {});
      }
      sendEmailToOrgAdmins('new_donation_received', organizationId, { donor_name: donorName || 'Anonymous', amount: amountPaid, currency, org_name: org.name, campaign_name: 'General', reference }).catch(() => {});
    }

    // Admin notifications
    const { data: admins } = await db.from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']);
    if (admins?.length) {
      const adminNotifs = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        organization_id: organizationId,
        title: type === 'product' ? '🛍️ Nouvelle vente' : '💰 Nouveau don reçu',
        body: `${amountPaid.toLocaleString('fr-FR')} ${currency} — ${organizationAmount.toLocaleString('fr-FR')} ${currency} net`,
        notification_type: type === 'product' ? 'sale_admin' : 'donation_admin',
        action_url: '/admin/analytics',
      }));
      await db.from('user_notifications').insert(adminNotifs);
    }

    // Affiliate sales record
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      await ensureAffiliateProcessed(organizationId, affiliateLinkId, affiliateCommission, type || 'donation', transactionId, amountPaid);
    }

    // Mark event processed
    await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('paystack-webhook error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
