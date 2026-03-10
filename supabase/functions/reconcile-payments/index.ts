import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * reconcile-payments: Fetches recent Paystack transactions and processes any
 * that are missing from our DB. Called manually by superadmin or via cron.
 *
 * Query params / body:
 *   pages  — number of Paystack pages to scan (default 5, max 20)
 *   from   — ISO date string to filter from (default: 30 days ago)
 *   to     — ISO date string to filter to (default: now)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Auth: superadmin only ──
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const { data: saCheck } = await db.rpc('is_superadmin', { _user_id: user.id });
  if (!saCheck) {
    return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403, headers: corsHeaders });
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const maxPages = Math.min(Number(body.pages) || 5, 20);
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = body.from ? new Date(body.from) : defaultFrom;
    const to = body.to ? new Date(body.to) : now;

    const PAYSTACK_SECRET = getPaystackSecretKey();
    const perPage = 100;

    const reconciled: Array<{ reference: string; amount: number; status: string; error?: string }> = [];
    const skipped: string[] = [];
    let totalScanned = 0;

    for (let page = 1; page <= maxPages; page++) {
      const url = new URL('https://api.paystack.co/transaction');
      url.searchParams.set('perPage', String(perPage));
      url.searchParams.set('page', String(page));
      url.searchParams.set('status', 'success');
      url.searchParams.set('from', from.toISOString());
      url.searchParams.set('to', to.toISOString());

      const psRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const psData = await psRes.json();

      if (!psData.status || !psData.data?.length) break;

      for (const tx of psData.data) {
        totalScanned++;
        const reference = tx.reference as string;

        // Only process our own references
        if (!reference?.startsWith('SV-')) {
          skipped.push(reference);
          continue;
        }

        const meta = tx.metadata || {};

        // ── CREDIT PURCHASE reconciliation (no org needed) ──
        if (meta.type === 'credit_purchase') {
          const purchaseId = meta.purchase_id as string | undefined;
          if (!purchaseId) {
            reconciled.push({ reference, amount: tx.amount / 100, status: 'skipped_no_purchase_id' });
            continue;
          }

          // Check if already completed
          const { data: existingPurchase } = await db
            .from('credit_purchases')
            .select('id, status')
            .eq('id', purchaseId)
            .maybeSingle();

          if (existingPurchase?.status === 'completed') {
            skipped.push(reference);
            continue;
          }

          if (!existingPurchase) {
            // Purchase record missing — try to recreate from metadata
            const userId = meta.user_id as string || tx.customer?.email;
            if (!userId) {
              reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: 'No user_id in credit_purchase metadata' });
              continue;
            }
            reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: 'Purchase record not found for id: ' + purchaseId });
            continue;
          }

          try {
            const { data: result, error: completeErr } = await db.rpc('complete_credit_purchase', {
              _purchase_id: purchaseId,
              _payment_reference: reference,
            });

            if (completeErr) {
              reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: completeErr.message });
              console.error(`[reconcile] credit_purchase error for ${reference}:`, completeErr.message);
            } else {
              const res = result as any;
              if (res?.ok) {
                // Send notification
                const { data: purchase } = await db.from('credit_purchases')
                  .select('user_id, credits_amount')
                  .eq('id', purchaseId)
                  .maybeSingle();

                if (purchase) {
                  await db.from('user_notifications').insert({
                    user_id: purchase.user_id,
                    title: '💰 Crédits reçus (réconciliation) !',
                    body: `Vous avez reçu ${purchase.credits_amount} crédits IA. Désolé pour le délai !`,
                    notification_type: 'credit_purchase',
                    action_url: '/credits',
                  });
                }

                reconciled.push({ reference, amount: tx.amount / 100, status: 'reconciled' });
              } else {
                reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: res?.reason || 'complete_credit_purchase failed' });
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: msg });
            console.error(`[reconcile] credit_purchase exception for ${reference}:`, msg);
          }
          continue;
        }

        // ── DONATION / PRODUCT reconciliation ──
        // Check if already in DB
        const [{ data: donationExists }, { data: purchaseExists }] = await Promise.all([
          db.from('donations').select('id').eq('paystack_reference', reference).eq('status', 'completed').maybeSingle(),
          db.from('product_purchases').select('id').eq('paystack_reference', reference).eq('status', 'completed').maybeSingle(),
        ]);

        if (donationExists || purchaseExists) {
          skipped.push(reference);
          continue;
        }

        const type = (meta.type === 'product' ? 'product' : 'donation') as 'donation' | 'product';
        const organizationId = meta.organization_id as string | undefined;

        if (!organizationId) {
          reconciled.push({ reference, amount: tx.amount / 100, status: 'skipped_no_org' });
          continue;
        }

        try {
          const result = await processTransaction(db, {
            reference,
            type,
            organization_id: organizationId,
            gateway: 'paystack',
            source: 'webhook',
            amount_paid: tx.amount / 100,
            currency: tx.currency || 'XOF',
            campaign_id: meta.campaign_id || null,
            product_id: meta.product_id || null,
            user_id: meta.user_id || null,
            donor_name: meta.donor_name || meta.buyer_name || tx.customer?.name || null,
            donor_email: meta.donor_email || meta.buyer_email || tx.customer?.email || null,
            buyer_name: meta.buyer_name || meta.donor_name || tx.customer?.name || null,
            buyer_email: meta.buyer_email || meta.donor_email || tx.customer?.email || null,
            affiliate_code: meta.affiliate_code || null,
            promo_code: meta.promo_code || null,
          });

          reconciled.push({
            reference,
            amount: tx.amount / 100,
            status: result.idempotent ? 'already_existed' : 'reconciled',
          });
        } catch (err) {
          const msg = err instanceof TransactionError ? err.message : String(err);
          reconciled.push({ reference, amount: tx.amount / 100, status: 'error', error: msg });
          console.error(`[reconcile] Failed for ${reference}:`, msg);
        }
      }

      // If fewer results than perPage, we've reached the last page
      if (psData.data.length < perPage) break;
    }

    // Audit log
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'payments.reconcile',
      resource_type: 'system',
      metadata: {
        total_scanned: totalScanned,
        reconciled_count: reconciled.filter(r => r.status === 'reconciled').length,
        errors_count: reconciled.filter(r => r.status === 'error').length,
        skipped_count: skipped.length,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });

    const summary = {
      ok: true,
      total_scanned: totalScanned,
      reconciled: reconciled.filter(r => r.status === 'reconciled'),
      errors: reconciled.filter(r => r.status === 'error'),
      skipped_no_org: reconciled.filter(r => r.status === 'skipped_no_org'),
      already_existed: reconciled.filter(r => r.status === 'already_existed').length,
      skipped_non_sv: skipped.length,
    };

    console.log(`[reconcile] Done: ${summary.reconciled.length} reconciled, ${summary.errors.length} errors, ${totalScanned} scanned`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[reconcile] Fatal error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
