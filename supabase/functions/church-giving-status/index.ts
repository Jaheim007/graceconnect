// Public status check for a church gift. Given a reference, returns only
// non-sensitive fields (status, amount, currency, giving_type). No donor PII.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference') || (await req.json().catch(() => ({}))).reference;
    if (!reference) return new Response(JSON.stringify({ error: 'reference required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await db
      .from('church_donations')
      .select('status, amount, currency, giving_type, completed_at, church_id')
      .eq('reference', reference)
      .maybeSingle();

    if (!data) return new Response(JSON.stringify({ status: 'unknown' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
