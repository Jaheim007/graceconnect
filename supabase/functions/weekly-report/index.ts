import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  try {
    // Gather weekly metrics
    const [
      { count: newUsers },
      { count: newOrgs },
      { count: newProducts },
      { data: salesData },
      { data: donationsData },
      { count: newAffiliates },
      { count: pendingPayouts },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('organizations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('digital_products').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).eq('is_published', true),
      db.from('product_purchases').select('amount, currency').eq('status', 'completed').gte('created_at', weekAgo),
      db.from('donations').select('amount, currency').eq('status', 'completed').gte('created_at', weekAgo),
      db.from('affiliate_links').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('payout_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'requested']),
    ]);

    const totalSales = (salesData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const totalDonations = (donationsData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const gmv = totalSales + totalDonations;

    // Get superadmins
    const { data: superadmins } = await db.from('user_platform_roles').select('user_id').eq('role', 'superadmin');

    // Collect all emails first, then send via the send-email function (which now uses batch API)
    const emailPromises = [];
    for (const sa of superadmins || []) {
      const email = await getUserEmail(sa.user_id);
      if (!email) continue;
      emailPromises.push(
        sendEmail({
          template: 'weekly_report' as any,
          to: email,
          data: {
            week_start: new Date(now.getTime() - 7 * 86400000).toLocaleDateString('fr-FR'),
            week_end: now.toLocaleDateString('fr-FR'),
            new_users: newUsers || 0,
            new_orgs: newOrgs || 0,
            new_products: newProducts || 0,
            total_sales: totalSales,
            total_donations: totalDonations,
            gmv,
            new_affiliates: newAffiliates || 0,
            sales_count: (salesData || []).length,
            donations_count: (donationsData || []).length,
            pending_payouts: pendingPayouts || 0,
          },
        })
      );
    }

    // Send all in parallel — send-email function handles batching internally
    await Promise.allSettled(emailPromises);

    return new Response(JSON.stringify({ ok: true, superadmins_notified: (superadmins || []).length, gmv }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[weekly-report]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
