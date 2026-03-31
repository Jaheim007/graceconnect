import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SegmentedUser {
  userId: string;
  email: string;
  name: string;
  segment: 'ghost' | 'no_product' | 'no_sales' | 'ambassador';
  orgName?: string;
  productName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const targetSegment = body.segment || 'all';
    const isCron = body.time !== undefined; // pg_cron sends { time: "..." }

    // ═══ Auth: superadmin OR cron ═══
    if (!isCron) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const { data: roleCheck } = await supabase
        .from('user_platform_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .maybeSingle();
      if (!roleCheck) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
      }
    }

    // ═══ Step 1: Get ALL auth users ═══
    const allUsers: Array<{ id: string; email: string }> = [];
    let page = 1;
    while (true) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
      if (error || !users?.length) break;
      for (const u of users) {
        if (u.email) allUsers.push({ id: u.id, email: u.email });
      }
      if (users.length < 500) break;
      page++;
    }

    // ═══ Step 2: Get recent email_logs to avoid re-sending (7-day cooldown) ═══
    const cooldownDays = 7;
    const cooldownDate = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();
    const reactivationTemplates = [
      'reactivation_ghost', 'reactivation_no_product',
      'reactivation_no_sales', 'reactivation_ambassador',
    ];
    const { data: recentEmails } = await supabase
      .from('email_logs')
      .select('recipient, template')
      .in('template', reactivationTemplates)
      .eq('status', 'sent')
      .gte('created_at', cooldownDate)
      .limit(5000);
    const alreadySent = new Set(
      (recentEmails || []).map((e: any) => `${e.recipient}::${e.template}`)
    );

    // ═══ Step 3: Get recent reactivation notifications (7-day cooldown) ═══
    const { data: recentNotifs } = await supabase
      .from('user_notifications')
      .select('user_id')
      .eq('notification_type', 'reactivation')
      .gte('created_at', cooldownDate)
      .limit(5000);
    const notifAlreadySent = new Set((recentNotifs || []).map((n: any) => n.user_id));

    // ═══ Step 4: Get org memberships ═══
    const { data: allMembers } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .limit(5000);
    const userOrgMap: Record<string, Array<{ orgId: string; role: string }>> = {};
    for (const m of (allMembers || [])) {
      if (!userOrgMap[m.user_id]) userOrgMap[m.user_id] = [];
      userOrgMap[m.user_id].push({ orgId: m.organization_id, role: m.role });
    }

    // ═══ Step 5: Get org names ═══
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(500);
    const orgNameMap: Record<string, string> = {};
    for (const o of (allOrgs || [])) orgNameMap[o.id] = o.name;

    // ═══ Step 6: Get published products per org ═══
    const { data: allProducts } = await supabase
      .from('digital_products')
      .select('id, organization_id, title, is_published')
      .limit(5000);
    const orgPublishedMap: Record<string, string[]> = {};
    const orgProductTitles: Record<string, string> = {};
    for (const p of (allProducts || [])) {
      if (p.is_published) {
        if (!orgPublishedMap[p.organization_id]) orgPublishedMap[p.organization_id] = [];
        orgPublishedMap[p.organization_id].push(p.id);
        if (!orgProductTitles[p.organization_id]) orgProductTitles[p.organization_id] = p.title;
      }
    }

    // ═══ Step 7: Get orgs with sales ═══
    const { data: allPurchases } = await supabase
      .from('product_purchases')
      .select('organization_id')
      .eq('status', 'completed')
      .limit(5000);
    const orgsWithSales = new Set((allPurchases || []).map(p => p.organization_id));

    // ═══ Step 8: Get affiliate links ═══
    const { data: allAffLinks } = await supabase
      .from('affiliate_links')
      .select('user_id, clicks')
      .limit(5000);
    const usersWithInactiveLinks = new Set<string>();
    const usersWithActiveLinks = new Set<string>();
    for (const l of (allAffLinks || [])) {
      if ((l.clicks || 0) > 0) {
        usersWithActiveLinks.add(l.user_id);
      } else {
        usersWithInactiveLinks.add(l.user_id);
      }
    }

    // ═══ Step 9: Get profiles for display names ═══
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(5000);
    const nameMap: Record<string, string> = {};
    for (const p of (profiles || [])) {
      if (p.display_name) nameMap[p.id] = p.display_name;
    }

    // ═══ Step 10: Segment users ═══
    const templateMap: Record<string, string> = {
      ghost: 'reactivation_ghost',
      no_product: 'reactivation_no_product',
      no_sales: 'reactivation_no_sales',
      ambassador: 'reactivation_ambassador',
    };

    const segmented: SegmentedUser[] = [];

    for (const user of allUsers) {
      const orgs = userOrgMap[user.id];
      const name = nameMap[user.id] || user.email.split('@')[0];

      let segment: SegmentedUser['segment'] | null = null;
      let orgName = '';
      let productName = '';

      // Ghost: no org at all
      if (!orgs || orgs.length === 0) {
        segment = 'ghost';
      } else {
        const ownerOrgs = orgs.filter(o => o.role === 'owner');
        if (ownerOrgs.length === 0) {
          // Member but not owner — check ambassador
          if (usersWithInactiveLinks.has(user.id) && !usersWithActiveLinks.has(user.id)) {
            segment = 'ambassador';
          }
        } else {
          let hasPublished = false;
          let hasSales = false;
          for (const org of ownerOrgs) {
            if (!orgName) orgName = orgNameMap[org.orgId] || '';
            const published = orgPublishedMap[org.orgId];
            if (published && published.length > 0) {
              hasPublished = true;
              if (!productName) productName = orgProductTitles[org.orgId] || '';
              if (orgsWithSales.has(org.orgId)) hasSales = true;
            }
          }

          if (!hasPublished) {
            segment = 'no_product';
          } else if (!hasSales) {
            segment = 'no_sales';
          } else if (usersWithInactiveLinks.has(user.id) && !usersWithActiveLinks.has(user.id)) {
            segment = 'ambassador';
          }
        }
      }

      if (!segment) continue;
      if (targetSegment !== 'all' && targetSegment !== segment) continue;

      // ═══ Deduplication: skip if already sent in last 7 days ═══
      const emailKey = `${user.email}::${templateMap[segment]}`;
      if (alreadySent.has(emailKey)) continue;
      if (notifAlreadySent.has(user.id)) continue;

      segmented.push({ userId: user.id, email: user.email, name, segment, orgName, productName });
    }

    // ═══ DRY RUN ═══
    if (dryRun) {
      const summary = {
        ghost: segmented.filter(s => s.segment === 'ghost').length,
        no_product: segmented.filter(s => s.segment === 'no_product').length,
        no_sales: segmented.filter(s => s.segment === 'no_sales').length,
        ambassador: segmented.filter(s => s.segment === 'ambassador').length,
        total: segmented.length,
      };
      return new Response(JSON.stringify({ dry_run: true, summary, users: segmented }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ Step 11: Send emails + create notifications ═══
    const notifMap: Record<string, { title: string; body: string; actionUrl: string }> = {
      ghost: {
        title: '🎨 Créez votre premier produit !',
        body: 'Votre studio IA vous attend. Créez un ebook ou une formation en 3 minutes avec le Viral AI Studio.',
        actionUrl: '/welcome',
      },
      no_product: {
        title: '📦 Publiez votre 1er produit !',
        body: 'Votre espace est prêt mais vide. Utilisez le Viral AI Studio pour publier votre premier contenu.',
        actionUrl: '/admin/create',
      },
      no_sales: {
        title: '🔥 Partagez pour vendre !',
        body: 'Votre produit est publié mais attend ses premiers acheteurs. Partagez-le sur WhatsApp en 1 clic.',
        actionUrl: '/admin/share',
      },
      ambassador: {
        title: '💸 Vos liens dorment !',
        body: 'Vous avez des liens ambassadeur mais 0 clic. Partagez-les sur WhatsApp pour gagner des commissions.',
        actionUrl: '/admin/share',
      },
    };

    let emailsSent = 0;
    let emailsFailed = 0;
    let notificationsCreated = 0;

    const BATCH = 10;
    for (let i = 0; i < segmented.length; i += BATCH) {
      const batch = segmented.slice(i, i + BATCH);

      const emailPromises = batch.map(async (u) => {
        try {
          const res = await supabase.functions.invoke('send-email', {
            body: {
              template: templateMap[u.segment],
              to: u.email,
              data: {
                name: u.name,
                org_name: u.orgName || '',
                product_name: u.productName || '',
              },
            },
          });
          if (res.error) emailsFailed++;
          else emailsSent++;
        } catch {
          emailsFailed++;
        }
      });

      const notifInserts = batch
        .filter(u => !notifAlreadySent.has(u.userId))
        .map((u) => ({
          user_id: u.userId,
          title: notifMap[u.segment].title,
          body: notifMap[u.segment].body,
          notification_type: 'reactivation',
          action_url: notifMap[u.segment].actionUrl,
        }));

      await Promise.all(emailPromises);

      if (notifInserts.length > 0) {
        const { error: notifErr } = await supabase
          .from('user_notifications')
          .insert(notifInserts);
        if (!notifErr) notificationsCreated += notifInserts.length;
      }

      if (i + BATCH < segmented.length) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    // ═══ Audit log ═══
    await supabase.from('audit_logs').insert({
      action: 'reactivation_campaign_auto',
      metadata: {
        segments: {
          ghost: segmented.filter(s => s.segment === 'ghost').length,
          no_product: segmented.filter(s => s.segment === 'no_product').length,
          no_sales: segmented.filter(s => s.segment === 'no_sales').length,
          ambassador: segmented.filter(s => s.segment === 'ambassador').length,
        },
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        notifications_created: notificationsCreated,
        target_segment: targetSegment,
        is_cron: isCron,
        cooldown_days: cooldownDays,
        skipped_dedup: allUsers.length - segmented.length,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      summary: {
        total_users: segmented.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        notifications_created: notificationsCreated,
        segments: {
          ghost: segmented.filter(s => s.segment === 'ghost').length,
          no_product: segmented.filter(s => s.segment === 'no_product').length,
          no_sales: segmented.filter(s => s.segment === 'no_sales').length,
          ambassador: segmented.filter(s => s.segment === 'ambassador').length,
        },
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('reactivation-campaign error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
