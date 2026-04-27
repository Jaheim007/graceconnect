/**
 * Monthly Commission Recap CRON
 *
 * Runs once per month (1st of month). For every user that had platform commission
 * activity the previous month, sends a recap email:
 *  - Free tier   → "monthly_commission_recap_paid" (shows what they paid + Pro upsell)
 *  - Pro/Org/Founder → "monthly_commission_recap_saved" (celebrates savings)
 *
 * Idempotent: an event is logged in `platform_subscription_events` to prevent
 * duplicate sends within the same month.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function fmtMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const summary = { recap_paid_sent: 0, recap_saved_sent: 0, skipped_duplicate: 0, errors: 0 };

  try {
    // Compute previous month key (YYYY-MM)
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = prev.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Pull aggregated savings per user for that month
    const { data: rows, error } = await db
      .from('platform_commission_savings')
      .select('user_id, saved_amount_cents, paid_amount_cents, currency, tier')
      .eq('month_key', monthKey)
      .limit(5000);

    if (error) throw error;

    // Group by user_id
    const grouped = new Map<string, { saved: number; paid: number; currency: string; tier: string }>();
    for (const r of rows || []) {
      const cur = grouped.get(r.user_id as string) || { saved: 0, paid: 0, currency: (r.currency as string) || 'XOF', tier: (r.tier as string) || 'free' };
      cur.saved += Number(r.saved_amount_cents || 0);
      cur.paid += Number(r.paid_amount_cents || 0);
      cur.currency = (r.currency as string) || cur.currency;
      cur.tier = (r.tier as string) || cur.tier;
      grouped.set(r.user_id as string, cur);
    }

    for (const [userId, agg] of grouped) {
      try {
        // Idempotency check
        const { data: existing } = await db
          .from('platform_subscription_events')
          .select('id')
          .eq('user_id', userId)
          .eq('event_type', `monthly_recap_${monthKey}`)
          .maybeSingle();

        if (existing) {
          summary.skipped_duplicate++;
          continue;
        }

        const email = await getUserEmail(userId);
        if (!email) continue;

        // Lifetime savings
        const { data: lifetime } = await db
          .from('platform_commission_savings')
          .select('saved_amount_cents')
          .eq('user_id', userId);
        const lifetimeSaved = (lifetime || []).reduce((sum: number, r: any) => sum + Number(r.saved_amount_cents || 0), 0);

        const isPaid = agg.tier === 'pro' || agg.tier === 'org' || agg.tier === 'founder';
        const tierLabel = agg.tier === 'org' ? 'Org' : agg.tier === 'founder' ? 'Founder' : 'Pro';

        if (isPaid && agg.saved > 0) {
          await sendEmail({
            template: 'monthly_commission_recap_saved' as any,
            to: email,
            data: {
              month: monthLabel,
              saved_formatted: fmtMoney(agg.saved, agg.currency),
              lifetime_saved_formatted: fmtMoney(lifetimeSaved, agg.currency),
              tier_label: tierLabel,
            },
          });
          summary.recap_saved_sent++;
        } else if (!isPaid && agg.paid > 0) {
          await sendEmail({
            template: 'monthly_commission_recap_paid' as any,
            to: email,
            data: {
              month: monthLabel,
              paid_formatted: fmtMoney(agg.paid, agg.currency),
            },
          });
          summary.recap_paid_sent++;
        } else {
          continue;
        }

        await db.from('platform_subscription_events').insert({
          user_id: userId,
          event_type: `monthly_recap_${monthKey}`,
          payload: { month: monthKey, ...agg, lifetime_saved_cents: lifetimeSaved },
        });
      } catch (e: any) {
        console.error('[monthly-recap] user error', userId, e?.message);
        summary.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, month: monthKey, summary }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[monthly-commission-recap] fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'cron_failed', summary }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
