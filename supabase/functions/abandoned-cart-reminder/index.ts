import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRON-triggered edge function for abandoned cart recovery.
 * Sends up to 3 reminder emails at 1h, 24h, and 72h after cart opened.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const now = new Date();
  const results = { reminder_1h: 0, reminder_24h: 0, reminder_72h: 0 };

  try {
    // Define reminder windows: [reminderIndex, hoursAgo, windowMinutes, templateSuffix]
    const windows: [number, number, number, string][] = [
      [0, 1, 30, '1h'],    // 1st reminder: 1h after open (±15min window)
      [1, 24, 120, '24h'],  // 2nd reminder: 24h after open (±1h window)
      [2, 72, 240, '72h'],  // 3rd reminder: 72h after open (±2h window)
    ];

    for (const [reminderIndex, hoursAgo, windowMinutes, suffix] of windows) {
      const targetTime = new Date(now.getTime() - hoursAgo * 3600000);
      const rangeStart = new Date(targetTime.getTime() - (windowMinutes / 2) * 60000).toISOString();
      const rangeEnd = new Date(targetTime.getTime() + (windowMinutes / 2) * 60000).toISOString();

      // Find unconverted carts in this time window that haven't received this reminder yet
      const { data: carts } = await db
        .from('abandoned_carts')
        .select('id, email, buyer_name, product_id, organization_id, opened_at, reminder_sent_count, digital_products(title, price, currency, cover_image_url, slug), organizations(name, slug)')
        .eq('converted', false)
        .eq('reminder_sent_count', reminderIndex)
        .gte('opened_at', rangeStart)
        .lte('opened_at', rangeEnd)
        .limit(50);

      for (const cart of carts || []) {
        if (!cart.email) continue;

        const product = (cart as any).digital_products;
        const org = (cart as any).organizations;
        if (!product || !org) continue;

        const productUrl = `https://siteviral.com/org/${org.slug}/product/${cart.product_id}`;

        try {
          await sendEmail({
            template: `abandoned_cart_${suffix}` as any,
            to: cart.email,
            data: {
              buyer_name: cart.buyer_name || '',
              product_title: product.title || 'Produit',
              product_price: product.price || 0,
              currency: product.currency || 'XOF',
              product_url: productUrl,
              org_name: org.name || '',
              cover_image_url: product.cover_image_url || '',
              hours_ago: hoursAgo,
            },
            organization_id: cart.organization_id,
          });

          // Update reminder count and timestamp
          await db.from('abandoned_carts').update({
            reminder_sent_count: reminderIndex + 1,
            last_reminder_at: now.toISOString(),
          }).eq('id', cart.id);

          (results as any)[`reminder_${suffix}`]++;
        } catch (err) {
          console.error(`[abandoned-cart-reminder] Failed for cart ${cart.id}:`, err);
        }
      }
    }

    // Cleanup: mark very old carts (>30 days) as expired
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    await db.from('abandoned_carts')
      .delete()
      .eq('converted', false)
      .lte('opened_at', thirtyDaysAgo);

    console.log('[abandoned-cart-reminder] Results:', results);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[abandoned-cart-reminder] Fatal error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
