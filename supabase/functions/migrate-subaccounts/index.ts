import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

/**
 * migrate-subaccounts: One-time migration to create Paystack subaccounts
 * for existing organizations that don't have one yet.
 * 
 * Superadmin only. Processes in batches of 10.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth: superadmin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleRow?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let body: { batch_size?: number; dry_run?: boolean } = {};
    try { body = await req.json(); } catch { /* defaults */ }
    const batchSize = Math.min(body.batch_size || 10, 50);
    const dryRun = body.dry_run ?? false;

    // Find orgs without subaccounts that have KYC approved (bank details)
    const { data: orgs } = await db.from('organizations')
      .select('id, name, slug, country_code, owner_id')
      .is('paystack_subaccount_code', null)
      .eq('is_active', true)
      .limit(batchSize);

    if (!orgs?.length) {
      return new Response(JSON.stringify({ ok: true, message: 'All active organizations already have subaccounts', migrated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: Array<{ org_id: string; name: string; status: string; subaccount_code?: string; error?: string }> = [];

    for (const org of orgs) {
      try {
        // Get KYC/bank details
        const { data: kyc } = await db.from('kyc_submissions')
          .select('bank_account_name, bank_account_number, bank_name')
          .eq('organization_id', org.id)
          .eq('status', 'approved')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!kyc?.bank_account_number || !kyc?.bank_name) {
          results.push({ org_id: org.id, name: org.name, status: 'skipped', error: 'No approved KYC with bank details' });
          continue;
        }

        if (dryRun) {
          results.push({ org_id: org.id, name: org.name, status: 'dry_run_ok' });
          continue;
        }

        // Create Paystack subaccount
        const psRes = await fetch('https://api.paystack.co/subaccount', {
          method: 'POST',
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: org.name,
            settlement_bank: kyc.bank_name,
            account_number: kyc.bank_account_number,
            percentage_charge: 0, // We use transaction_charge (flat fee) instead
            settlement_schedule: 'manual',
            primary_contact_email: null, // Will be set by Paystack from bank details
          }),
        });
        const psData = await psRes.json();

        if (!psData.status || !psData.data?.subaccount_code) {
          results.push({ org_id: org.id, name: org.name, status: 'failed', error: psData.message || 'Paystack API error' });
          continue;
        }

        // Update org with subaccount code
        await db.from('organizations').update({
          paystack_subaccount_code: psData.data.subaccount_code,
        }).eq('id', org.id);

        // Audit log
        await db.from('audit_logs').insert({
          organization_id: org.id,
          user_id: user.id,
          action: 'subaccount_migrated',
          resource_type: 'organization',
          resource_id: org.id,
          metadata: { subaccount_code: psData.data.subaccount_code, migration: true },
        });

        results.push({ org_id: org.id, name: org.name, status: 'migrated', subaccount_code: psData.data.subaccount_code });
      } catch (err) {
        results.push({ org_id: org.id, name: org.name, status: 'error', error: String(err) });
      }
    }

    const migrated = results.filter(r => r.status === 'migrated').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;

    return new Response(JSON.stringify({
      ok: true,
      migrated,
      skipped,
      failed,
      total_processed: results.length,
      details: results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('migrate-subaccounts error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
