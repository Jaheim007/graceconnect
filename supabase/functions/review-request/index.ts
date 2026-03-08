import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRON-triggered: sends "leave a review" email 3 days after purchase.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const now = new Date();
  // Target: purchases completed ~3 days ago (±4h window)
  const targetTime = new Date(now.getTime() - 3 * 86400000);
  const rangeStart = new Date(targetTime.getTime() - 4 * 3600000).toISOString();
  const rangeEnd = new Date(targetTime.getTime() + 4 * 3600000).toISOString();

  let sent = 0;

  try {
    const { data: purchases } = await db.from('product_purchases')
      .select('id, buyer_email, buyer_name, product_id, organization_id, digital_products(title, slug), organizations(name, slug)')
      .eq('status', 'completed')
      .gte('created_at', rangeStart)
      .lte('created_at', rangeEnd)
      .limit(50);

    for (const p of purchases || []) {
      if (!p.buyer_email) continue;

      // Check if already sent
      const { count } = await db.from('review_request_sent')
        .select('*', { count: 'exact', head: true })
        .eq('purchase_id', p.id);
      if ((count || 0) > 0) continue;

      const product = (p as any).digital_products;
      const org = (p as any).organizations;
      if (!product || !org) continue;

      const productUrl = `https://siteviral.com/org/${org.slug}/product/${p.product_id}`;

      try {
        await sendEmail({
          template: 'review_request' as any,
          to: p.buyer_email,
          data: {
            buyer_name: p.buyer_name || '',
            product_title: product.title || 'Produit',
            product_url: productUrl,
            org_name: org.name || '',
          },
          organization_id: p.organization_id,
        });

        await db.from('review_request_sent').insert({ purchase_id: p.id });
        sent++;
      } catch (err) {
        console.error(`[review-request] Failed for purchase ${p.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[review-request]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
