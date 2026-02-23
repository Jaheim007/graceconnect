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
    // 1. ONBOARDING DRIP EMAILS
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
    // 4. LESSON REMINDERS (enrolled but no progress in 3 days)
    // ═══════════════════════════════════════════
    let lessonReminders = 0;
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
    const { data: staleEnrollments } = await db.from('program_enrollments')
      .select('id, user_id, program_id, programs(title, organization_id)')
      .eq('status', 'active')
      .lte('created_at', threeDaysAgo)
      .limit(50);
    for (const e of staleEnrollments || []) {
      // Check if user has recent progress
      const { count } = await db.from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', e.user_id)
        .gte('created_at', threeDaysAgo);
      if ((count || 0) === 0) {
        const email = await getUserEmail(e.user_id);
        const prog = (e as any).programs;
        if (email && prog) {
          await sendEmail({ template: 'lesson_reminder' as any, to: email, data: {
            program_name: prog.title,
            program_link: `https://siteviral.com/programs/${e.program_id}`,
          }});
          lessonReminders++;
        }
      }
    }
    results['lesson_reminders'] = lessonReminders;

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
        // Count orgs and programs
        const { count: orgsCount } = await db.from('organization_members')
          .select('*', { count: 'exact', head: true }).eq('user_id', u.id);
        const { count: progsCount } = await db.from('program_enrollments')
          .select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'completed');
        await sendEmail({ template: 'anniversary_1y' as any, to: email, data: {
          name: u.display_name || '',
          orgs_count: orgsCount || 0,
          programs_count: progsCount || 0,
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
