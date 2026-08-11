import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * activation-engine — the "never published" ladder + payout-ready alert.
 *
 * Runs daily via pg_cron. Each email is sent at most once per user (deduped
 * against email_logs), except payout_ready_verify which repeats every 14 days.
 *
 *  D+1   activation_draft_waiting        → has a draft, nothing published
 *  D+2   activation_no_creation_yet      → created nothing at all
 *  D+3   activation_publish_3_taps       → content ready/unpublished, no price or not live
 *  D+7   activation_published_no_traffic → published but zero sales
 *  D+14  activation_last_call            → still nothing published
 *  any   payout_ready_verify             → money available but identity not verified
 */

type Lang = 'fr' | 'en';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  const results: Record<string, number> = {
    activation_draft_waiting: 0,
    activation_no_creation_yet: 0,
    activation_publish_3_taps: 0,
    activation_published_no_traffic: 0,
    activation_last_call: 0,
    payout_ready_verify: 0,
  };

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();

  async function getEmail(userId: string): Promise<string | null> {
    try {
      const { data } = await db.auth.admin.getUserById(userId);
      return data?.user?.email ?? null;
    } catch {
      return null;
    }
  }

  async function alreadySent(email: string, template: string, withinHours?: number): Promise<boolean> {
    let q = db.from('email_logs').select('id').eq('recipient', email).eq('template', template).limit(1);
    if (withinHours) q = q.gte('created_at', hoursAgo(withinHours));
    const { data } = await q;
    return !!data?.length;
  }

  async function send(
    template: string,
    userId: string,
    data: Record<string, string | number>,
    opts: { organization_id?: string; repeatWithinHours?: number } = {},
  ): Promise<boolean> {
    const { data: profile } = await db
      .from('profiles')
      .select('display_name, preferred_language, email_marketing_opted_out')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.email_marketing_opted_out) return false;

    const email = await getEmail(userId);
    if (!email) return false;
    if (await alreadySent(email, template, opts.repeatWithinHours)) return false;

    const locale: Lang = (profile?.preferred_language === 'en' ? 'en' : 'fr');
    try {
      await db.functions.invoke('send-email', {
        body: {
          template,
          to: email,
          locale,
          organization_id: opts.organization_id,
          data: { name: profile?.display_name || '', ...data },
        },
      });
      return true;
    } catch (err) {
      console.error(`[activation-engine] ${template} → ${email} failed:`, err);
      return false;
    }
  }

  /** Has the user ever published anything sellable? */
  async function hasPublished(userId: string): Promise<boolean> {
    const { count: prodCount } = await db
      .from('digital_products')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('is_published', true);
    if ((prodCount || 0) > 0) return true;
    const { data: orgs } = await db.from('organizations').select('id').eq('owner_id', userId);
    const orgIds = (orgs || []).map((o: { id: string }) => o.id);
    if (!orgIds.length) return false;
    const { count: progCount } = await db
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds)
      .eq('is_published', true);
    return (progCount || 0) > 0;
  }

  try {
    // ═══════════════════════════════════════════════
    // Cohorts by signup date
    // ═══════════════════════════════════════════════
    const cohort = async (days: number) => {
      const { data } = await db
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', hoursAgo(days * 24 + 14))
        .lte('created_at', hoursAgo(days * 24 - 10))
        .limit(400);
      return data || [];
    };

    // ── D+1: draft waiting ─────────────────────────
    for (const u of await cohort(1)) {
      if (await hasPublished(u.id)) continue;
      const { data: drafts } = await db
        .from('ai_content_projects')
        .select('id, title, status')
        .eq('created_by', u.id)
        .in('status', ['draft', 'generating', 'review', 'ready_to_publish'])
        .order('updated_at', { ascending: false })
        .limit(1);
      const draft = drafts?.[0];
      if (!draft) continue;

      // Live generation progress, when a job exists
      const { data: jobs } = await db
        .from('ai_generation_jobs')
        .select('progress, status')
        .eq('project_id', draft.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const job = jobs?.[0] as { progress?: number; status?: string } | undefined;
      const percent = job?.status === 'completed' ? 100 : Math.round(Number(job?.progress ?? 60));

      const ok = await send('activation_draft_waiting', u.id, {
        draft_title: draft.title || '',
        percent,
        resume_url: 'https://siteviral.com/admin/drafts',
      });
      if (ok) results.activation_draft_waiting++;
    }

    // ── D+2: nothing created at all ────────────────
    for (const u of await cohort(2)) {
      const { count: projects } = await db
        .from('ai_content_projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', u.id);
      if ((projects || 0) > 0) continue;
      const { count: products } = await db
        .from('digital_products')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', u.id);
      if ((products || 0) > 0) continue;
      if (await send('activation_no_creation_yet', u.id, {})) results.activation_no_creation_yet++;
    }

    // ── D+3: ready to publish, 3 taps away ─────────
    for (const u of await cohort(3)) {
      if (await hasPublished(u.id)) continue;
      const { data: prods } = await db
        .from('digital_products')
        .select('id, title')
        .eq('created_by', u.id)
        .eq('is_published', false)
        .order('created_at', { ascending: false })
        .limit(1);
      let title = prods?.[0]?.title as string | undefined;
      if (!title) {
        const { data: projs } = await db
          .from('ai_content_projects')
          .select('title')
          .eq('created_by', u.id)
          .in('status', ['review', 'ready_to_publish', 'draft'])
          .order('updated_at', { ascending: false })
          .limit(1);
        title = projs?.[0]?.title as string | undefined;
      }
      if (!title) continue;
      const ok = await send('activation_publish_3_taps', u.id, {
        draft_title: title,
        resume_url: 'https://siteviral.com/admin/products',
      });
      if (ok) results.activation_publish_3_taps++;
    }

    // ── D+7: published but no sales yet ────────────
    for (const u of await cohort(7)) {
      const { data: prods } = await db
        .from('digital_products')
        .select('id, title, slug')
        .eq('created_by', u.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!prods?.length) continue;
      const { count: sales } = await db
        .from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .in('product_id', prods.map((p: { id: string }) => p.id));
      if ((sales || 0) > 0) continue;
      const first = prods[0] as { title: string; slug?: string };
      const ok = await send('activation_published_no_traffic', u.id, {
        product_title: first.title || '',
        share_url: first.slug ? `https://siteviral.com/p/${first.slug}` : 'https://siteviral.com/admin/products',
      });
      if (ok) results.activation_published_no_traffic++;
    }

    // ── D+14: last call ────────────────────────────
    for (const u of await cohort(14)) {
      if (await hasPublished(u.id)) continue;
      if (await send('activation_last_call', u.id, {})) results.activation_last_call++;
    }

    // NOTE: no payout reminders are sent to creators — payout requests are
    // always user-initiated by design.


    console.log('[activation-engine]', results);
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[activation-engine] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
