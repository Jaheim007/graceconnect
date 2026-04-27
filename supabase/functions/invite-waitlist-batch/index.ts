// Edge function: invite-waitlist-batch
// Admin-only. Sends Pro/Org activation invitations to N waitlist users.
// For each invited user: generate a -20% lifetime coupon, log the invitation,
// and trigger an email with their personal CTA link.
//
// Body: { tier: 'pro' | 'org', limit?: number, dry_run?: boolean }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  tier: 'pro' | 'org';
  limit?: number;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // ── Auth: must be authenticated and have admin role ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await db.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: Body = await req.json().catch(() => ({} as Body));
    const tier = body.tier;
    const limit = Math.min(Math.max(body.limit ?? 25, 1), 200);
    const dryRun = !!body.dry_run;

    if (tier !== 'pro' && tier !== 'org') {
      return new Response(JSON.stringify({ error: 'Invalid tier (pro|org)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Pull waitlist entries for this tier with a registered user_id ──
    const { data: waitlist, error: wlErr } = await db
      .from('platform_plan_waitlist')
      .select('id, user_id, email, locale, plan, created_at')
      .eq('plan', tier)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(limit * 3); // over-fetch — we filter dup invitations below

    if (wlErr) throw wlErr;

    // ── Skip already-invited users ──
    const userIds = (waitlist || []).map((w: any) => w.user_id);
    const { data: alreadyInvited } = await db
      .from('waitlist_invitations')
      .select('user_id')
      .eq('tier', tier)
      .in('user_id', userIds);
    const invitedSet = new Set((alreadyInvited || []).map((r: any) => r.user_id));

    const candidates = (waitlist || [])
      .filter((w: any) => !invitedSet.has(w.user_id))
      .slice(0, limit);

    if (dryRun) {
      return new Response(JSON.stringify({
        dry_run: true,
        would_invite: candidates.length,
        sample: candidates.slice(0, 5).map((c: any) => ({ email: c.email, locale: c.locale })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: Array<{ email: string; ok: boolean; coupon?: string; error?: string }> = [];

    for (const entry of candidates) {
      try {
        // Generate or retrieve coupon
        const { data: code, error: cErr } = await db.rpc('issue_waitlist_coupon', {
          _user_id: entry.user_id,
          _email: entry.email,
          _source: tier === 'pro' ? 'pro_waitlist' : 'org_waitlist',
          _discount_percent: 20,
        });
        if (cErr) throw cErr;

        // Log invitation
        await db.from('waitlist_invitations').insert({
          user_id: entry.user_id,
          email: entry.email,
          tier,
          coupon_code: code,
        });

        // Send email (best-effort, non-blocking error)
        if (RESEND_API_KEY) {
          const isFr = (entry.locale || 'fr').startsWith('fr');
          const ctaUrl = `https://siteviral.com/pricing?coupon=${encodeURIComponent(code)}&utm_source=waitlist_invite&utm_medium=email&utm_campaign=${tier}_activation`;
          const subject = isFr
            ? `🎉 Ton invitation SiteViral ${tier.toUpperCase()} — 20% à vie`
            : `🎉 Your SiteViral ${tier.toUpperCase()} invite — 20% forever`;
          const html = isFr ? `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a">
              <h1 style="margin:0 0 8px;font-size:22px">Ton accès ${tier.toUpperCase()} est prêt 🎉</h1>
              <p>Tu fais partie des premier·ères inscrit·es sur la waitlist. Voici ton avantage early-adopter :</p>
              <div style="background:#fff7ed;border:1px solid #fed7aa;padding:16px;border-radius:12px;margin:16px 0;text-align:center">
                <div style="font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:.05em">Code à vie</div>
                <div style="font-size:24px;font-weight:800;font-family:monospace;color:#9a3412">${code}</div>
                <div style="font-size:14px;color:#78350f;margin-top:4px">−20% sur ton abonnement, pour toujours.</div>
              </div>
              <p>Ton essai gratuit de 14 jours commence quand tu veux. Aucun débit avant la fin de l'essai.</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">
                  Activer ${tier.toUpperCase()} avec −20%
                </a>
              </p>
              <p style="color:#64748b;font-size:13px">Tu peux annuler à tout moment. Le code est lié à ton compte.</p>
            </div>` : `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a">
              <h1 style="margin:0 0 8px;font-size:22px">Your ${tier.toUpperCase()} access is ready 🎉</h1>
              <p>You're among the first to join the waitlist. Here's your early-adopter perk:</p>
              <div style="background:#fff7ed;border:1px solid #fed7aa;padding:16px;border-radius:12px;margin:16px 0;text-align:center">
                <div style="font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:.05em">Lifetime code</div>
                <div style="font-size:24px;font-weight:800;font-family:monospace;color:#9a3412">${code}</div>
                <div style="font-size:14px;color:#78350f;margin-top:4px">−20% on your subscription, forever.</div>
              </div>
              <p>Your 14-day free trial starts when you're ready. No charge before trial ends.</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">
                  Activate ${tier.toUpperCase()} with −20%
                </a>
              </p>
              <p style="color:#64748b;font-size:13px">Cancel anytime. The code is tied to your account.</p>
            </div>`;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SiteViral <hello@siteviral.com>',
              to: [entry.email],
              subject,
              html,
            }),
          }).catch(() => null);
        }

        results.push({ email: entry.email, ok: true, coupon: code });
      } catch (err: any) {
        results.push({ email: entry.email, ok: false, error: err?.message || 'unknown' });
      }
    }

    return new Response(JSON.stringify({
      tier,
      total_candidates: candidates.length,
      sent: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[invite-waitlist-batch] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
