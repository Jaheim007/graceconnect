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

    // Verify caller is superadmin
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
      return new Response(JSON.stringify({ error: 'Forbidden - superadmin only' }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const targetSegment = body.segment || 'all'; // 'ghost', 'no_product', 'no_sales', 'ambassador', 'all'

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

    // ═══ Step 2: Get org memberships ═══
    const { data: allMembers } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .limit(5000);
    const userOrgMap: Record<string, Array<{ orgId: string; role: string }>> = {};
    for (const m of (allMembers || [])) {
      if (!userOrgMap[m.user_id]) userOrgMap[m.user_id] = [];
      userOrgMap[m.user_id].push({ orgId: m.organization_id, role: m.role });
    }

    // ═══ Step 3: Get org names ═══
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(500);
    const orgNameMap: Record<string, string> = {};
    for (const o of (allOrgs || [])) orgNameMap[o.id] = o.name;

    // ═══ Step 4: Get published products per org ═══
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

    // ═══ Step 5: Get orgs with sales ═══
    const { data: allPurchases } = await supabase
      .from('product_purchases')
      .select('organization_id')
      .eq('status', 'completed')
      .limit(5000);
    const orgsWithSales = new Set((allPurchases || []).map(p => p.organization_id));

    // ═══ Step 6: Get affiliate links ═══
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

    // ═══ Step 7: Get profiles for display names ═══
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(5000);
    const nameMap: Record<string, string> = {};
    for (const p of (profiles || [])) {
      if (p.display_name) nameMap[p.id] = p.display_name;
    }

    // ═══ Step 8: Segment users ═══
    const segmented: SegmentedUser[] = [];

    for (const user of allUsers) {
      const orgs = userOrgMap[user.id];
      const name = nameMap[user.id] || user.email.split('@')[0];

      // Ghost: no org at all
      if (!orgs || orgs.length === 0) {
        if (targetSegment === 'all' || targetSegment === 'ghost') {
          segmented.push({ userId: user.id, email: user.email, name, segment: 'ghost' });
        }
        continue;
      }

      // Find owner orgs
      const ownerOrgs = orgs.filter(o => o.role === 'owner');
      if (ownerOrgs.length === 0) {
        // User is member but not owner - check ambassador
        if ((targetSegment === 'all' || targetSegment === 'ambassador') &&
            usersWithInactiveLinks.has(user.id) && !usersWithActiveLinks.has(user.id)) {
          segmented.push({ userId: user.id, email: user.email, name, segment: 'ambassador' });
        }
        continue;
      }

      // Check if any owned org has published products
      let hasPublished = false;
      let hasSales = false;
      let firstOrgName = '';
      let firstProductName = '';
      for (const org of ownerOrgs) {
        if (!firstOrgName) firstOrgName = orgNameMap[org.orgId] || '';
        const published = orgPublishedMap[org.orgId];
        if (published && published.length > 0) {
          hasPublished = true;
          if (!firstProductName) firstProductName = orgProductTitles[org.orgId] || '';
          if (orgsWithSales.has(org.orgId)) hasSales = true;
        }
      }

      if (!hasPublished) {
        if (targetSegment === 'all' || targetSegment === 'no_product') {
          segmented.push({ userId: user.id, email: user.email, name, segment: 'no_product', orgName: firstOrgName });
        }
      } else if (!hasSales) {
        if (targetSegment === 'all' || targetSegment === 'no_sales') {
          segmented.push({ userId: user.id, email: user.email, name, segment: 'no_sales', orgName: firstOrgName, productName: firstProductName });
        }
      } else {
        // Has sales - check if ambassador links are inactive
        if ((targetSegment === 'all' || targetSegment === 'ambassador') &&
            usersWithInactiveLinks.has(user.id) && !usersWithActiveLinks.has(user.id)) {
          segmented.push({ userId: user.id, email: user.email, name, segment: 'ambassador' });
        }
      }
    }

    // ═══ DRY RUN: just return segments ═══
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

    // ═══ Step 9: Send emails + create notifications ═══
    const templateMap: Record<string, string> = {
      ghost: 'reactivation_ghost',
      no_product: 'reactivation_no_product',
      no_sales: 'reactivation_no_sales',
      ambassador: 'reactivation_ambassador',
    };

    const notifMap: Record<string, { fr: { title: string; body: string }; en: { title: string; body: string }; actionUrl: string }> = {
      ghost: {
        fr: { title: '🎨 Créez votre premier produit !', body: 'Votre studio IA vous attend. Créez un ebook ou une formation en 3 minutes avec le Viral AI Studio.' },
        en: { title: '🎨 Create your first product!', body: 'Your AI studio is waiting. Create an ebook or course in 3 minutes with the Viral AI Studio.' },
        actionUrl: '/welcome',
      },
      no_product: {
        fr: { title: '📦 Publiez votre 1er produit !', body: 'Votre espace est prêt mais vide. Utilisez le Viral AI Studio pour publier votre premier contenu.' },
        en: { title: '📦 Publish your 1st product!', body: 'Your space is ready but empty. Use the Viral AI Studio to publish your first content.' },
        actionUrl: '/admin/create',
      },
      no_sales: {
        fr: { title: '🔥 Partagez pour vendre !', body: 'Votre produit est publié mais attend ses premiers acheteurs. Partagez-le sur WhatsApp en 1 clic.' },
        en: { title: '🔥 Share to sell!', body: 'Your product is published but waiting for buyers. Share it on WhatsApp in 1 click.' },
        actionUrl: '/admin/share',
      },
      ambassador: {
        fr: { title: '💸 Vos liens dorment !', body: 'Vous avez des liens ambassadeur mais 0 clic. Partagez-les sur WhatsApp pour commencer à gagner des commissions.' },
        en: { title: '💸 Your links are sleeping!', body: 'You have ambassador links but 0 clicks. Share them on WhatsApp to start earning commissions.' },
        actionUrl: '/admin/share',
      },
    };

    let emailsSent = 0;
    let emailsFailed = 0;
    let notificationsCreated = 0;

    // Process in batches of 10 to avoid rate limits
    const BATCH = 10;
    for (let i = 0; i < segmented.length; i += BATCH) {
      const batch = segmented.slice(i, i + BATCH);

      // Send emails
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
          if (res.error) {
            emailsFailed++;
          } else {
            emailsSent++;
          }
        } catch {
          emailsFailed++;
        }
      });

      // Create in-app notifications
      const notifInserts = batch.map((u) => {
        const notif = notifMap[u.segment];
        // Default to French
        const content = notif.fr;
        return {
          user_id: u.userId,
          title: content.title,
          body: content.body,
          notification_type: 'reactivation',
          action_url: notif.actionUrl,
        };
      });

      await Promise.all(emailPromises);

      const { error: notifErr } = await supabase
        .from('user_notifications')
        .insert(notifInserts);
      if (!notifErr) notificationsCreated += notifInserts.length;

      // Small delay between batches to respect rate limits
      if (i + BATCH < segmented.length) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    // ═══ Log the campaign run ═══
    await supabase.from('audit_logs').insert({
      action: 'reactivation_campaign',
      user_id: user.id,
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
        dry_run: false,
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
