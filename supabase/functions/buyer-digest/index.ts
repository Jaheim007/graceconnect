// buyer-digest: CRON-triggered buyer-side engagement.
// 1. Weekly "new this week" broadcast to buyers (products published in the last 7 days).
// 2. Second-purchase sequence for buyers with exactly one completed purchase, 7-9 days old.
// Respects profiles.email_marketing_opted_out and profiles.preferred_language.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE = 'https://siteviral.com';

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const results: Record<string, number> = { weekly_sent: 0, second_purchase_sent: 0 };

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dry_run;
    const only = String(body.only || 'all'); // all | weekly | second_purchase

    const now = Date.now();
    const weekAgo = new Date(now - 7 * 86400000).toISOString();

    // ── 1. Weekly "new this week" ─────────────────────────────
    if (only === 'all' || only === 'weekly') {
      const { data: fresh } = await db
        .from('digital_products')
        .select('id, title, slug, price, currency, is_free, cover_image_url, created_at, organization_id, organizations!inner(name, slug, is_internal)')
        .eq('is_published', true)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(12);

      const items = (fresh || []).filter((p: any) => !p.organizations?.is_internal);

      if (items.length > 0) {
        const itemsHtml = items
          .slice(0, 6)
          .map((p: any) => {
            const url = `${SITE}/${p.organizations?.slug}/p/${p.slug || p.id}`;
            const price = p.is_free ? 'Gratuit / Free' : `${p.price ?? 0} ${p.currency ?? ''}`;
            return `<div style="border:1px solid #333;border-radius:12px;padding:12px;margin:10px 0">
              <a href="${url}" style="color:#1a66e6;font-weight:bold;text-decoration:none">${esc(String(p.title || ''))}</a>
              <p style="margin:4px 0 0;font-size:12px;color:#999">${esc(String(p.organizations?.name || ''))} · ${price}</p>
            </div>`;
          })
          .join('');

        // Buyers: everyone who has completed at least one purchase, not opted out
        const { data: buyers } = await db
          .from('product_purchases')
          .select('user_id')
          .eq('status', 'completed')
          .not('user_id', 'is', null)
          .gte('created_at', new Date(now - 365 * 86400000).toISOString())
          .limit(5000);

        const buyerIds = [...new Set((buyers || []).map((b: any) => b.user_id))];

        if (buyerIds.length > 0) {
          const { data: profiles } = await db
            .from('profiles')
            .select('id, display_name, preferred_language, email_marketing_opted_out')
            .in('id', buyerIds);

          for (const p of profiles || []) {
            if (p.email_marketing_opted_out) continue;
            if (dryRun) { results.weekly_sent++; continue; }
            const email = await getUserEmail(p.id);
            if (!email) continue;
            await sendEmail({
              template: 'buyer_weekly_new',
              to: email,
              data: {
                name: p.display_name || '',
                count: items.length,
                items_html: itemsHtml,
                page_url: `${SITE}/new-this-week`,
              },
              locale: (p.preferred_language === 'en' ? 'en' : 'fr'),
            } as any);
            results.weekly_sent++;
          }
        }
      }
    }

    // ── 2. Second-purchase sequence ───────────────────────────
    if (only === 'all' || only === 'second_purchase') {
      const from = new Date(now - 9 * 86400000).toISOString();
      const to = new Date(now - 7 * 86400000).toISOString();

      const { data: recent } = await db
        .from('product_purchases')
        .select('user_id, product_id, created_at, digital_products(title)')
        .eq('status', 'completed')
        .gte('created_at', from)
        .lte('created_at', to)
        .not('user_id', 'is', null)
        .limit(1000);

      const seen = new Set<string>();
      for (const r of recent || []) {
        const uid = (r as any).user_id as string;
        if (seen.has(uid)) continue;
        seen.add(uid);

        const { count } = await db
          .from('product_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('status', 'completed');
        if ((count ?? 0) !== 1) continue;

        const { data: prof } = await db
          .from('profiles')
          .select('display_name, preferred_language, email_marketing_opted_out')
          .eq('id', uid)
          .maybeSingle();
        if (prof?.email_marketing_opted_out) continue;

        if (dryRun) { results.second_purchase_sent++; continue; }
        const email = await getUserEmail(uid);
        if (!email) continue;

        await sendEmail({
          template: 'buyer_second_purchase',
          to: email,
          data: {
            name: prof?.display_name || '',
            first_title: (r as any).digital_products?.title || '',
            page_url: `${SITE}/new-this-week`,
          },
          locale: (prof?.preferred_language === 'en' ? 'en' : 'fr'),
        } as any);
        results.second_purchase_sent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, dry_run: dryRun, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('buyer-digest error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Internal error', ...results }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
