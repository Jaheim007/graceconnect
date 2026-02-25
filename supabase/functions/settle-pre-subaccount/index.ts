import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * settle-pre-subaccount
 * 
 * Called after a vendor creates their Paystack subaccount.
 * Calculates all funds accumulated BEFORE the subaccount existed
 * (i.e. funds sitting in Siteviral's main Paystack balance)
 * and initiates a Transfer to the vendor's subaccount bank details.
 * 
 * This is a one-time reconciliation per organization.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = getPaystackSecretKey();
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify user is admin/owner
    const { data: member } = await db.from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Only org admin/owner can trigger settlement' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get org details — must have subaccount now
    const { data: org } = await db.from('organizations')
      .select('paystack_subaccount_code, paystack_recipient_code, name, currency, payouts_frozen')
      .eq('id', organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (org.payouts_frozen) {
      return new Response(JSON.stringify({ error: 'Payouts frozen for this organization' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!org.paystack_subaccount_code) {
      return new Response(JSON.stringify({ error: 'No subaccount found — create one first' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Calculate pre-subaccount funds ──
    // These are completed transactions that have NO settlement_released_at 
    // and settlement_status = 'held' (meaning they were collected on Siteviral's main account)
    
    const { data: prePurchases } = await db.from('product_purchases')
      .select('id, organization_amount, currency')
      .eq('organization_id', organization_id)
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .is('settlement_released_at', null);

    const { data: preDonations } = await db.from('donations')
      .select('id, organization_amount, currency')
      .eq('organization_id', organization_id)
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .is('settlement_released_at', null);

    const allTransactions = [...(prePurchases || []), ...(preDonations || [])];

    if (allTransactions.length === 0) {
      return new Response(JSON.stringify({ 
        ok: true, 
        settled: false, 
        message: 'No pre-subaccount funds to settle',
        amount: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const totalAmount = allTransactions.reduce((sum, t) => sum + (t.organization_amount || 0), 0);
    const currency = org.currency || allTransactions[0]?.currency || 'XOF';

    if (totalAmount <= 0) {
      return new Response(JSON.stringify({ 
        ok: true, 
        settled: false, 
        message: 'No positive balance to settle',
        amount: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Get or create a Transfer Recipient for the org ──
    // The subaccount has the bank details, but Paystack Transfer API needs a recipient_code.
    // We fetch the subaccount details to get the bank info, then create a recipient.
    let recipientCode = org.paystack_recipient_code;

    if (!recipientCode) {
      // Fetch subaccount details from Paystack to get settlement bank info
      const subRes = await fetch(`https://api.paystack.co/subaccount/${org.paystack_subaccount_code}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const subData = await subRes.json();

      if (!subData.status || !subData.data) {
        return new Response(JSON.stringify({ error: 'Could not fetch subaccount details from Paystack' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const sub = subData.data;
      // Create transfer recipient from subaccount bank details
      const recipientPayload: Record<string, unknown> = {
        type: sub.settlement_bank_type || 'nuban',
        name: sub.business_name || org.name,
        account_number: sub.account_number,
        bank_code: sub.settlement_bank,
        currency: currency,
      };

      const rcpRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(recipientPayload),
      });
      const rcpData = await rcpRes.json();

      if (!rcpData.status) {
        console.error('Recipient creation failed:', rcpData);
        return new Response(JSON.stringify({ error: 'Failed to create transfer recipient', detail: rcpData.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      recipientCode = rcpData.data.recipient_code;

      // Store on the org for future use
      await db.from('organizations').update({ paystack_recipient_code: recipientCode }).eq('id', organization_id);
    }

    // ── Initiate Transfer ──
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(totalAmount * 100), // Paystack expects kobo/cents
        recipient: recipientCode,
        reason: `Siteviral — pre-subaccount settlement for ${org.name} (${allTransactions.length} transactions)`,
      }),
    });
    const transferData = await transferRes.json();

    if (!transferData.status) {
      console.error('Transfer failed:', transferData);
      // Audit the failure but don't block — funds are safe
      await db.from('audit_logs').insert({
        user_id: user.id,
        organization_id,
        action: 'pre_subaccount_settle_failed',
        resource_type: 'organization',
        resource_id: organization_id,
        metadata: { error: transferData.message, amount: totalAmount, currency, transaction_count: allTransactions.length },
      });
      return new Response(JSON.stringify({ 
        error: 'Transfer failed — funds are safe and can be retried',
        detail: transferData.message,
        amount: totalAmount,
        currency,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Mark all pre-subaccount transactions as settled ──
    const now = new Date().toISOString();
    const purchaseIds = (prePurchases || []).map(p => p.id);
    const donationIds = (preDonations || []).map(d => d.id);

    if (purchaseIds.length) {
      await db.from('product_purchases').update({
        settlement_status: 'released',
        settlement_released_at: now,
      }).in('id', purchaseIds);
    }

    if (donationIds.length) {
      await db.from('donations').update({
        settlement_status: 'released',
        settlement_released_at: now,
      }).in('id', donationIds);
    }

    // ── Audit log ──
    await db.from('audit_logs').insert({
      user_id: user.id,
      organization_id,
      action: 'pre_subaccount_settled',
      resource_type: 'organization',
      resource_id: organization_id,
      metadata: {
        amount: totalAmount,
        currency,
        transaction_count: allTransactions.length,
        purchase_count: purchaseIds.length,
        donation_count: donationIds.length,
        transfer_code: transferData.data?.transfer_code,
        recipient_code: recipientCode,
      },
    });

    // ── Notify org admin ──
    await db.from('user_notifications').insert({
      user_id: user.id,
      organization_id,
      title: '💰 Fonds accumulés transférés',
      body: `${totalAmount.toLocaleString('fr-FR')} ${currency} de ventes pré-inscription ont été transférés vers votre compte.`,
      notification_type: 'payout',
    });

    // Email notification
    const adminEmail = await getUserEmail(user.id);
    if (adminEmail) {
      sendEmail({
        template: 'pre_subaccount_settled',
        to: adminEmail,
        data: { org_name: org.name, amount: totalAmount, currency, transaction_count: allTransactions.length },
        organization_id,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      ok: true,
      settled: true,
      amount: totalAmount,
      currency,
      transaction_count: allTransactions.length,
      transfer_code: transferData.data?.transfer_code,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('settle-pre-subaccount error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
