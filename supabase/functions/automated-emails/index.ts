import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CRON-triggered edge function for automated email workflows:
 * - Onboarding drip (day 1, 3, 7)
 * - Re-engagement (7d, 14d, 30d inactive)
 * - Campaign expiring soon
 * - Lesson reminders
 * - Daily admin recaps
 * - Daily superadmin recap
 * - Anniversary emails
 * - Org inactivity alerts
 * - Affiliate commission payable
 * - Member milestones
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const results: Record<string, number> = {};

  try {
    // ═══════════════════════════════════════════
    // 1. USER ONBOARDING DRIP EMAILS
    // ═══════════════════════════════════════════
    const now = new Date();

    // Day 1: created 24h ago (±2h window)
    const day1Start = new Date(now.getTime() - 26 * 3600000).toISOString();
    const day1End = new Date(now.getTime() - 22 * 3600000).toISOString();
    const { data: day1Users } = await db.from('profiles')
      .select('id, display_name')
      .gte('created_at', day1Start).lte('created_at', day1End);

    let onboardingCount = 0;
    for (const u of day1Users || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'onboarding_day1' as any, to: email, data: { name: u.display_name || '' } });
        onboardingCount++;
      }
    }

    // Day 3
    const day3Start = new Date(now.getTime() - 74 * 3600000).toISOString();
    const day3End = new Date(now.getTime() - 70 * 3600000).toISOString();
    const { data: day3Users } = await db.from('profiles')
      .select('id, display_name')
      .gte('created_at', day3Start).lte('created_at', day3End);
    for (const u of day3Users || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'onboarding_day3' as any, to: email, data: { name: u.display_name || '' } });
        onboardingCount++;
      }
    }

    // Day 7
    const day7Start = new Date(now.getTime() - 170 * 3600000).toISOString();
    const day7End = new Date(now.getTime() - 166 * 3600000).toISOString();
    const { data: day7Users } = await db.from('profiles')
      .select('id, display_name')
      .gte('created_at', day7Start).lte('created_at', day7End);
    for (const u of day7Users || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'onboarding_day7' as any, to: email, data: { name: u.display_name || '' } });
        onboardingCount++;
      }
    }
    results['onboarding_drip'] = onboardingCount;

    // ═══════════════════════════════════════════
    // 1b. ORG CREATOR ONBOARDING SEQUENCE (J+0 instant, J+1, J+3)
    // ═══════════════════════════════════════════
    let orgOnboardingCount = 0;

    // J+0: Orgs created in the last 2 hours → immediate welcome
    const orgJ0Start = new Date(now.getTime() - 2 * 3600000).toISOString();
    const { data: newOrgs } = await db.from('organizations')
      .select('id, name, owner_id, slug, category')
      .gte('created_at', orgJ0Start);
    for (const org of newOrgs || []) {
      const email = await getUserEmail(org.owner_id);
      if (email) {
        await sendEmail({
          template: 'org_welcome_j0' as any,
          to: email,
          data: {
            name: org.name,
            slug: org.slug || '',
            category: org.category || '',
            dashboard_url: `https://siteviral.com/admin`,
          },
          organization_id: org.id,
        });
        orgOnboardingCount++;
      }
    }

    // J+1: Orgs created ~24h ago — "Avez-vous ajouté votre premier contenu ?"
    const orgJ1Start = new Date(now.getTime() - 26 * 3600000).toISOString();
    const orgJ1End = new Date(now.getTime() - 22 * 3600000).toISOString();
    const { data: j1Orgs } = await db.from('organizations')
      .select('id, name, owner_id, slug')
      .gte('created_at', orgJ1Start).lte('created_at', orgJ1End);
    for (const org of j1Orgs || []) {
      // Check if org has published any content yet
      const { count: mediaCount } = await db.from('media_content')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id).eq('is_published', true);
      const { count: prodCount } = await db.from('digital_products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id).eq('is_published', true);
      // Only send if they haven't published anything yet
      if ((mediaCount || 0) === 0 && (prodCount || 0) === 0) {
        const email = await getUserEmail(org.owner_id);
        if (email) {
          await sendEmail({
            template: 'org_onboarding_j1' as any,
            to: email,
            data: {
              org_name: org.name,
              slug: org.slug || '',
              tip: 'Astuce : utilisez le bouton « Démarrage Express » dans votre tableau de bord pour créer un produit et une campagne en 1 clic !',
            },
            organization_id: org.id,
          });
          orgOnboardingCount++;
        }
      }
    }

    // J+3: Orgs created ~72h ago — "Vos ambassadeurs vous attendent"
    const orgJ3Start = new Date(now.getTime() - 74 * 3600000).toISOString();
    const orgJ3End = new Date(now.getTime() - 70 * 3600000).toISOString();
    const { data: j3Orgs } = await db.from('organizations')
      .select('id, name, owner_id, slug, affiliation_enabled')
      .gte('created_at', orgJ3Start).lte('created_at', orgJ3End);
    for (const org of j3Orgs || []) {
      const email = await getUserEmail(org.owner_id);
      if (email) {
        await sendEmail({
          template: 'org_onboarding_j3' as any,
          to: email,
          data: {
            org_name: org.name,
            slug: org.slug || '',
            affiliation_enabled: org.affiliation_enabled ? 'oui' : 'non',
            tip: 'Activez le Programme Ambassadeur pour que chaque membre puisse vendre pour vous et gagner des commissions.',
          },
          organization_id: org.id,
        });
        orgOnboardingCount++;
      }
    }
    results['org_onboarding_sequence'] = orgOnboardingCount;

    // ═══════════════════════════════════════════
    // 2. RE-ENGAGEMENT (inactive users)
    // ═══════════════════════════════════════════
    // Check last sign-in via auth.users — we use updated_at on profiles as proxy
    let reengageCount = 0;

    // 7 days inactive
    const inactive7d = new Date(now.getTime() - 7 * 86400000).toISOString();
    const inactive7dEnd = new Date(now.getTime() - 6.5 * 86400000).toISOString();
    const { data: inactive7 } = await db.from('profiles')
      .select('id, display_name')
      .lte('updated_at', inactive7d).gte('updated_at', inactive7dEnd)
      .limit(50);
    for (const u of inactive7 || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'inactive_7d' as any, to: email, data: { name: u.display_name || '' } });
        reengageCount++;
      }
    }

    // 14 days inactive
    const inactive14d = new Date(now.getTime() - 14 * 86400000).toISOString();
    const inactive14dEnd = new Date(now.getTime() - 13.5 * 86400000).toISOString();
    const { data: inactive14 } = await db.from('profiles')
      .select('id, display_name')
      .lte('updated_at', inactive14d).gte('updated_at', inactive14dEnd)
      .limit(50);
    for (const u of inactive14 || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'inactive_14d' as any, to: email, data: { name: u.display_name || '' } });
        reengageCount++;
      }
    }

    // 30 days inactive
    const inactive30d = new Date(now.getTime() - 30 * 86400000).toISOString();
    const inactive30dEnd = new Date(now.getTime() - 29.5 * 86400000).toISOString();
    const { data: inactive30 } = await db.from('profiles')
      .select('id, display_name')
      .lte('updated_at', inactive30d).gte('updated_at', inactive30dEnd)
      .limit(50);
    for (const u of inactive30 || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        await sendEmail({ template: 'inactive_30d' as any, to: email, data: { name: u.display_name || '' } });
        reengageCount++;
      }
    }
    results['re_engagement'] = reengageCount;

    // ═══════════════════════════════════════════
    // 3. CAMPAIGN EXPIRING SOON (3 days and 1 day)
    // ═══════════════════════════════════════════
    let campaignAlerts = 0;
    for (const daysLeft of [3, 1]) {
      const targetDate = new Date(now.getTime() + daysLeft * 86400000);
      const rangeStart = new Date(targetDate.getTime() - 12 * 3600000).toISOString();
      const rangeEnd = new Date(targetDate.getTime() + 12 * 3600000).toISOString();
      const { data: campaigns } = await db.from('donation_campaigns')
        .select('id, title, organization_id, current_amount, goal_amount, currency, end_date')
        .eq('is_active', true)
        .gte('end_date', rangeStart).lte('end_date', rangeEnd);
      for (const c of campaigns || []) {
        const { data: org } = await db.from('organizations').select('name').eq('id', c.organization_id).single();
        await sendEmailToOrgAdmins('campaign_expiring_soon' as any, c.organization_id, {
          campaign_name: c.title,
          org_name: org?.name || '',
          days_left: daysLeft,
          current_amount: c.current_amount || 0,
          goal_amount: c.goal_amount || 0,
          currency: c.currency || 'XOF',
        });
        campaignAlerts++;
      }
    }
    results['campaign_alerts'] = campaignAlerts;


    // ═══════════════════════════════════════════
    // 5. DAILY ADMIN RECAPS (yesterday's metrics)
    // ═══════════════════════════════════════════
    let adminRecaps = 0;
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const { data: orgMetrics } = await db.from('org_daily_metrics')
      .select('organization_id, revenue, new_members, transactions_count, page_views, organizations(name, currency)')
      .eq('metric_date', yesterday);
    for (const m of orgMetrics || []) {
      const org = (m as any).organizations;
      if (org && ((m.revenue || 0) > 0 || (m.new_members || 0) > 0 || (m.transactions_count || 0) > 0)) {
        await sendEmailToOrgAdmins('daily_recap_admin' as any, m.organization_id, {
          org_name: org.name,
          date: yesterday,
          revenue: m.revenue || 0,
          currency: org.currency || 'XOF',
          new_members: m.new_members || 0,
          transactions: m.transactions_count || 0,
          page_views: m.page_views || 0,
        });
        adminRecaps++;
      }
    }
    results['admin_recaps'] = adminRecaps;

    // ═══════════════════════════════════════════
    // 6. SUPERADMIN DAILY RECAP
    // ═══════════════════════════════════════════
    const { data: platformMetrics } = await db.from('platform_metrics_daily')
      .select('*').eq('metric_date', yesterday).single();
    if (platformMetrics) {
      // Get superadmin emails
      const { data: superadmins } = await db.from('user_platform_roles')
        .select('user_id').eq('role', 'superadmin');
      for (const sa of superadmins || []) {
        const email = await getUserEmail(sa.user_id);
        if (email) {
          await sendEmail({ template: 'daily_recap_superadmin' as any, to: email, data: {
            date: yesterday,
            gmv: platformMetrics.gmv || 0,
            platform_fees: platformMetrics.platform_fees || 0,
            new_users: platformMetrics.new_users || 0,
            new_orgs: platformMetrics.new_orgs || 0,
            total_transactions: platformMetrics.total_transactions || 0,
          }});
        }
      }
      results['superadmin_recap'] = 1;
    }

    // ═══════════════════════════════════════════
    // 7. ANNIVERSARY (1 year)
    // ═══════════════════════════════════════════
    let anniversaryCount = 0;
    const oneYearAgoStart = new Date(now.getTime() - 366 * 86400000).toISOString();
    const oneYearAgoEnd = new Date(now.getTime() - 364 * 86400000).toISOString();
    const { data: anniversaryUsers } = await db.from('profiles')
      .select('id, display_name')
      .gte('created_at', oneYearAgoStart).lte('created_at', oneYearAgoEnd);
    for (const u of anniversaryUsers || []) {
      const email = await getUserEmail(u.id);
      if (email) {
        const { count: orgsCount } = await db.from('organization_members')
          .select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        await sendEmail({ template: 'anniversary_1y' as any, to: email, data: {
          name: u.display_name || '',
          orgs_count: orgsCount || 0,
        }});
        anniversaryCount++;
      }
    }
    results['anniversary'] = anniversaryCount;

    // ═══════════════════════════════════════════
    // 8. ORG INACTIVITY (30 days no content)
    // ═══════════════════════════════════════════
    let orgInactiveCount = 0;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const { data: allOrgs } = await db.from('organizations')
      .select('id, name, updated_at')
      .eq('is_active', true)
      .lte('updated_at', thirtyDaysAgo)
      .limit(20);
    for (const org of allOrgs || []) {
      await sendEmailToOrgAdmins('org_inactive_30d' as any, org.id, { org_name: org.name });
      orgInactiveCount++;
    }
    results['org_inactive'] = orgInactiveCount;

    // ═══════════════════════════════════════════
    // 9. AFFILIATE COMMISSIONS PAYABLE (72h hold cleared)
    // ═══════════════════════════════════════════
    let affPayableCount = 0;
    const { data: payableSales } = await db.from('affiliate_sales')
      .select('id, affiliate_user_id, commission_amount, organization_id, organizations(name, currency)')
      .eq('status', 'pending')
      .lte('payable_at', now.toISOString())
      .limit(50);
    for (const sale of payableSales || []) {
      const email = await getUserEmail(sale.affiliate_user_id);
      const org = (sale as any).organizations;
      if (email && org) {
        await sendEmail({ template: 'affiliate_commission_payable' as any, to: email, data: {
          amount: sale.commission_amount,
          currency: org.currency || 'XOF',
          org_name: org.name,
        }});
        // Update status to payable
        await db.from('affiliate_sales').update({ status: 'payable' }).eq('id', sale.id);
        affPayableCount++;
      }
    }
    results['affiliate_payable'] = affPayableCount;

    // ═══════════════════════════════════════════
    // 10. MEMBER MILESTONES (100, 500, 1000)
    // ═══════════════════════════════════════════
    let milestoneCount = 0;
    const milestones = [100, 500, 1000, 5000, 10000];
    let orgMemCounts: any = null;
    try { const res = await db.rpc('get_org_member_counts' as any); orgMemCounts = res.data; } catch { /* skip */ }
    // Fallback: manual count for active orgs
    if (!orgMemCounts) {
      const { data: activeOrgs } = await db.from('organizations').select('id, name').eq('is_active', true).limit(100);
      for (const org of activeOrgs || []) {
        const { count } = await db.from('organization_members')
          .select('*', { count: 'exact', head: true }).eq('organization_id', org.id);
        if (count && milestones.includes(count)) {
          await sendEmailToOrgAdmins('member_milestone' as any, org.id, {
            org_name: org.name,
            count: count,
          });
          milestoneCount++;
        }
      }
    }
    results['member_milestones'] = milestoneCount;

    // ═══════════════════════════════════════════
    // 11. KYC REMINDER (orgs with sales but no KYC)
    // ═══════════════════════════════════════════
    let kycReminderCount = 0;
    const { data: orgsNoKyc } = await db.from('organizations')
      .select('id, name, owner_id, kyc_status')
      .eq('is_active', true)
      .in('kyc_status', ['none', 'rejected'])
      .limit(30);
    for (const org of orgsNoKyc || []) {
      // Check if org has completed sales
      const { count: orgSales } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id).eq('status', 'completed');
      const { count: orgDonations } = await db.from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id).eq('status', 'completed');
      if ((orgSales || 0) + (orgDonations || 0) > 0) {
        // Anti-spam: check if we sent this email in the last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
        const { count: recentEmails } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('template', 'kyc_reminder')
          .gte('created_at', sevenDaysAgo);
        if ((recentEmails || 0) === 0) {
          const email = await getUserEmail(org.owner_id);
          if (email) {
            await sendEmail({
              template: 'kyc_reminder' as any,
              to: email,
              data: {
                org_name: org.name,
                status: org.kyc_status === 'rejected' ? 'rejeté' : 'non commencé',
                total_revenue: (orgSales || 0) + (orgDonations || 0),
              },
              organization_id: org.id,
            });
            kycReminderCount++;
          }
        }
      }
    }
    results['kyc_reminders'] = kycReminderCount;

    // ═══════════════════════════════════════════
    // 12. PAYOUT AVAILABLE (hold expired, balance > threshold)
    // ═══════════════════════════════════════════
    let payoutAvailableCount = 0;
    // Find orgs with completed transactions older than 72h that haven't been notified
    const holdExpiry = new Date(now.getTime() - 72 * 3600000).toISOString();
    const { data: recentCompletedSales } = await db.from('product_purchases')
      .select('organization_id, organizations(name, owner_id, currency)')
      .eq('status', 'completed')
      .lte('completed_at', holdExpiry)
      .gte('completed_at', new Date(now.getTime() - 96 * 3600000).toISOString()) // 72-96h window
      .limit(30);
    const notifiedOrgIds = new Set<string>();
    for (const sale of recentCompletedSales || []) {
      if (notifiedOrgIds.has(sale.organization_id)) continue;
      notifiedOrgIds.add(sale.organization_id);
      const org = (sale as any).organizations;
      if (org) {
        const email = await getUserEmail(org.owner_id);
        if (email) {
          await sendEmail({
            template: 'payout_available' as any,
            to: email,
            data: {
              org_name: org.name,
              currency: org.currency || 'XOF',
            },
            organization_id: sale.organization_id,
          });
          payoutAvailableCount++;
        }
      }
    }
    results['payout_available'] = payoutAvailableCount;

    // ═══════════════════════════════════════════
    // 13. DRAFT PRODUCT REMINDER (unpublished products > 48h)
    // ═══════════════════════════════════════════
    let draftReminderCount = 0;
    const draftWindow = new Date(now.getTime() - 50 * 3600000).toISOString();
    const draftWindowEnd = new Date(now.getTime() - 46 * 3600000).toISOString();
    const { data: draftProducts } = await db.from('digital_products')
      .select('id, title, organization_id, created_by, organizations(name)')
      .eq('is_published', false)
      .gte('created_at', draftWindowEnd)
      .lte('created_at', draftWindow)
      .limit(20);
    for (const prod of draftProducts || []) {
      if (!prod.created_by) continue;
      const email = await getUserEmail(prod.created_by);
      const org = (prod as any).organizations;
      if (email && org) {
        await sendEmail({
          template: 'draft_product_reminder' as any,
          to: email,
          data: {
            product_title: prod.title,
            org_name: org.name,
          },
          organization_id: prod.organization_id,
        });
        draftReminderCount++;
      }
    }
    results['draft_reminders'] = draftReminderCount;

    // ═══════════════════════════════════════════
    // 14. AFFILIATE INACTIVITY (0 clicks in 14 days)
    // ═══════════════════════════════════════════
    let affInactiveCount = 0;
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const { data: inactiveAffiliates } = await db.from('affiliate_links')
      .select('id, user_id, organization_id, code, organizations(name)')
      .eq('is_active', true)
      .lte('created_at', fourteenDaysAgo)
      .limit(30);
    for (const aff of inactiveAffiliates || []) {
      // Check recent clicks (if clicks column hasn't changed)
      // Simple heuristic: send once per 14 days
      const { count: recentEmailCount } = await db.from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('template', 'affiliate_inactive')
        .eq('recipient', aff.user_id)
        .gte('created_at', fourteenDaysAgo);
      if ((recentEmailCount || 0) === 0) {
        const email = await getUserEmail(aff.user_id);
        const org = (aff as any).organizations;
        if (email && org) {
          await sendEmail({
            template: 'affiliate_inactive' as any,
            to: email,
            data: {
              org_name: org.name,
              code: aff.code,
            },
            organization_id: aff.organization_id,
          });
          affInactiveCount++;
        }
      }
    }
    results['affiliate_inactive'] = affInactiveCount;

    // ═══════════════════════════════════════════
    // 15. FIRST SALE CELEBRATION (orgs that got their 1st sale today)
    // ═══════════════════════════════════════════
    let firstSaleCount = 0;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const { data: todaySales } = await db.from('product_purchases')
      .select('organization_id, organizations(name, owner_id, currency), amount')
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .limit(50);
    const firstSaleOrgs = new Set<string>();
    for (const sale of todaySales || []) {
      if (firstSaleOrgs.has(sale.organization_id)) continue;
      firstSaleOrgs.add(sale.organization_id);
      // Check if this is truly their first sale ever
      const { count: totalSales } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', sale.organization_id)
        .eq('status', 'completed');
      if (totalSales === 1) {
        const org = (sale as any).organizations;
        if (org) {
          const email = await getUserEmail(org.owner_id);
          if (email) {
            await sendEmail({
              template: 'first_sale_celebration' as any,
              to: email,
              data: {
                org_name: org.name,
                amount: sale.amount,
                currency: org.currency || 'XOF',
              },
              organization_id: sale.organization_id,
            });
            firstSaleCount++;
          }
        }
      }
    }
    results['first_sale_celebrations'] = firstSaleCount;

    // ═══════════════════════════════════════════
    // 16. SALES MILESTONE CELEBRATIONS (10th, 50th, 100th, 500th, 1000th sale)
    // ═══════════════════════════════════════════
    let salesMilestoneCount = 0;
    const salesMilestones = [10, 50, 100, 500, 1000];
    const { data: activeOrgsForMilestones } = await db.from('organizations')
      .select('id, name, owner_id, currency')
      .eq('is_active', true)
      .limit(100);
    for (const org of activeOrgsForMilestones || []) {
      const { count: totalOrgSales } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'completed');
      if (totalOrgSales && salesMilestones.includes(totalOrgSales)) {
        // Anti-spam: check not already sent for this milestone
        const { count: alreadySent } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('template', `sales_milestone_${totalOrgSales}`);
        if ((alreadySent || 0) === 0) {
          const email = await getUserEmail(org.owner_id);
          if (email) {
            await sendEmail({
              template: `sales_milestone_${totalOrgSales}` as any,
              to: email,
              data: {
                org_name: org.name,
                milestone: totalOrgSales,
                currency: org.currency || 'XOF',
                message: totalOrgSales >= 100
                  ? '🏆 Vous faites partie des top vendeurs de Siteviral !'
                  : `🎉 Félicitations pour vos ${totalOrgSales} premières ventes !`,
              },
              organization_id: org.id,
            });
            salesMilestoneCount++;
          }
        }
      }
    }
    results['sales_milestones'] = salesMilestoneCount;

    // ═══════════════════════════════════════════
    // 17. ORG REACTIVATION SEQUENCE (no content in 14d, 21d)
    // ═══════════════════════════════════════════
    let orgReactivationCount = 0;
    for (const daysSince of [14, 21]) {
      const targetDate = new Date(now.getTime() - daysSince * 86400000);
      const rangeStart = new Date(targetDate.getTime() - 12 * 3600000).toISOString();
      const rangeEnd = new Date(targetDate.getTime() + 12 * 3600000).toISOString();
      const { data: staleOrgs } = await db.from('organizations')
        .select('id, name, owner_id, updated_at')
        .eq('is_active', true)
        .gte('updated_at', rangeStart)
        .lte('updated_at', rangeEnd)
        .limit(20);
      for (const org of staleOrgs || []) {
        const templateName = `org_reactivation_${daysSince}d`;
        const { count: alreadySent } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('template', templateName)
          .gte('created_at', new Date(now.getTime() - 30 * 86400000).toISOString());
        if ((alreadySent || 0) === 0) {
          const email = await getUserEmail(org.owner_id);
          if (email) {
            await sendEmail({
              template: templateName as any,
              to: email,
              data: {
                org_name: org.name,
                days_inactive: daysSince,
                tip: daysSince >= 21
                  ? 'Vos visiteurs cherchent du contenu frais. Publiez une ressource ou un message pour les réengager.'
                  : 'Astuce : ajoutez un nouveau produit ou annonce pour redonner vie à votre page.',
              },
              organization_id: org.id,
            });
            orgReactivationCount++;
          }
        }
      }
    }
    results['org_reactivation'] = orgReactivationCount;

    // ═══════════════════════════════════════════
    // 18. WEEKLY DIGEST FOR BUYERS (purchases, new products from followed orgs)
    // ═══════════════════════════════════════════
    let weeklyDigestCount = 0;
    // Only send on Mondays
    if (now.getDay() === 1) {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const { data: activeBuyers } = await db.from('product_purchases')
        .select('user_id')
        .eq('status', 'completed')
        .gte('completed_at', oneWeekAgo)
        .limit(50);
      const seenUsers = new Set<string>();
      for (const purchase of activeBuyers || []) {
        if (!purchase.user_id || seenUsers.has(purchase.user_id)) continue;
        seenUsers.add(purchase.user_id);
        const email = await getUserEmail(purchase.user_id);
        if (email) {
          // Count their orgs and new products
          const { data: memberships } = await db.from('organization_members')
            .select('organization_id')
            .eq('user_id', purchase.user_id)
            .limit(10);
          const orgIds = (memberships || []).map((m: any) => m.organization_id);
          let newProductCount = 0;
          if (orgIds.length > 0) {
            const { count } = await db.from('digital_products')
              .select('*', { count: 'exact', head: true })
              .in('organization_id', orgIds)
              .eq('is_published', true)
              .gte('created_at', oneWeekAgo);
            newProductCount = count || 0;
          }
          if (newProductCount > 0) {
            await sendEmail({
              template: 'weekly_buyer_digest' as any,
              to: email,
              data: {
                new_products: newProductCount,
                orgs_followed: orgIds.length,
              },
            });
            weeklyDigestCount++;
          }
        }
      }
    }
    results['weekly_buyer_digest'] = weeklyDigestCount;

    // ═══════════════════════════════════════════
    // 19. FLASH SALE STARTING (products with sale_ends_at set in last 2h)
    // ═══════════════════════════════════════════
    let flashSaleCount = 0;
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString();
    const { data: flashProducts } = await db.from('digital_products')
      .select('id, title, price, sale_price, sale_ends_at, organization_id, organizations(name, currency)')
      .eq('is_published', true)
      .not('sale_price', 'is', null)
      .not('sale_ends_at', 'is', null)
      .gt('sale_ends_at', now.toISOString())
      .gte('updated_at', twoHoursAgo)
      .limit(10);
    for (const prod of flashProducts || []) {
      const org = (prod as any).organizations;
      if (!org) continue;
      // Get members of this org to notify them
      const { data: orgMembers } = await db.from('organization_members')
        .select('user_id')
        .eq('organization_id', prod.organization_id)
        .limit(100);
      for (const member of orgMembers || []) {
        const email = await getUserEmail(member.user_id);
        if (email) {
          const discount = prod.price && prod.sale_price
            ? Math.round(((prod.price - prod.sale_price) / prod.price) * 100)
            : 0;
          await sendEmail({
            template: 'flash_sale_alert' as any,
            to: email,
            data: {
              product_title: prod.title,
              org_name: org.name,
              discount: `${discount}%`,
              sale_price: prod.sale_price,
              original_price: prod.price,
              currency: org.currency || 'XOF',
              ends_at: prod.sale_ends_at,
            },
            organization_id: prod.organization_id,
          });
          flashSaleCount++;
        }
      }
    }
    results['flash_sale_alerts'] = flashSaleCount;

    // ═══════════════════════════════════════════
    // 20. STREAK MILESTONE (7, 30, 100 day streaks)
    // ═══════════════════════════════════════════
    let streakMilestoneCount = 0;
    const streakMilestones = [7, 30, 100];
    const { data: activeStreaks } = await db.from('user_streaks')
      .select('user_id, current_streak')
      .in('current_streak', streakMilestones)
      .limit(50);
    for (const s of activeStreaks || []) {
      const { count: alreadySent } = await db.from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('recipient', s.user_id)
        .eq('template', `streak_milestone_${s.current_streak}`)
        .gte('created_at', new Date(now.getTime() - 30 * 86400000).toISOString());
      if ((alreadySent || 0) === 0) {
        const email = await getUserEmail(s.user_id);
        if (email) {
          await sendEmail({
            template: `streak_milestone_${s.current_streak}` as any,
            to: email,
            data: {
              streak: s.current_streak,
              message: s.current_streak >= 100
                ? '👑 Vous êtes un utilisateur légendaire ! 100 jours de suite !'
                : s.current_streak >= 30
                ? '🔥 30 jours consécutifs ! Vous êtes incroyable !'
                : '⚡ 7 jours d\'affilée — vous êtes en feu !',
            },
          });
          streakMilestoneCount++;
        }
      }
    }
    results['streak_milestones'] = streakMilestoneCount;

    // ═══════════════════════════════════════════
    // 21. ABANDONED CART RECOVERY (opened but not purchased in 1h)
    // ═══════════════════════════════════════════
    let abandonedCartCount = 0;
    const oneHourAgo = new Date(now.getTime() - 60 * 60000).toISOString();
    const twoHoursAgoCart = new Date(now.getTime() - 2 * 3600000).toISOString();
    const { data: abandonedCarts } = await db.from('abandoned_carts')
      .select('id, email, buyer_name, product_id, organization_id, reminder_sent_count, digital_products(title), organizations(name, currency)')
      .eq('converted', false)
      .eq('reminder_sent_count', 0)
      .lte('opened_at', oneHourAgo)
      .gte('opened_at', twoHoursAgoCart)
      .limit(30);
    for (const cart of abandonedCarts || []) {
      const cartEmail = cart.email || (cart.user_id ? await getUserEmail(cart.user_id) : null);
      const prod = (cart as any).digital_products;
      const org = (cart as any).organizations;
      if (cartEmail && prod && org) {
        await sendEmail({
          template: 'abandoned_cart_reminder' as any,
          to: cartEmail,
          data: {
            buyer_name: cart.buyer_name || '',
            product_title: prod.title,
            org_name: org.name,
            currency: org.currency || 'XOF',
          },
          organization_id: cart.organization_id,
        });
        await db.from('abandoned_carts')
          .update({ reminder_sent_count: 1, last_reminder_at: now.toISOString() })
          .eq('id', cart.id);
        abandonedCartCount++;
      }
    }
    results['abandoned_cart_recovery'] = abandonedCartCount;

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('automated-emails error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
