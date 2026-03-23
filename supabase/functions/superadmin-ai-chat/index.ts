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
    const [orgsRes, donationsRes, purchasesRes, membersRes, metricsRes, kycRes, payoutsRes, reportsRes, affiliateRes, partnersRes, productsRes, usersRes, creditRes, eventsRes] = await Promise.all([
      svcClient.from('organizations').select('id, name, plan_type, kyc_status, is_active, is_suspended, category, country, created_at', { count: 'exact' }),
      svcClient.from('donations').select('amount, status, currency, donor_name, donor_email, organization_id, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(500),
      svcClient.from('product_purchases').select('amount, status, currency, buyer_name, buyer_email, product_id, organization_id, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(500),
      svcClient.from('organization_members').select('id, organization_id, role', { count: 'exact' }),
      svcClient.from('platform_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(30),
      svcClient.from('kyc_submissions').select('id, status, organization_id, verification_type, submitted_at, reviewed_at, ai_confidence_score, bank_account_name').order('submitted_at', { ascending: false }).limit(500),
      svcClient.from('payout_requests').select('id, status, amount, currency, organization_id, created_at, payout_type, reviewed_at, paid_at').order('created_at', { ascending: false }).limit(100),
      svcClient.from('content_reports').select('status, content_type, reason, created_at').eq('status', 'pending'),
      svcClient.from('affiliate_sales').select('id, status, commission_amount, gross_amount, currency, affiliate_user_id, organization_id, created_at', { count: 'exact' }),
      svcClient.from('partners').select('id, full_name, status, created_at'),
      svcClient.from('digital_products').select('id, title, organization_id, is_published, sales_count, price, currency, product_type, created_at', { count: 'exact' }),
      svcClient.from('profiles').select('id, full_name, created_at', { count: 'exact' }),
      svcClient.from('credit_transactions').select('amount, tx_type, action_key, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(100),
      svcClient.from('client_events').select('event_name, created_at', { count: 'exact', head: true }),
    ]);

    const orgs = orgsRes.data || [];
    const donations = donationsRes.data || [];
    const purchases = purchasesRes.data || [];
    const kycList = kycRes.data || [];
    const payoutList = payoutsRes.data || [];
    const products = productsRes.data || [];
    const affiliateSales = affiliateRes.data || [];
    const creditTxs = creditRes.data || [];

    // --- Compute executive metrics ---
    const totalDonations = donations.reduce((s, d: any) => s + (d.amount || 0), 0);
    const totalPurchases = purchases.reduce((s, p: any) => s + (p.amount || 0), 0);
    const totalGMV = totalDonations + totalPurchases;
    const totalAffiliateCommissions = affiliateSales.reduce((s, a: any) => s + (a.commission_amount || 0), 0);
    const totalAffiliateGross = affiliateSales.reduce((s, a: any) => s + (a.gross_amount || 0), 0);

    // Revenue by org
    const revenueByOrg: Record<string, { name: string; donations: number; purchases: number; total: number }> = {};
    const orgNameMap: Record<string, string> = {};
    orgs.forEach((o: any) => { orgNameMap[o.id] = o.name; });

    donations.forEach((d: any) => {
      const orgId = d.organization_id;
      if (!orgId) return;
      if (!revenueByOrg[orgId]) revenueByOrg[orgId] = { name: orgNameMap[orgId] || orgId, donations: 0, purchases: 0, total: 0 };
      revenueByOrg[orgId].donations += d.amount || 0;
      revenueByOrg[orgId].total += d.amount || 0;
    });
    purchases.forEach((p: any) => {
      const orgId = p.organization_id;
      if (!orgId) return;
      if (!revenueByOrg[orgId]) revenueByOrg[orgId] = { name: orgNameMap[orgId] || orgId, donations: 0, purchases: 0, total: 0 };
      revenueByOrg[orgId].purchases += p.amount || 0;
      revenueByOrg[orgId].total += p.amount || 0;
    });

    const topOrgsByRevenue = Object.values(revenueByOrg)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map((o, i) => `  ${i + 1}. **${o.name}** — ${o.total.toLocaleString()} FCFA (Dons: ${o.donations.toLocaleString()}, Ventes: ${o.purchases.toLocaleString()})`)
      .join('\n');

    // Top products
    const topProducts = products
      .filter((p: any) => (p.sales_count || 0) > 0)
      .sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 10)
      .map((p: any, i: number) => `  ${i + 1}. "${p.title}" — ${p.sales_count} ventes, ${p.price || 0} ${p.currency || 'XOF'} (${orgNameMap[p.organization_id] || 'N/A'})`)
      .join('\n');

    // Org categories
    const orgsByCategory: Record<string, number> = {};
    const orgsByCountry: Record<string, number> = {};
    const orgsByPlan: Record<string, number> = {};
    orgs.forEach((o: any) => {
      orgsByCategory[o.category || 'unknown'] = (orgsByCategory[o.category || 'unknown'] || 0) + 1;
      orgsByCountry[o.country || 'unknown'] = (orgsByCountry[o.country || 'unknown'] || 0) + 1;
      orgsByPlan[o.plan_type || 'free'] = (orgsByPlan[o.plan_type || 'free'] || 0) + 1;
    });

    // KYC details
    const kycPending = kycList.filter((k: any) => k.status === 'pending');
    const kycApproved = kycList.filter((k: any) => k.status === 'approved');
    const kycRejected = kycList.filter((k: any) => k.status === 'rejected');

    const kycDetail = kycList.slice(0, 30).map((k: any) => {
      const orgName = orgNameMap[k.organization_id] || k.organization_id;
      const name = k.bank_account_name || orgName;
      const aiScore = k.ai_confidence_score ? ` | Score IA: ${k.ai_confidence_score}%` : '';
      return `  - **${name}** | Statut: ${k.status} | Type: ${k.verification_type || 'N/A'} | Org: ${orgName} | Date: ${k.submitted_at?.slice(0, 10)}${aiScore}`;
    }).join('\n');

    // Payout details
    const payoutPending = payoutList.filter((p: any) => p.status === 'pending' || p.status === 'approved');
    const payoutCompleted = payoutList.filter((p: any) => p.status === 'completed' || p.status === 'paid');
    const payoutTotalPending = payoutPending.reduce((s, p: any) => s + (p.amount || 0), 0);

    const payoutDetail = payoutList.slice(0, 20).map((p: any) => `  - ${(p.amount || 0).toLocaleString()} ${p.currency || 'XOF'} | Statut: **${p.status}** | Type: ${p.payout_type || 'org'} | Org: ${orgNameMap[p.organization_id] || p.organization_id} | Date: ${p.created_at?.slice(0, 10)}`).join('\n');

    // Org details (all)
    const orgDetail = orgs.map((o: any) => `  - **${o.name}** | Plan: ${o.plan_type} | KYC: ${o.kyc_status || 'none'} | Actif: ${o.is_active ? '✅' : '❌'} | Suspendu: ${o.is_suspended ? '⚠️' : 'Non'} | Pays: ${o.country || 'N/A'} | Créé: ${o.created_at?.slice(0, 10)}`).join('\n');

    // Recent user signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentUsers = (usersRes.data || []).filter((u: any) => u.created_at >= sevenDaysAgo);

    // Credit system summary
    const creditDebits = creditTxs.filter((t: any) => t.tx_type === 'debit');
    const creditCredits = creditTxs.filter((t: any) => t.tx_type === 'credit');

    // Metrics trend
    const metricsData = metricsRes.data || [];
    const metricsSummary = metricsData.slice(0, 7).map((m: any) =>
      `  - ${m.metric_date}: Utilisateurs actifs: ${m.active_users || 'N/A'}, Revenus: ${m.total_revenue || 'N/A'}, Nouvelles orgs: ${m.new_organizations || 'N/A'}`
    ).join('\n');

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `Tu es **SiteViral AI**, l'assistant stratégique exclusif du Superadmin de la plateforme SiteViral. Tu fournis des analyses de niveau exécutif (CEO/CFO) avec des données précises et actionnables.

📅 Date actuelle : ${today}

═══════════════════════════════════════════
📊 TABLEAU DE BORD EXÉCUTIF — DONNÉES TEMPS RÉEL
═══════════════════════════════════════════

## 🏢 ORGANISATIONS (${orgs.length} total)
- Actives : ${orgs.filter((o: any) => o.is_active && !o.is_suspended).length}
- Suspendues : ${orgs.filter((o: any) => o.is_suspended).length}
- Par plan : ${JSON.stringify(orgsByPlan)}
- Par catégorie : ${JSON.stringify(orgsByCategory)}
- Par pays : ${JSON.stringify(orgsByCountry)}

### Détail des organisations :
${orgDetail || '  Aucune organisation'}

## 👥 UTILISATEURS
- Total inscrits : ${usersRes.count || 0}
- Membres d'organisations : ${membersRes.count || 0}
- Nouveaux cette semaine : ${recentUsers.length}
- Événements tracés : ${eventsRes.count || 0}

## 💰 FINANCES & REVENUS
- **GMV Total** : ${totalGMV.toLocaleString()} FCFA
  - Dons : ${totalDonations.toLocaleString()} FCFA (${donations.length} transactions)
  - Ventes produits : ${totalPurchases.toLocaleString()} FCFA (${purchases.length} transactions)
- **Programme Affiliés** : ${affiliateSales.length} ventes, ${totalAffiliateGross.toLocaleString()} FCFA brut, ${totalAffiliateCommissions.toLocaleString()} FCFA commissions
- **Crédits IA** : ${creditTxs.length} transactions récentes (${creditDebits.length} débits, ${creditCredits.length} crédits)

### 🏆 Top Organisations par Revenus :
${topOrgsByRevenue || '  Aucune donnée de revenus'}

### 🛍️ Top Produits par Ventes :
${topProducts || '  Aucun produit vendu'}

## ✅ KYC — VÉRIFICATIONS D'IDENTITÉ (${kycList.length} total)
- En attente : **${kycPending.length}**
- Approuvées : **${kycApproved.length}**
- Rejetées : **${kycRejected.length}**

### Détails KYC :
${kycDetail || '  Aucune soumission'}

## 💸 PAYOUTS — DEMANDES DE RETRAIT (${payoutList.length} total)
- En attente/approuvés : **${payoutPending.length}** (${payoutTotalPending.toLocaleString()} FCFA)
- Complétés : **${payoutCompleted.length}**

### Détails Payouts :
${payoutDetail || '  Aucune demande'}

## 🤝 PARTENAIRES
- Total : ${(partnersRes.data || []).length}
- Approuvés : ${(partnersRes.data || []).filter((p: any) => p.status === 'approved').length}
- En attente : ${(partnersRes.data || []).filter((p: any) => p.status === 'pending').length}

## 📦 PRODUITS NUMÉRIQUES
- Total créés : ${productsRes.count || 0}
- Publiés : ${products.filter((p: any) => p.is_published).length}
- Types : ${JSON.stringify(products.reduce((acc: any, p: any) => { acc[p.product_type || 'unknown'] = (acc[p.product_type || 'unknown'] || 0) + 1; return acc; }, {}))}

## 🚨 SIGNALEMENTS DE CONTENU
- En attente de modération : **${(reportsRes.data || []).length}**

## 📈 MÉTRIQUES RÉCENTES (7 derniers jours) :
${metricsSummary || '  Aucune métrique disponible'}

═══════════════════════════════════════════
📋 INSTRUCTIONS POUR L'ASSISTANT
═══════════════════════════════════════════

1. **Tu es au service exclusif du Superadmin.** Fournis TOUTES les informations demandées sans aucune restriction : noms, emails, montants, statuts, scores IA, détails bancaires, etc.
2. **Réponds en français**, de manière concise, structurée et actionnable.
3. **Utilise le formatage Markdown** : titres, listes, tableaux, gras pour les chiffres clés.
4. **Fournis des insights proactifs** : tendances, alertes, recommandations stratégiques.
5. **Si une donnée n'est pas dans le contexte**, dis-le clairement — n'invente jamais.
6. **Pour les analyses**, structure tes réponses : Constat → Analyse → Recommandation.
7. **Utilise des emojis** pour la lisibilité (✅ ❌ ⚠️ 📊 💰 etc.)`;

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
