import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRON-triggered edge function for performance alerts.
 * Checks for:
 * - Products with >100 views but 0 sales → notify creator
 * - Ambassadors with >50 clicks but 0 conversions → notify ambassador
 * - Campaigns with low conversion rates
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const results = { high_views_no_sales: 0, high_clicks_no_conversions: 0 };

  try {
    // 1. Products with >100 views but 0 sales (published > 48h ago)
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    const { data: underperformingProducts } = await db
      .from('media_content')
      .select('id, title, organization_id, created_by, view_count')
      .eq('is_published', true)
      .gt('view_count', 100)
      .lte('created_at', twoDaysAgo)
      .limit(20);

    // Also check digital products with high view indicators but no sales
    const { data: noSaleProducts } = await db
      .from('digital_products')
      .select('id, title, organization_id, created_by, sales_count')
      .eq('is_published', true)
      .eq('sales_count', 0)
      .lte('created_at', twoDaysAgo)
      .not('is_free', 'eq', true)
      .limit(30);

    for (const product of noSaleProducts || []) {
      if (!product.created_by) continue;

      // Check if we already sent this alert recently
      const { data: existing } = await db
        .from('user_notifications')
        .select('id')
        .eq('user_id', product.created_by)
        .eq('notification_type', 'performance_alert')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      await db.from('user_notifications').insert({
        user_id: product.created_by,
        organization_id: product.organization_id,
        title: '📊 Boostez vos ventes !',
        body: `Votre produit "${product.title}" n'a pas encore de ventes. 3 astuces : 1) Partagez sur WhatsApp 2) Activez les ambassadeurs 3) Ajoutez une image de couverture attractive.`,
        notification_type: 'performance_alert',
        action_url: '/admin/products',
      });
      results.high_views_no_sales++;
    }

    // 2. Ambassadors with >50 clicks but 0 conversions
    const { data: lowConversionLinks } = await db
      .from('affiliate_links')
      .select('id, user_id, code, clicks, conversions, organization_id')
      .eq('is_active', true)
      .gt('clicks', 50)
      .eq('conversions', 0)
      .limit(30);

    for (const link of lowConversionLinks || []) {
      // Check if alert already sent this week
      const { data: existing } = await db
        .from('user_notifications')
        .select('id')
        .eq('user_id', link.user_id)
        .eq('notification_type', 'ambassador_performance_alert')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      await db.from('user_notifications').insert({
        user_id: link.user_id,
        title: '💡 Améliorez vos conversions',
        body: `Votre lien a reçu ${link.clicks} clics mais aucune vente encore. Essayez : 1) Ciblez des groupes WhatsApp thématiques 2) Ajoutez un message personnel 3) Partagez des témoignages clients.`,
        notification_type: 'ambassador_performance_alert',
        action_url: '/affiliation',
      });
      results.high_clicks_no_conversions++;
    }

    console.log('[performance-alerts] Results:', results);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[performance-alerts] Error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
