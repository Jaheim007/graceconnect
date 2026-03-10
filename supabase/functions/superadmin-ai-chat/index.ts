import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResp } from '../_shared/auth.ts';
import { geminiStreamResponse } from '../_shared/ai-gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const svcClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await svcClient.from('user_platform_roles').select('role').eq('user_id', user.id).single();
    if (roleData?.role !== 'superadmin') return jsonResp({ error: 'Forbidden' }, 403);

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length > 50) return jsonResp({ error: 'Invalid messages' }, 400);
    for (const msg of messages) {
      if (!msg || !['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string' || msg.content.length > 5000) {
        return jsonResp({ error: 'Invalid message format' }, 400);
      }
    }

    // Fetch platform stats (same as before)
    const [orgsRes, donationsRes, purchasesRes, membersRes, metricsRes, kycRes, payoutsRes, reportsRes] = await Promise.all([
      svcClient.from('organizations').select('id, plan_type, kyc_status, is_active, is_suspended, category, country', { count: 'exact' }),
      svcClient.from('donations').select('amount, status, currency').eq('status', 'completed').order('created_at', { ascending: false }).limit(200),
      svcClient.from('product_purchases').select('amount, status, currency').eq('status', 'completed').order('created_at', { ascending: false }).limit(200),
      svcClient.from('organization_members').select('id', { count: 'exact', head: true }),
      svcClient.from('platform_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(7),
      svcClient.from('kyc_submissions').select('status').eq('status', 'pending'),
      svcClient.from('payout_requests').select('status').eq('status', 'requested'),
      svcClient.from('content_reports').select('status').eq('status', 'pending'),
    ]);

    const orgs = orgsRes.data || [];
    const donations = donationsRes.data || [];
    const purchases = purchasesRes.data || [];
    const totalGMV = donations.reduce((s, d: any) => s + (d.amount || 0), 0) + purchases.reduce((s, p: any) => s + (p.amount || 0), 0);

    const orgsByCategory: Record<string, number> = {};
    orgs.forEach((o: any) => { orgsByCategory[o.category || 'unknown'] = (orgsByCategory[o.category || 'unknown'] || 0) + 1; });

    const systemPrompt = `Tu es l'assistant IA du superadmin de Siteviral (plateforme SaaS). Données agrégées :
- ${orgs.length} organisations (actives: ${orgs.filter((o: any) => o.is_active && !o.is_suspended).length})
- Catégories: ${JSON.stringify(orgsByCategory)}
- Membres: ${membersRes.count || 0}
- GMV: ${totalGMV.toLocaleString()} (${donations.length} dons, ${purchases.length} achats)
- KYC en attente: ${(kycRes.data || []).length}, Payouts: ${(payoutsRes.data || []).length}, Signalements: ${(reportsRes.data || []).length}
- Métriques: ${JSON.stringify((metricsRes.data || []).slice(0, 3))}

Réponds en français, sois concis et actionnable. Ne révèle jamais de données sensibles.`;

    // NO credit debit for superadmin chat
    const streamResponse = await geminiStreamResponse({
      apiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash',
      system: systemPrompt, messages,
    });

    // Add CORS headers to stream response
    const headers = new Headers(streamResponse.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(streamResponse.body, { status: streamResponse.status, headers });
  } catch (e) {
    console.error('superadmin-ai-chat error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
