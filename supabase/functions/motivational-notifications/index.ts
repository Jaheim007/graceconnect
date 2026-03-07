import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRON-triggered Edge Function: motivational in-app notifications.
 * Runs daily to send encouragement, social proof and nudges.
 * 
 * Categories:
 * 1. Product views milestone (10, 50, 100, 500, 1000 views)
 * 2. New sale celebration
 * 3. Ambassador click milestones
 * 4. Weekly top ambassador ranking
 * 5. Trending product suggestions for ambassadors
 * 6. First sale celebration
 * 7. Streak encouragement
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const results: Record<string, number> = {};
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();

  try {
    // ═══════════════════════════════════════════
    // 1. PRODUCT VIEW MILESTONES
    // ═══════════════════════════════════════════
    let viewMilestones = 0;
    const milestoneThresholds = [10, 50, 100, 500, 1000, 5000];
    const { data: products } = await db.from('digital_products')
      .select('id, title, organization_id, created_by, sales_count')
      .eq('is_published', true)
      .limit(200);

    for (const prod of products || []) {
      if (!prod.created_by || !prod.sales_count) continue;
      const salesCount = prod.sales_count || 0;
      // Check if sales count just crossed a milestone (within last day's sales)
      for (const threshold of milestoneThresholds) {
        if (salesCount >= threshold && salesCount < threshold + 5) {
          // Anti-spam: check if already notified for this milestone
          const { count } = await db.from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', prod.created_by)
            .like('title', `%${threshold}%vente%`)
            .gte('created_at', new Date(now.getTime() - 7 * 86400000).toISOString());
          if ((count || 0) === 0) {
            await db.from('user_notifications').insert({
              user_id: prod.created_by,
              organization_id: prod.organization_id,
              title: `🎉 ${threshold} ventes atteintes !`,
              body: `Ton produit « ${prod.title} » a dépassé ${threshold} ventes. Continue comme ça ! 🚀`,
              notification_type: 'milestone',
              action_url: `/admin`,
            });
            viewMilestones++;
          }
          break;
        }
      }
    }
    results['view_milestones'] = viewMilestones;

    // ═══════════════════════════════════════════
    // 2. RECENT SALES CELEBRATION (last 24h)
    // ═══════════════════════════════════════════
    let saleCelebrations = 0;
    const { data: recentSales } = await db.from('product_purchases')
      .select('id, amount, currency, organization_id, product_id, digital_products(title, created_by), organizations(name)')
      .eq('status', 'completed')
      .gte('completed_at', oneDayAgo)
      .limit(100);

    // Group by creator to avoid spam
    const creatorSales = new Map<string, { count: number; total: number; currency: string; titles: string[] }>();
    for (const sale of recentSales || []) {
      const product = (sale as any).digital_products;
      if (!product?.created_by) continue;
      const existing = creatorSales.get(product.created_by) || { count: 0, total: 0, currency: sale.currency || 'XOF', titles: [] };
      existing.count++;
      existing.total += sale.amount || 0;
      if (!existing.titles.includes(product.title)) existing.titles.push(product.title);
      creatorSales.set(product.created_by, existing);
    }

    for (const [userId, data] of creatorSales) {
      // Only notify if not already notified today
      const { count: existing } = await db.from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('notification_type', 'sale_celebration')
        .gte('created_at', oneDayAgo);
      if ((existing || 0) === 0) {
        const titleList = data.titles.slice(0, 2).join(', ');
        await db.from('user_notifications').insert({
          user_id: userId,
          title: data.count === 1
            ? `💰 Nouvelle vente !`
            : `💰 ${data.count} ventes aujourd'hui !`,
          body: data.count === 1
            ? `Quelqu'un vient d'acheter « ${titleList} ». Tu as gagné ${data.total.toLocaleString('fr-FR')} ${data.currency} !`
            : `${data.count} personnes ont acheté tes produits. Total : ${data.total.toLocaleString('fr-FR')} ${data.currency} 🔥`,
          notification_type: 'sale_celebration',
          action_url: '/admin',
        });
        saleCelebrations++;
      }
    }
    results['sale_celebrations'] = saleCelebrations;

    // ═══════════════════════════════════════════
    // 3. AMBASSADOR CLICK MILESTONES
    // ═══════════════════════════════════════════
    let clickMilestones = 0;
    const clickThresholds = [10, 50, 100, 500, 1000];
    const { data: affiliateLinks } = await db.from('affiliate_links')
      .select('id, user_id, clicks, code, total_earned')
      .gt('clicks', 9)
      .limit(200);

    for (const link of affiliateLinks || []) {
      const clicks = link.clicks || 0;
      for (const threshold of clickThresholds) {
        if (clicks >= threshold && clicks < threshold + 10) {
          const { count } = await db.from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', link.user_id)
            .like('body', `%${threshold} clics%`)
            .gte('created_at', new Date(now.getTime() - 14 * 86400000).toISOString());
          if ((count || 0) === 0) {
            await db.from('user_notifications').insert({
              user_id: link.user_id,
              title: `📈 ${threshold} clics sur ton lien !`,
              body: `Ton lien ambassadeur a atteint ${threshold} clics. Continue de partager pour convertir ces clics en ventes ! 💪`,
              notification_type: 'milestone',
              action_url: '/gagner',
            });
            clickMilestones++;
          }
          break;
        }
      }
    }
    results['click_milestones'] = clickMilestones;

    // ═══════════════════════════════════════════
    // 4. WEEKLY TOP AMBASSADOR (Monday only)
    // ═══════════════════════════════════════════
    let topAmbassadorNotifs = 0;
    if (now.getDay() === 1) { // Monday
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const { data: topAmbassadors } = await db.from('affiliate_sales')
        .select('affiliate_user_id, commission_amount')
        .gte('created_at', weekAgo)
        .order('commission_amount', { ascending: false })
        .limit(10);

      const seen = new Set<string>();
      let rank = 0;
      for (const sale of topAmbassadors || []) {
        if (seen.has(sale.affiliate_user_id)) continue;
        seen.add(sale.affiliate_user_id);
        rank++;
        if (rank <= 5) {
          await db.from('user_notifications').insert({
            user_id: sale.affiliate_user_id,
            title: `🏆 Top ${rank} ambassadeur cette semaine !`,
            body: `Bravo ! Tu fais partie des ${rank <= 3 ? 'meilleurs' : 'top 5'} ambassadeurs de la semaine. Continue ! 🔥`,
            notification_type: 'ranking',
            action_url: '/gagner',
          });
          topAmbassadorNotifs++;
        }
      }
    }
    results['top_ambassadors'] = topAmbassadorNotifs;

    // ═══════════════════════════════════════════
    // 5. TRENDING PRODUCT SUGGESTIONS (for active ambassadors)
    // ═══════════════════════════════════════════
    let trendingNotifs = 0;
    // Find trending products (most sales in last 7 days)
    if (now.getDay() === 3) { // Wednesday — mid-week boost
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const { data: trendingProducts } = await db.from('product_purchases')
        .select('product_id, digital_products(title, price, currency)')
        .eq('status', 'completed')
        .gte('completed_at', weekAgo)
        .limit(50);

      // Count sales per product
      const productSales = new Map<string, { title: string; count: number; price: number; currency: string }>();
      for (const p of trendingProducts || []) {
        const prod = (p as any).digital_products;
        if (!prod || !p.product_id) continue;
        const existing = productSales.get(p.product_id) || { title: prod.title, count: 0, price: prod.price || 0, currency: prod.currency || 'XOF' };
        existing.count++;
        productSales.set(p.product_id, existing);
      }

      // Get top 3 trending
      const trending = [...productSales.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3);

      if (trending.length > 0) {
        // Notify active ambassadors who don't have links to these products
        const { data: activeAmbassadors } = await db.from('affiliate_links')
          .select('user_id')
          .gt('clicks', 0)
          .limit(50);

        const uniqueAmbassadors = [...new Set((activeAmbassadors || []).map(a => a.user_id))].slice(0, 20);
        const topProduct = trending[0][1];

        for (const userId of uniqueAmbassadors) {
          const { count: existing } = await db.from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('notification_type', 'trending_suggestion')
            .gte('created_at', new Date(now.getTime() - 7 * 86400000).toISOString());
          if ((existing || 0) === 0) {
            await db.from('user_notifications').insert({
              user_id: userId,
              title: `🔥 Produit tendance à partager !`,
              body: `« ${topProduct.title} » se vend très bien cette semaine (${topProduct.count} ventes). Partage-le pour gagner ! 💰`,
              notification_type: 'trending_suggestion',
              action_url: '/gagner',
            });
            trendingNotifs++;
          }
        }
      }
    }
    results['trending_suggestions'] = trendingNotifs;

    // ═══════════════════════════════════════════
    // 6. FIRST SALE CELEBRATION
    // ═══════════════════════════════════════════
    let firstSaleCount = 0;
    const { data: firstSaleProducts } = await db.from('digital_products')
      .select('id, title, created_by, organization_id, sales_count')
      .eq('sales_count', 1)
      .eq('is_published', true)
      .limit(50);

    for (const prod of firstSaleProducts || []) {
      if (!prod.created_by) continue;
      // Check purchase happened in last 24h
      const { count: recentPurchase } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', prod.id)
        .eq('status', 'completed')
        .gte('completed_at', oneDayAgo);
      if ((recentPurchase || 0) > 0) {
        const { count: alreadyNotified } = await db.from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', prod.created_by)
          .like('title', '%Première vente%');
        if ((alreadyNotified || 0) === 0) {
          await db.from('user_notifications').insert({
            user_id: prod.created_by,
            organization_id: prod.organization_id,
            title: `🎉 Première vente de « ${prod.title} » !`,
            body: `Félicitations ! Ton premier lecteur vient d'acheter ton livre. Active le programme ambassadeur pour multiplier tes ventes par 10x ! 🚀`,
            notification_type: 'first_sale',
            action_url: '/admin',
          });
          firstSaleCount++;
        }
      }
    }
    results['first_sale'] = firstSaleCount;

    // ═══════════════════════════════════════════
    // 7. INACTIVE CREATOR NUDGE (7 days no login)
    // ═══════════════════════════════════════════
    let inactiveNudges = 0;
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const { data: inactiveOwners } = await db.from('organizations')
      .select('owner_id, name')
      .eq('is_active', true)
      .limit(100);

    for (const org of inactiveOwners || []) {
      if (!org.owner_id) continue;
      // Check if user has recent notifications (proxy for activity)
      const { count: recentActivity } = await db.from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', org.owner_id)
        .gte('created_at', sevenDaysAgo);
      if ((recentActivity || 0) > 0) continue;

      // Don't spam: check if already nudged in last 14 days
      const { count: alreadyNudged } = await db.from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', org.owner_id)
        .eq('notification_type', 'inactive_nudge')
        .gte('created_at', fourteenDaysAgo);
      if ((alreadyNudged || 0) > 0) continue;

      const messages = [
        { title: '👋 Tu nous manques !', body: `Ton organisation « ${org.name} » t'attend. Publie un nouveau contenu pour booster ta visibilité ! 🚀` },
        { title: '💡 Astuce du jour', body: `Les organisations actives vendent 3x plus. Ajoute un nouveau produit à « ${org.name} » cette semaine ! 📈` },
        { title: '🎯 Tes fans attendent', body: `Tes membres et abonnés de « ${org.name} » n'ont rien reçu depuis un moment. Surprends-les avec du nouveau contenu !` },
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];

      await db.from('user_notifications').insert({
        user_id: org.owner_id,
        title: msg.title,
        body: msg.body,
        notification_type: 'inactive_nudge',
        action_url: '/admin',
      });
      inactiveNudges++;
    }
    results['inactive_nudges'] = inactiveNudges;

    // ═══════════════════════════════════════════
    // 8. PROGRAM PROGRESS ENCOURAGEMENT
    // ═══════════════════════════════════════════
    let progressNudges = 0;
    const { data: enrollments } = await db.from('program_enrollments')
      .select('id, user_id, program_id, programs(title)')
      .limit(200);

    for (const enrollment of enrollments || []) {
      const programTitle = (enrollment as any).programs?.title;
      if (!programTitle) continue;

      // Get modules for this program
      const { data: modules } = await db.from('program_modules')
        .select('id')
        .eq('program_id', enrollment.program_id);
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (moduleIds.length === 0) continue;

      // Get total lessons and completed lessons for THIS program only
      const { count: totalLessons } = await db.from('program_lessons')
        .select('*', { count: 'exact', head: true })
        .in('module_id', moduleIds);

      if (!totalLessons || totalLessons === 0) continue;

      // Get lesson IDs for this program
      const { data: lessonRows } = await db.from('program_lessons')
        .select('id')
        .in('module_id', moduleIds);
      const lessonIds = (lessonRows || []).map((l: any) => l.id);

      const { count: completedLessons } = await db.from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', enrollment.user_id)
        .eq('completed', true)
        .in('lesson_id', lessonIds);

      const pct = Math.round(((completedLessons || 0) / totalLessons) * 100);

      // Nudge at 50% and 75%
      if (pct >= 50 && pct < 100) {
        const milestoneLabel = pct >= 75 ? '75%' : '50%';
        const { count: alreadyNotified } = await db.from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', enrollment.user_id)
          .like('body', `%${milestoneLabel}%${programTitle}%`)
          .gte('created_at', fourteenDaysAgo);
        if ((alreadyNotified || 0) === 0) {
          await db.from('user_notifications').insert({
            user_id: enrollment.user_id,
            title: pct >= 75 ? `🏁 Presque terminé !` : `📚 Tu es à mi-chemin !`,
            body: pct >= 75
              ? `Tu es à ${milestoneLabel} de « ${programTitle} ». Plus que quelques leçons pour obtenir ton certificat ! 🎓`
              : `Tu as complété ${milestoneLabel} de « ${programTitle} ». Continue, le certificat t'attend ! 💪`,
            notification_type: 'progress_nudge',
            action_url: `/program/${enrollment.program_id}`,
          });
          progressNudges++;
        }
      }
    }
    results['progress_nudges'] = progressNudges;

    return new Response(JSON.stringify({ ok: true, results, timestamp: now.toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[motivational-notifications] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
