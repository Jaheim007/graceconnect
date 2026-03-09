import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    // Gather weekly stats
    const [{ count: newUsers }, { count: newProducts }, { count: newOrgs }, { data: topProduct }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoStr),
      supabase.from('digital_products').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoStr).eq('is_published', true),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoStr),
      supabase.from('digital_products').select('id, title, sales_count, cover_image_url').eq('is_published', true).order('sales_count', { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Get total sales this week
    const { data: salesData } = await supabase
      .from('product_purchases')
      .select('amount')
      .gte('created_at', weekAgoStr)
      .eq('status', 'completed');

    const totalSalesAmount = (salesData || []).reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
    const salesCount = salesData?.length || 0;

    const weekLabel = `${weekAgo.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    const title = `Récap de la semaine : ${weekLabel}`;
    const body = `
<h2>📊 Cette semaine sur Siteviral</h2>
<ul>
  <li><strong>${newUsers || 0}</strong> nouveaux utilisateurs inscrits</li>
  <li><strong>${newOrgs || 0}</strong> nouvelles organisations créées</li>
  <li><strong>${newProducts || 0}</strong> produits publiés</li>
  <li><strong>${salesCount}</strong> ventes pour un total de <strong>${totalSalesAmount.toLocaleString('fr-FR')} FCFA</strong></li>
</ul>

${topProduct ? `
<h2>🏆 Produit le plus vendu</h2>
<p><strong>${topProduct.title}</strong> avec ${topProduct.sales_count || 0} ventes au total.</p>
` : ''}

<h2>💡 Astuce de la semaine</h2>
<p>Saviez-vous que les produits avec une couverture professionnelle se vendent 40% de plus ? Utilisez Canva ou notre Studio IA pour créer une couverture attrayante en quelques minutes.</p>
    `.trim();

    // Insert as draft blog article
    const { error: insertError } = await supabase.from('blog_articles').insert({
      title,
      slug: `recap-semaine-${now.toISOString().slice(0, 10)}`,
      content: body,
      excerpt: `${newUsers || 0} nouveaux utilisateurs, ${newProducts || 0} produits publiés, ${salesCount} ventes cette semaine.`,
      status: 'draft',
      category: 'recap',
      locale: 'fr',
    });

    // If blog_articles table doesn't exist, log but don't fail
    if (insertError) {
      console.warn('Could not insert blog draft (table may not exist):', insertError.message);
    }

    return new Response(JSON.stringify({
      ok: true,
      stats: { newUsers, newProducts, newOrgs, salesCount, totalSalesAmount },
      title,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('auto-blog-draft error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
