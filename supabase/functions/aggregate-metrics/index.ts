import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    const dayStart = `${dateStr}T00:00:00Z`;
    const dayEnd = `${dateStr}T23:59:59Z`;

    // Get all active organizations
    const { data: orgs } = await supabase.from('organizations').select('id').eq('is_active', true);
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No active orgs' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let orgMetricsInserted = 0;

    for (const org of orgs) {
      // Donations revenue
      const { data: donations } = await supabase
        .from('donations')
        .select('amount')
        .eq('organization_id', org.id)
        .eq('status', 'completed')
        .gte('completed_at', dayStart)
        .lte('completed_at', dayEnd);

      // Product purchases revenue
      const { data: purchases } = await supabase
        .from('product_purchases')
        .select('amount')
        .eq('organization_id', org.id)
        .eq('status', 'completed')
        .gte('completed_at', dayStart)
        .lte('completed_at', dayEnd);

      // New members
      const { data: newMembers } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.id)
        .gte('joined_at', dayStart)
        .lte('joined_at', dayEnd);

      // Affiliate sales
      const { data: affSales } = await supabase
        .from('affiliate_sales')
        .select('commission_amount')
        .eq('organization_id', org.id)
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      const donationRevenue = (donations || []).reduce((s, d) => s + (d.amount || 0), 0);
      const purchaseRevenue = (purchases || []).reduce((s, p) => s + (p.amount || 0), 0);
      const totalRevenue = donationRevenue + purchaseRevenue;
      const txCount = (donations?.length || 0) + (purchases?.length || 0);
      const affiliateCommission = (affSales || []).reduce((s, a) => s + (a.commission_amount || 0), 0);

      // Upsert
      await supabase.from('org_daily_metrics').upsert({
        organization_id: org.id,
        metric_date: dateStr,
        revenue: totalRevenue,
        transactions_count: txCount,
        new_members: newMembers?.length || 0,
        affiliate_sales_count: affSales?.length || 0,
        affiliate_commission_total: affiliateCommission,
        products_sold: purchases?.length || 0,
        donations_count: donations?.length || 0,
      }, { onConflict: 'organization_id,metric_date' });

      orgMetricsInserted++;
    }

    // Platform-level metrics
    const { data: allDonations } = await supabase
      .from('donations')
      .select('amount, platform_fee')
      .eq('status', 'completed')
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd);

    const { data: allPurchases } = await supabase
      .from('product_purchases')
      .select('amount, platform_fee')
      .eq('status', 'completed')
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd);

    const { data: newOrgs } = await supabase
      .from('organizations')
      .select('id')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd);

    const totalGMV = [...(allDonations || []), ...(allPurchases || [])].reduce((s, t) => s + (t.amount || 0), 0);
    const totalPlatformFees = [...(allDonations || []), ...(allPurchases || [])].reduce((s, t) => s + (t.platform_fee || 0), 0);
    const totalTx = (allDonations?.length || 0) + (allPurchases?.length || 0);

    // Count active affiliates
    const { count: activeAffiliates } = await supabase
      .from('affiliate_links')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Count new users for the day
    const { count: newUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd);

    // ── K-Factor calculation ──
    // K = (total affiliate clicks × conversion rate) / total active users
    let kFactor = 0;
    try {
      const { data: affLinks } = await supabase
        .from('affiliate_links')
        .select('clicks, conversions')
        .eq('is_active', true);
      const totalClicks = (affLinks || []).reduce((s: number, l: any) => s + (l.clicks || 0), 0);
      const totalConversions = (affLinks || []).reduce((s: number, l: any) => s + (l.conversions || 0), 0);
      const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
      const { count: totalActiveUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (totalActiveUsers && totalActiveUsers > 0) {
        kFactor = parseFloat(((totalClicks * conversionRate) / totalActiveUsers).toFixed(3));
      }
    } catch (kErr) {
      console.warn('K-Factor calculation error:', kErr);
    }

    await supabase.from('platform_metrics_daily').upsert({
      metric_date: dateStr,
      total_revenue: totalGMV,
      platform_fees: totalPlatformFees,
      total_transactions: totalTx,
      active_orgs: orgs.length,
      new_orgs: newOrgs?.length || 0,
      new_users: newUsersCount || 0,
      active_affiliates: activeAffiliates || 0,
      gmv: totalGMV,
      k_factor: kFactor,
    }, { onConflict: 'metric_date' });

    return new Response(
      JSON.stringify({ ok: true, date: dateStr, orgs_processed: orgMetricsInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Aggregate metrics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
