/**
 * Platform Subscriptions CRON
 *
 * Runs hourly. Handles:
 *   1. Paystack recurring charges  : when current_period_end is past, charge the
 *      saved authorization and extend the period (or mark past_due / canceled).
 *   2. Trial expiration emails     : J-3, J-1 and J0 reminders for Pro trials.
 *   3. Grandfather expiration      : downgrade users whose 60-day grace ended
 *      and who never subscribed.
 *   4. State sync                  : mark trials → active when paid, expire
 *      past_due after 7 days unpaid, refresh founder lifetime flags.
 *
 * Secrets: PAYSTACK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_BASE = 'https://api.paystack.co';

interface ChargeResult { success: boolean; reference?: string; error?: string }

async function chargePaystackAuthorization(
  authCode: string,
  email: string,
  amountKobo: number,
  currency: string,
  metadata: Record<string, unknown>,
  secret: string,
): Promise<ChargeResult> {
  try {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/charge_authorization`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_code: authCode,
        email,
        amount: amountKobo,
        currency,
        metadata,
      }),
    });
    const json = await res.json();
    if (json?.status && json?.data?.status === 'success') {
      return { success: true, reference: json.data.reference };
    }
    return { success: false, error: json?.data?.gateway_response || json?.message || 'charge_failed' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'network_error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY') || '';
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const summary: Record<string, number> = {
    paystack_charges_attempted: 0,
    paystack_charges_succeeded: 0,
    paystack_charges_failed: 0,
    trial_emails_j3: 0,
    trial_emails_j1: 0,
    trial_emails_j0: 0,
    grandfather_expired: 0,
    past_due_canceled: 0,
  };

  const now = new Date();
  const nowIso = now.toISOString();

  try {
    // ════════════════════════════════════════════════════════════
    // 1. PAYSTACK RECURRING CHARGES
    // ════════════════════════════════════════════════════════════
    if (PAYSTACK_SECRET) {
      const { data: dueSubs } = await db
        .from('platform_subscriptions')
        .select('*')
        .eq('provider', 'paystack')
        .in('status', ['active', 'trialing'])
        .lte('current_period_end', nowIso)
        .not('paystack_authorization_code', 'is', null)
        .limit(200);

      for (const sub of dueSubs || []) {
        summary.paystack_charges_attempted++;
        const email = await getUserEmail(sub.user_id);
        if (!email) {
          summary.paystack_charges_failed++;
          continue;
        }
        const amountMinor = Math.round(Number(sub.amount_xof || 0) * 100);
        if (amountMinor <= 0) continue;

        const result = await chargePaystackAuthorization(
          sub.paystack_authorization_code,
          email,
          amountMinor,
          sub.currency || 'XOF',
          {
            user_id: sub.user_id,
            plan_key: sub.metadata?.plan_key,
            platform_subscription: true,
            recurring: true,
          },
          PAYSTACK_SECRET,
        );

        await db.from('platform_subscription_events').insert({
          subscription_id: sub.id,
          provider: 'paystack',
          event_type: result.success ? 'recurring_charge_success' : 'recurring_charge_failed',
          payload: { result, due_at: sub.current_period_end },
        });

        if (result.success) {
          summary.paystack_charges_succeeded++;
          const periodStart = new Date(sub.current_period_end || nowIso);
          const periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          await db.from('platform_subscriptions').update({
            status: 'active',
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            last_payment_at: nowIso,
            failed_payment_count: 0,
          }).eq('id', sub.id);

          await sendEmail({
            template: 'platform_subscription_renewed' as any,
            to: email,
            data: {
              plan: sub.plan,
              amount: Number(sub.amount_xof || 0).toLocaleString(),
              currency: sub.currency || 'XOF',
              next_billing: periodEnd.toISOString().slice(0, 10),
            },
          }).catch(() => null);
        } else {
          summary.paystack_charges_failed++;
          const failed = (sub.failed_payment_count || 0) + 1;
          const newStatus = failed >= 3 ? 'canceled' : 'past_due';
          await db.from('platform_subscriptions').update({
            status: newStatus,
            failed_payment_count: failed,
            last_payment_error: result.error,
            canceled_at: newStatus === 'canceled' ? nowIso : null,
          }).eq('id', sub.id);

          // Notify user
          await sendEmail({
            template: 'subscription_payment_failed' as any,
            to: email,
            data: {
              attempt: failed,
              max: 3,
              plan: sub.plan,
              error: result.error || 'Payment failed',
              recovery_url: 'https://siteviral.com/billing',
            },
          }).catch(() => null);
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    // 2. TRIAL EXPIRATION EMAILS (J-3, J-1, J0)
    // ════════════════════════════════════════════════════════════
    const windows: Array<{ key: 'j3' | 'j1' | 'j0'; days: number; tpl: string }> = [
      { key: 'j3', days: 3, tpl: 'trial_ending_3d' },
      { key: 'j1', days: 1, tpl: 'trial_ending_1d' },
      { key: 'j0', days: 0, tpl: 'trial_ending_today' },
    ];

    for (const w of windows) {
      const start = new Date(now.getTime() + (w.days * 24 - 1) * 3600000).toISOString();
      const end = new Date(now.getTime() + (w.days * 24 + 1) * 3600000).toISOString();
      const { data: trials } = await db
        .from('platform_subscriptions')
        .select('id, user_id, plan, trial_end, metadata')
        .eq('status', 'trialing')
        .gte('trial_end', start)
        .lte('trial_end', end);

      for (const t of trials || []) {
        // De-dup via events log
        const { count } = await db
          .from('platform_subscription_events')
          .select('id', { count: 'exact', head: true })
          .eq('subscription_id', t.id)
          .eq('event_type', `trial_email_${w.key}`);
        if ((count || 0) > 0) continue;

        const email = await getUserEmail(t.user_id);
        if (!email) continue;

        await sendEmail({
          template: w.tpl as any,
          to: email,
          data: {
            plan: t.plan,
            trial_end: t.trial_end,
            billing_url: 'https://siteviral.com/billing',
          },
        }).catch(() => null);

        await db.from('platform_subscription_events').insert({
          subscription_id: t.id,
          provider: 'system',
          event_type: `trial_email_${w.key}`,
          payload: { sent_at: nowIso },
        });

        summary[`trial_emails_${w.key}`]++;
      }
    }

    // ════════════════════════════════════════════════════════════
    // 3a. GRANDFATHER REMINDER (J-7 before expiration)
    // ════════════════════════════════════════════════════════════
    const j7Start = new Date(now.getTime() + 6.5 * 86400000).toISOString();
    const j7End = new Date(now.getTime() + 7.5 * 86400000).toISOString();
    const { data: grandSoon } = await db
      .from('platform_subscriptions')
      .select('id, user_id, trial_end')
      .eq('provider', 'grandfather')
      .eq('status', 'trialing')
      .gte('trial_end', j7Start)
      .lte('trial_end', j7End)
      .limit(500);

    for (const g of grandSoon || []) {
      const { count } = await db
        .from('platform_subscription_events')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_id', g.id)
        .eq('event_type', 'grandfather_reminder_j7');
      if ((count || 0) > 0) continue;

      const email = await getUserEmail(g.user_id);
      if (email) {
        await sendEmail({
          template: 'grandfather_ending_soon' as any,
          to: email,
          data: { ends_at: String(g.trial_end || '').slice(0, 10) },
        }).catch(() => null);
      }
      await db.from('platform_subscription_events').insert({
        subscription_id: g.id,
        provider: 'system',
        event_type: 'grandfather_reminder_j7',
        payload: { sent_at: nowIso },
      });
    }

    // ════════════════════════════════════════════════════════════
    // 3b. GRANDFATHER EXPIRATION (60d after launch)
    // ════════════════════════════════════════════════════════════
    const { data: grandExpired } = await db
      .from('platform_subscriptions')
      .select('id, user_id')
      .eq('provider', 'grandfather')
      .eq('status', 'trialing')
      .lte('trial_end', nowIso)
      .limit(500);

    for (const g of grandExpired || []) {
      await db.from('platform_subscriptions').update({
        status: 'canceled',
        canceled_at: nowIso,
      }).eq('id', g.id);

      const email = await getUserEmail(g.user_id);
      if (email) {
        await sendEmail({
          template: 'grandfather_expired' as any,
          to: email,
          data: {
            billing_url: 'https://siteviral.com/billing',
            pricing_url: 'https://siteviral.com/pricing',
          },
        }).catch(() => null);
      }
      summary.grandfather_expired++;
    }

    // ════════════════════════════════════════════════════════════
    // 4. CLEAN UP STALE PAST_DUE (>14d)
    // ════════════════════════════════════════════════════════════
    const cutoff = new Date(now.getTime() - 14 * 24 * 3600000).toISOString();
    const { data: stale } = await db
      .from('platform_subscriptions')
      .select('id')
      .eq('status', 'past_due')
      .lte('current_period_end', cutoff);
    for (const s of stale || []) {
      await db.from('platform_subscriptions').update({
        status: 'canceled',
        canceled_at: nowIso,
      }).eq('id', s.id);
      summary.past_due_canceled++;
    }

    return new Response(JSON.stringify({ ok: true, summary, ts: nowIso }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[platform-subscriptions-cron] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'cron_failed', summary }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
