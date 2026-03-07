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

    // ═══════════════════════════════════════════
    // 22. WEEKLY PERFORMANCE DIGEST FOR ORG OWNERS (Monday 8AM)
    // ═══════════════════════════════════════════
    let weeklyOwnerDigestCount = 0;
    const dayOfWeek = now.getUTCDay();
    const hourOfDay = now.getUTCHours();
    // Run on Monday between 7-9 UTC
    if (dayOfWeek === 1 && hourOfDay >= 7 && hourOfDay <= 9) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

      const { data: allOrgs } = await db.from('organizations')
        .select('id, name, slug, owner_id, currency')
        .eq('is_active', true)
        .limit(200);

      for (const org of allOrgs || []) {
        // Check if already sent this week
        const { count: alreadySent } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('template', 'weekly_owner_digest')
          .eq('organization_id', org.id)
          .gte('created_at', sevenDaysAgo);
        if ((alreadySent || 0) > 0) continue;

        // This week's stats
        const [weekPurchases, weekDonations, weekMembers] = await Promise.all([
          db.from('product_purchases').select('amount').eq('organization_id', org.id).eq('status', 'completed').gte('created_at', sevenDaysAgo),
          db.from('donations').select('amount').eq('organization_id', org.id).eq('status', 'completed').gte('created_at', sevenDaysAgo),
          db.from('organization_members').select('id').eq('organization_id', org.id).gte('joined_at', sevenDaysAgo),
        ]);

        // Previous week's stats for comparison
        const [prevPurchases, prevDonations] = await Promise.all([
          db.from('product_purchases').select('amount').eq('organization_id', org.id).eq('status', 'completed').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
          db.from('donations').select('amount').eq('organization_id', org.id).eq('status', 'completed').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
        ]);

        const weekRevenue = (weekPurchases.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0)
          + (weekDonations.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
        const prevRevenue = (prevPurchases.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0)
          + (prevDonations.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
        const weekTx = (weekPurchases.data?.length || 0) + (weekDonations.data?.length || 0);
        const newMembersCount = weekMembers.data?.length || 0;
        const revenueChange = prevRevenue > 0 ? (((weekRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : weekRevenue > 0 ? '+100' : '0';

        // Only send if org has any activity
        if (weekRevenue === 0 && weekTx === 0 && newMembersCount === 0) continue;

        const ownerEmail = await getUserEmail(org.owner_id);
        if (ownerEmail) {
          await sendEmail({
            template: 'weekly_owner_digest' as any,
            to: ownerEmail,
            data: {
              org_name: org.name,
              org_slug: org.slug,
              currency: org.currency || 'XOF',
              week_revenue: weekRevenue,
              week_transactions: weekTx,
              week_new_members: newMembersCount,
              revenue_change: revenueChange,
              week_purchases: weekPurchases.data?.length || 0,
              week_donations: weekDonations.data?.length || 0,
            },
            organization_id: org.id,
          });
          weeklyOwnerDigestCount++;
        }
      }
    }
    results['weekly_owner_digest'] = weeklyOwnerDigestCount;

    // ═══════════════════════════════════════════
    // 23. WIN-BACK EMAIL (members inactive 30+ days with previous purchases)
    // ═══════════════════════════════════════════
    let winBackCount = 0;
    const thirtyDaysAgoWinback = new Date(now.getTime() - 30 * 86400000).toISOString();
    const { data: inactiveOrgs } = await db.from('organizations')
      .select('id, name, slug, currency')
      .eq('is_active', true)
      .limit(50);

    for (const org of inactiveOrgs || []) {
      // Find members who purchased before but not in last 30 days
      const { data: oldBuyers } = await db.from('product_purchases')
        .select('user_id')
        .eq('organization_id', org.id)
        .eq('status', 'completed')
        .lt('created_at', thirtyDaysAgoWinback)
        .limit(50);
      const oldBuyerIds = [...new Set((oldBuyers || []).map((b: any) => b.user_id).filter(Boolean))];
      if (oldBuyerIds.length === 0) continue;

      // Exclude those who purchased recently
      const { data: recentBuyers } = await db.from('product_purchases')
        .select('user_id')
        .eq('organization_id', org.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgoWinback)
        .in('user_id', oldBuyerIds);
      const recentSet = new Set((recentBuyers || []).map((b: any) => b.user_id));
      const churned = oldBuyerIds.filter(id => !recentSet.has(id));

      for (const userId of churned.slice(0, 10)) {
        // Check not already sent win-back in last 30 days
        const { count: sent } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('recipient', userId)
          .eq('template', 'win_back')
          .gte('created_at', thirtyDaysAgoWinback);
        if ((sent || 0) > 0) continue;

        const email = await getUserEmail(userId);
        if (email) {
          const { data: profile } = await db.from('profiles').select('display_name').eq('id', userId).maybeSingle();
          // Get latest products from org for re-engagement
          const { data: latestProducts } = await db.from('digital_products')
            .select('title')
            .eq('organization_id', org.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(3);
          const productNames = (latestProducts || []).map((p: any) => p.title).join(', ');

          await sendEmail({
            template: 'win_back' as any,
            to: email,
            data: {
              name: profile?.display_name || '',
              org_name: org.name,
              org_slug: org.slug,
              new_products: productNames || 'de nouvelles ressources',
            },
            organization_id: org.id,
          });
          winBackCount++;
        }
      }
    }
    results['win_back_emails'] = winBackCount;

    // ═══════════════════════════════════════════
    // WISHLIST REMINDERS (items saved 3+ days ago, not yet purchased)
    // ═══════════════════════════════════════════
    let wishlistReminderCount = 0;
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
    const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString();
    const { data: wishlistItems } = await db.from('wishlists')
      .select('id, user_id, product_id, digital_products(title, price, currency, cover_image_url, slug, is_free, sale_price, sale_ends_at, organizations(name, slug))')
      .gte('created_at', fourDaysAgo)
      .lte('created_at', threeDaysAgo)
      .limit(100);

    for (const wi of wishlistItems || []) {
      const product = (wi as any).digital_products;
      if (!product) continue;

      // Check if user already purchased this product
      const { count: purchaseCount } = await db.from('product_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', wi.user_id)
        .eq('product_id', wi.product_id)
        .eq('status', 'completed');
      if ((purchaseCount || 0) > 0) continue;

      const email = await getUserEmail(wi.user_id);
      if (!email) continue;

      const org = product.organizations;
      const isOnSale = product.sale_price && product.sale_ends_at && new Date(product.sale_ends_at) > now;
      const productUrl = `https://siteviral.com/org/${org?.slug || ''}/p/${product.slug || wi.product_id}`;

      await sendEmail({
        template: 'wishlist_reminder' as any,
        to: email,
        data: {
          product_name: product.title,
          product_url: productUrl,
          product_image: product.cover_image_url || '',
          price: product.is_free ? 'Gratuit' : `${isOnSale ? product.sale_price : product.price} ${product.currency || 'XOF'}`,
          is_on_sale: isOnSale ? 'oui' : 'non',
          original_price: isOnSale ? `${product.price} ${product.currency || 'XOF'}` : '',
          org_name: org?.name || '',
        },
      });
      wishlistReminderCount++;
    }
    results['wishlist_reminders'] = wishlistReminderCount;

    // ═══════════════════════════════════════════
    // WEEKLY DISCOVERY DIGEST (Mondays — personalized new products)
    // ═══════════════════════════════════════════
    let digestCount = 0;
    const dayOfWeek2 = now.getUTCDay(); // 0=Sun, 1=Mon
    if (dayOfWeek2 === 1) { // Only on Mondays
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      // Get new products from last 7 days
      const { data: newProducts } = await db.from('digital_products')
        .select('title, slug, cover_image_url, price, currency, is_free, organizations(name, slug)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .gte('created_at', sevenDaysAgo)
        .order('featured_score', { ascending: false })
        .limit(5);

      if (newProducts && newProducts.length > 0) {
        // Get users who have notification prefs enabled for marketing
        const { data: subscribedUsers } = await db.from('notification_preferences')
          .select('user_id')
          .eq('marketing', true)
          .eq('email_enabled', true)
          .limit(200);

        const productList = newProducts.map((p: any) => ({
          title: p.title,
          url: `https://siteviral.com/org/${p.organizations?.slug || ''}/p/${p.slug || ''}`,
          image: p.cover_image_url || '',
          price: p.is_free ? 'Gratuit' : `${p.price} ${p.currency || 'XOF'}`,
          org_name: p.organizations?.name || '',
        }));

        for (const sub of subscribedUsers || []) {
          const email = await getUserEmail(sub.user_id);
          if (email) {
            await sendEmail({
              template: 'weekly_discovery_digest' as any,
              to: email,
              data: {
                products: productList,
                count: productList.length,
              },
            });
            digestCount++;
          }
        }
      }
    }
    results['weekly_digest'] = digestCount;

    // ═══════════════════════════════════════════
    // AMBASSADOR DIGEST (Weekly — top products to promote)
    // Runs any day but dedup prevents re-sending within 7 days
    // ═══════════════════════════════════════════
    let ambassadorDigestCount = 0;
    {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      // Get top 5 products with highest commission potential from last 7 days
      const { data: topProducts } = await db.from('digital_products')
        .select('title, slug, price, currency, is_free, cover_image_url, created_at, organizations!inner(name, slug, affiliation_enabled, affiliation_commission_percent)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('organizations.affiliation_enabled', true)
        .gte('created_at', sevenDaysAgo)
        .order('price', { ascending: false })
        .limit(20);

      if (topProducts && topProducts.length > 0) {
        // Sort by potential earning (price * commission%)
        const ranked = topProducts
          .map((p: any) => ({
            ...p,
            commission: p.organizations?.affiliation_commission_percent || 10,
            earning: Math.round((p.price || 0) * (p.organizations?.affiliation_commission_percent || 10) / 100),
          }))
          .sort((a: any, b: any) => b.earning - a.earning)
          .slice(0, 5);

        const productList = ranked.map((p: any) => ({
          title: p.title,
          url: `https://siteviral.com/org/${p.organizations?.slug || ''}/p/${p.slug || ''}`,
          image: p.cover_image_url || '',
          price: p.is_free ? 'Gratuit' : `${p.price} ${p.currency || 'XOF'}`,
          commission: `${p.commission}%`,
          earning: `${p.earning} ${p.currency || 'XOF'}`,
          org_name: p.organizations?.name || '',
        }));

        // Get all active ambassadors (users with at least 1 active affiliate link)
        const { data: activeAmbassadors } = await db.from('affiliate_links')
          .select('user_id')
          .eq('is_active', true)
          .limit(1000);

        // Deduplicate user IDs
        const uniqueUserIds = [...new Set((activeAmbassadors || []).map((a: any) => a.user_id))];

        // Check who already received this week's digest
        const { data: alreadySent } = await db.from('email_logs')
          .select('recipient')
          .eq('template', 'ambassador_weekly_digest')
          .gte('created_at', sevenDaysAgo);
        const sentEmails = new Set((alreadySent || []).map((e: any) => e.recipient));

        for (const userId of uniqueUserIds) {
          const email = await getUserEmail(userId as string);
          if (email && !sentEmails.has(email)) {
            await sendEmail({
              template: 'ambassador_weekly_digest' as any,
              to: email,
              data: {
                products: productList,
                count: productList.length,
                subject: '💰 Top 5 produits à promouvoir cette semaine',
              },
            });
            ambassadorDigestCount++;
          }
        }
      }
    }
    results['ambassador_weekly_digest'] = ambassadorDigestCount;

    // ═══════════════════════════════════════════
    // HIGH-COMMISSION PRODUCT INSTANT EMAIL ALERT
    // (Runs every cycle — catches products published in last 2h)
    // ═══════════════════════════════════════════
    let highCommissionAlertCount = 0;
    {
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString();

      // Find recently published high-commission products
      const { data: recentHighProducts } = await db.from('digital_products')
        .select('id, title, slug, price, currency, cover_image_url, organizations!inner(id, name, slug, affiliation_enabled, affiliation_commission_percent)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('organizations.affiliation_enabled', true)
        .gte('created_at', twoHoursAgo)
        .limit(10);

      // Filter for high-value: >=20% commission OR high absolute earning
      const highValueProducts = (recentHighProducts || []).filter((p: any) => {
        const comm = p.organizations?.affiliation_commission_percent || 10;
        const earning = Math.round((p.price || 0) * comm / 100);
        const currency = p.currency || 'XOF';
        return comm >= 20 || (currency === 'XOF' && earning >= 1000) || (currency !== 'XOF' && earning >= 2);
      });

      for (const product of highValueProducts) {
        const comm = product.organizations?.affiliation_commission_percent || 10;
        const earning = Math.round((product.price || 0) * comm / 100);

        // Check if alert already sent for this product
        const { count: alreadyAlerted } = await db.from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('template', 'high_commission_alert')
          .ilike('metadata->>product_id', product.id);
        if ((alreadyAlerted || 0) > 0) continue;

        // Get all active ambassadors
        const { data: ambassadors } = await db.from('affiliate_links')
          .select('user_id')
          .eq('is_active', true)
          .neq('organization_id', product.organizations?.id || '')
          .limit(500);

        const uniqueIds = [...new Set((ambassadors || []).map((a: any) => a.user_id))];

        for (const userId of uniqueIds) {
          const email = await getUserEmail(userId as string);
          if (email) {
            await sendEmail({
              template: 'high_commission_alert' as any,
              to: email,
              data: {
                product_title: product.title,
                product_url: `https://siteviral.com/org/${product.organizations?.slug || ''}/p/${product.slug || ''}`,
                product_image: product.cover_image_url || '',
                commission_percent: `${comm}%`,
                earning_amount: `${earning} ${product.currency || 'XOF'}`,
                org_name: product.organizations?.name || '',
                subject: `💰 ${comm}% de commission — "${product.title}" vient d'être publié !`,
                product_id: product.id,
              },
            });
            highCommissionAlertCount++;
          }
        }
      }
    }
    results['high_commission_alerts'] = highCommissionAlertCount;

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
