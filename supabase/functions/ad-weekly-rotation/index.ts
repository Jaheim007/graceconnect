import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Get current week number
    const now = new Date();
    const weekNum = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekKey = `${now.getFullYear()}-W${weekNum}`;

    // ── Select Star Products (best sellers + trending) ──
    const { data: stars } = await admin.from('digital_products')
      .select('id, title, price, currency, sales_count, featured_score, cover_image_url, organization_id')
      .eq('is_published', true).eq('is_express_demo', false).eq('is_free', false)
      .order('sales_count', { ascending: false })
      .limit(20);

    // ── Select Free Products ──
    const { data: gratuits } = await admin.from('digital_products')
      .select('id, title, sales_count, cover_image_url, organization_id')
      .eq('is_published', true).eq('is_express_demo', false).eq('is_free', true)
      .order('sales_count', { ascending: false })
      .limit(15);

    // ── Select Catalogue highlights (diverse types) ──
    const { data: catalogue } = await admin.from('digital_products')
      .select('id, title, product_type, cover_image_url, organization_id')
      .eq('is_published', true).eq('is_express_demo', false)
      .order('featured_score', { ascending: false })
      .limit(30);

    // Diversify: max 2 per org
    function diversify(items: any[], maxPerOrg = 2) {
      const orgCount: Record<string, number> = {};
      return items.filter(p => {
        const count = orgCount[p.organization_id] || 0;
        if (count >= maxPerOrg) return false;
        orgCount[p.organization_id] = count + 1;
        return true;
      });
    }

    const selection = {
      week: weekKey,
      generated_at: now.toISOString(),
      stars: diversify(stars || []).slice(0, 10).map(p => p.id),
      gratuits: diversify(gratuits || []).slice(0, 8).map(p => p.id),
      catalogue: diversify(catalogue || []).slice(0, 15).map(p => p.id),
      star_details: diversify(stars || []).slice(0, 10),
      gratuit_details: diversify(gratuits || []).slice(0, 8),
    };

    // Log as audit
    await admin.from('audit_logs').insert({
      action: 'ads.weekly_rotation',
      resource_type: 'ad_selection',
      metadata: {
        week: weekKey,
        stars_count: selection.stars.length,
        gratuits_count: selection.gratuits.length,
        catalogue_count: selection.catalogue.length,
      },
    });

    return new Response(JSON.stringify({ ok: true, selection }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('ad-weekly-rotation error:', e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
