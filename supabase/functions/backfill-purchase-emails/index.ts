import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Auth check — superadmin only
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const anonDb = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '');
    const { data: { user } } = await anonDb.auth.getUser(token);
    if (user) {
      const { data: role } = await db.from('user_platform_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (role?.role !== 'superadmin') {
        return new Response(JSON.stringify({ error: 'Superadmin only' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = body.batch_size || 10;
  const delayMs = body.delay_ms || 3000; // 3s between emails to avoid rate limits
  const dryRun = body.dry_run || false;

  // Get all completed product purchases with buyer info
  const { data: purchases, error } = await db
    .from('product_purchases')
    .select(`
      id, amount, currency, paystack_reference, completed_at, user_id,
      digital_products(id, title, organization_id, organizations(name))
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: { sent: number; skipped: number; failed: number; errors: string[] } = {
    sent: 0, skipped: 0, failed: 0, errors: [],
  };

  // Process in batches
  for (let i = 0; i < (purchases || []).length; i++) {
    const purchase = purchases![i] as any;
    const product = purchase.digital_products;
    const org = product?.organizations;

    if (!product || !org) {
      results.skipped++;
      continue;
    }

    // Get buyer email
    let buyerEmail: string | null = null;
    if (purchase.user_id) {
      try {
        const { data: { user } } = await db.auth.admin.getUserById(purchase.user_id);
        buyerEmail = user?.email || null;
      } catch { /* skip */ }
    }

    if (!buyerEmail) {
      results.skipped++;
      continue;
    }

    // Check if we already sent this specific backfill email (idempotency via email_logs)
    const { data: alreadySent } = await db.from('email_logs')
      .select('id')
      .eq('recipient', buyerEmail)
      .eq('template', 'purchase_confirmation')
      .ilike('metadata->>reference', purchase.paystack_reference || '')
      .maybeSingle();

    if (alreadySent) {
      results.skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would send to ${buyerEmail}: ${product.title}`);
      results.sent++;
      continue;
    }

    // Send email via the send-email function
    try {
      const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          template: 'purchase_confirmation',
          to: buyerEmail,
          data: {
            product_name: product.title,
            org_name: org.name,
            amount: purchase.amount || 0,
            currency: purchase.currency || 'XOF',
            reference: purchase.paystack_reference || purchase.id,
            access_link: 'https://siteviral.com/resources',
          },
          organization_id: product.organization_id,
        }),
      });

      const emailResult = await emailRes.json();
      if (emailResult.ok || emailRes.ok) {
        results.sent++;
        console.log(`[backfill] ✅ Sent to ${buyerEmail} for "${product.title}"`);
      } else {
        results.failed++;
        results.errors.push(`${buyerEmail}: ${emailResult.error || 'Unknown error'}`);
        console.error(`[backfill] ❌ Failed for ${buyerEmail}:`, emailResult.error);
      }
    } catch (err) {
      results.failed++;
      results.errors.push(`${buyerEmail}: ${String(err)}`);
    }

    // Rate limit: wait between sends
    if (i < purchases!.length - 1 && !dryRun) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[backfill] Complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);

  return new Response(JSON.stringify({
    ok: true,
    total_purchases: purchases?.length || 0,
    ...results,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
