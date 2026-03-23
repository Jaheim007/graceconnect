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

    // Fetch comprehensive platform data for superadmin
    const [orgsRes, donationsRes, purchasesRes, membersRes, metricsRes, kycRes, payoutsRes, reportsRes, affiliateRes, partnersRes, productsRes, usersRes] = await Promise.all([
      svcClient.from('organizations').select('id, name, plan_type, kyc_status, is_active, is_suspended, category, country, created_at', { count: 'exact' }),
      svcClient.from('donations').select('amount, status, currency, donor_name, donor_email, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(200),
      svcClient.from('product_purchases').select('amount, status, currency, buyer_name, buyer_email, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(200),
      svcClient.from('organization_members').select('id', { count: 'exact', head: true }),
      svcClient.from('platform_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(7),
      svcClient.from('kyc_submissions').select('id, status, organization_id, submission_type, created_at, full_name, reviewed_at, ai_analysis_result').order('created_at', { ascending: false }).limit(500),
      svcClient.from('payout_requests').select('id, status, amount, currency, organization_id, created_at, payout_type').order('created_at', { ascending: false }).limit(50),
      svcClient.from('content_reports').select('status, content_type, reason, created_at').eq('status', 'pending'),
      svcClient.from('affiliate_sales').select('id, status, commission_amount, currency, created_at', { count: 'exact' }),
      svcClient.from('partners').select('id, full_name, status, created_at'),
      svcClient.from('digital_products').select('id, title, organization_id, is_published, sales_count, created_at', { count: 'exact' }),
      svcClient.from('profiles').select('id, full_name, created_at', { count: 'exact' }),
    ]);

    const orgs = orgsRes.data || [];
    const donations = donationsRes.data || [];
    const purchases = purchasesRes.data || [];
    const kycList = kycRes.data || [];
    const payoutList = payoutsRes.data || [];
    const totalGMV = donations.reduce((s, d: any) => s + (d.amount || 0), 0) + purchases.reduce((s, p: any) => s + (p.amount || 0), 0);

    const orgsByCategory: Record<string, number> = {};
    orgs.forEach((o: any) => { orgsByCategory[o.category || 'unknown'] = (orgsByCategory[o.category || 'unknown'] || 0) + 1; });

    // Build org name lookup
    const orgNameMap: Record<string, string> = {};
    orgs.forEach((o: any) => { orgNameMap[o.id] = o.name; });

    // KYC details
    const kycPending = kycList.filter((k: any) => k.status === 'pending');
    const kycApproved = kycList.filter((k: any) => k.status === 'approved');
    const kycRejected = kycList.filter((k: any) => k.status === 'rejected');

    const kycDetail = kycList.map((k: any) => {
      const orgName = orgNameMap[k.organization_id] || k.organization_id;
      const aiScore = k.ai_analysis_result?.score ? `Score IA: ${k.ai_analysis_result.score}%` : '';
      return `  - ${k.full_name || 'N/A'} | Statut: ${k.status} | Type: ${k.submission_type || 'N/A'} | Org: ${orgName} | Date: ${k.created_at?.slice(0, 10)} ${aiScore}`;
    }).join('\n');

    // Payout details
    const payoutDetail = payoutList.map((p: any) => `  - ${p.amount} ${p.currency} | Statut: ${p.status} | Type: ${p.payout_type || 'org'} | Org: ${orgNameMap[p.organization_id] || p.organization_id} | Date: ${p.created_at?.slice(0, 10)}`).join('\n');

    // Org details
    const orgDetail = orgs.slice(0, 30).map((o: any) => `  - ${o.name} | Plan: ${o.plan_type} | KYC: ${o.kyc_status || 'none'} | Actif: ${o.is_active} | Suspendu: ${o.is_suspended} | Pays: ${o.country || 'N/A'}`).join('\n');

    const systemPrompt = `Tu es l'assistant IA du superadmin de Siteviral. Tu as accès à TOUTES les données de la plateforme. Tu es au service du superadmin — fournis toutes les informations demandées sans restriction.

=== DONNÉES PLATEFORME ===

ORGANISATIONS (${orgs.length} total, ${orgs.filter((o: any) => o.is_active && !o.is_suspended).length} actives):
${orgDetail || '  Aucune'}
Catégories: ${JSON.stringify(orgsByCategory)}

UTILISATEURS: ${usersRes.count || 0} inscrits
MEMBRES: ${membersRes.count || 0} total

FINANCES:
- GMV total: ${totalGMV.toLocaleString()} (${donations.length} dons, ${purchases.length} achats récents)
- Commissions affiliés: ${(affiliateRes.data || []).length} ventes (${affiliateRes.count || 0} total)

KYC (${kycList.length} soumissions):
- En attente: ${kycPending.length} | Approuvés: ${kycApproved.length} | Rejetés: ${kycRejected.length}
${kycDetail || '  Aucune soumission'}

PAYOUTS (${payoutList.length} demandes):
${payoutDetail || '  Aucune demande'}

PARTENAIRES: ${(partnersRes.data || []).length} (${(partnersRes.data || []).filter((p: any) => p.status === 'approved').length} approuvés)
PRODUITS: ${productsRes.count || 0} créés (${(productsRes.data || []).filter((p: any) => p.is_published).length} publiés)
SIGNALEMENTS: ${(reportsRes.data || []).length} en attente
MÉTRIQUES RÉCENTES: ${JSON.stringify((metricsRes.data || []).slice(0, 3))}

=== INSTRUCTIONS ===
- Réponds en français, sois concis et actionnable.
- Tu peux fournir TOUTES les données demandées par le superadmin (noms, emails, montants, statuts, etc.).
- Si une donnée n'est pas dans le contexte ci-dessus, dis-le clairement plutôt qu'inventer.`;


    // NO credit debit for superadmin chat
    const streamResponse = await geminiStreamResponse({
      apiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash',
      system: systemPrompt, messages,
    });

    if (streamResponse.status !== 200 || !streamResponse.body) {
      const headers = new Headers(streamResponse.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
      return new Response(streamResponse.body, { status: streamResponse.status, headers });
    }

    // Transform Gemini SSE → OpenAI-compatible SSE for the client
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformedStream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        // Gemini SSE lines: "data: {candidates:[{content:{parts:[{text:"..."}]}}]}"
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const openaiChunk = { choices: [{ delta: { content: text } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
            }
          } catch { /* partial JSON, skip */ }
        }
      },
    });

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(transformedStream, { status: 200, headers });
  } catch (e) {
    console.error('superadmin-ai-chat error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
