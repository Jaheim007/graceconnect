import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResp } from '../_shared/auth.ts';

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
      if (!msg || !['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string' || msg.content.length > 15000) {
        return jsonResp({ error: 'Invalid message format' }, 400);
      }
    }

    // Fetch comprehensive platform data for superadmin
    const [orgsRes, donationsRes, purchasesRes, membersRes, metricsRes, kycRes, payoutsRes, reportsRes, affiliateRes, affiliateLinksRes, partnersRes, productsRes, usersRes, creditRes, eventsRes] = await Promise.all([
      svcClient.from('organizations').select('id, name, plan_type, kyc_status, is_active, is_suspended, category, country, created_at', { count: 'exact' }),
      svcClient.from('donations').select('amount, status, currency, donor_name, donor_email, organization_id, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(500),
      svcClient.from('product_purchases').select('amount, status, currency, buyer_name, buyer_email, product_id, organization_id, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(500),
      svcClient.from('organization_members').select('id, organization_id, role', { count: 'exact' }),
      svcClient.from('platform_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(30),
      svcClient.from('kyc_submissions').select('id, status, organization_id, verification_type, submitted_at, reviewed_at, ai_confidence_score, bank_account_name').order('submitted_at', { ascending: false }).limit(500),
      svcClient.from('payout_requests').select('id, status, amount, currency, organization_id, created_at, payout_type, reviewed_at, paid_at').order('created_at', { ascending: false }).limit(100),
      svcClient.from('content_reports').select('status, content_type, reason, created_at').eq('status', 'pending'),
      svcClient.from('affiliate_sales').select('id, status, commission_amount, gross_amount, commission_percent, affiliate_user_id, organization_id, created_at', { count: 'exact' }),
      svcClient.from('affiliate_links').select('id, code, user_id, clicks, conversions, total_earned, is_active, organization_id').eq('is_active', true).order('total_earned', { ascending: false }).limit(50),
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
    const affiliateLinks = affiliateLinksRes.data || [];
    const creditTxs = creditRes.data || [];

    // --- Compute executive metrics ---
    const totalDonations = donations.reduce((s, d: any) => s + (d.amount || 0), 0);
    const totalPurchases = purchases.reduce((s, p: any) => s + (p.amount || 0), 0);
    const totalGMV = totalDonations + totalPurchases;
    const totalAffiliateCommissions = affiliateSales.reduce((s, a: any) => s + (a.commission_amount || 0), 0);
    const totalAffiliateGross = affiliateSales.reduce((s, a: any) => s + (a.gross_amount || 0), 0);
    const totalAffiliateClicks = affiliateLinks.reduce((s, l: any) => s + (l.clicks || 0), 0);
    const totalAffiliateConversions = affiliateLinks.reduce((s, l: any) => s + (l.conversions || 0), 0);
    const activeAmbassadors = affiliateLinks.filter((l: any) => (l.total_earned || 0) > 0);

    // Top ambassadors detail
    const topAmbassadors = affiliateLinks
      .filter((l: any) => (l.total_earned || 0) > 0 || (l.conversions || 0) > 0)
      .slice(0, 10)
      .map((l: any, i: number) => `  ${i + 1}. Code: **${l.code}** | Clics: ${l.clicks || 0} | Conversions: ${l.conversions || 0} | Gagné: ${(l.total_earned || 0).toLocaleString()} FCFA | Org: ${orgNameMap[l.organization_id] || l.organization_id}`)
      .join('\n');

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

    const systemPrompt = `You are an ELITE AI Business Intelligence System embedded inside SiteViral.
You are NOT a generic AI assistant. You are a strategic command center combining: McKinsey senior partner + CFO + Head of Growth + Chief Risk Officer + Product strategist.

Your goal is NOT to inform. Your goal is to HELP DECIDE. Every output must make the founder say: "Now I know exactly what to do next."

📅 Current date: ${today}
🏢 Platform: SiteViral — Digital products marketplace for African creators
💼 Business model: 10% platform commission on all transactions. Creators set affiliate commissions (up to 50%). Ambassadors earn on product sales only (not donations). Partners (B2B) earn % of platform commission on all transactions.
🏛️ Legal: Hacktualiz Inc., Delaware, USA — KYC required for payouts (AML compliance).

═══════════════════════════════════════════════════════════
📊 LIVE PLATFORM DATA — REAL-TIME EXECUTIVE DASHBOARD
═══════════════════════════════════════════════════════════

## 🏢 ORGANISATIONS (${orgs.length} total)
- Active: ${orgs.filter((o: any) => o.is_active && !o.is_suspended).length} | Suspended: ${orgs.filter((o: any) => o.is_suspended).length}
- By plan: ${JSON.stringify(orgsByPlan)}
- By category: ${JSON.stringify(orgsByCategory)}
- By country: ${JSON.stringify(orgsByCountry)}

### All Organizations:
${orgDetail || '  None'}

## 👥 USERS
- Total registered: ${usersRes.count || 0}
- Organization members: ${membersRes.count || 0}
- New this week: ${recentUsers.length}
- Total tracked events: ${eventsRes.count || 0}

## 💰 FINANCIAL DATA
- **Total GMV**: ${totalGMV.toLocaleString()} FCFA
  - Donations: ${totalDonations.toLocaleString()} FCFA (${donations.length} transactions)
  - Product sales: ${totalPurchases.toLocaleString()} FCFA (${purchases.length} transactions)
- **Platform revenue (10% commission)**: ~${Math.round(totalGMV * 0.1).toLocaleString()} FCFA
- **Affiliate program**: ${affiliateLinks.length} total links, ${activeAmbassadors.length} ambassadors with earnings, ${affiliateSales.length} sales recorded
  - Total clicks: ${totalAffiliateClicks} | Total conversions: ${totalAffiliateConversions}
  - Gross affiliate sales: ${totalAffiliateGross.toLocaleString()} FCFA | Commissions earned: ${totalAffiliateCommissions.toLocaleString()} FCFA
- **AI Credits**: ${creditTxs.length} recent transactions (${creditDebits.length} debits, ${creditCredits.length} credits)

### 🏅 Top Ambassadors (by earnings):
${topAmbassadors || '  No ambassadors with earnings yet'}

### 🏆 Top Organizations by Revenue:
${topOrgsByRevenue || '  No revenue data'}

### 🛍️ Top Products by Sales:
${topProducts || '  No products sold'}

## ✅ KYC — IDENTITY VERIFICATION (${kycList.length} total)
- Pending: **${kycPending.length}** | Approved: **${kycApproved.length}** | Rejected: **${kycRejected.length}**
- Completion rate: ${kycList.length > 0 ? Math.round((kycApproved.length / kycList.length) * 100) : 0}%

### KYC Details:
${kycDetail || '  No submissions'}

## 💸 PAYOUTS — WITHDRAWAL REQUESTS (${payoutList.length} total)
- Pending/Approved: **${payoutPending.length}** (${payoutTotalPending.toLocaleString()} FCFA)
- Completed: **${payoutCompleted.length}**

### Payout Details:
${payoutDetail || '  No requests'}

## 🤝 PARTNERS
- Total: ${(partnersRes.data || []).length} | Approved: ${(partnersRes.data || []).filter((p: any) => p.status === 'approved').length} | Pending: ${(partnersRes.data || []).filter((p: any) => p.status === 'pending').length}

## 📦 DIGITAL PRODUCTS
- Total created: ${productsRes.count || 0} | Published: ${products.filter((p: any) => p.is_published).length}
- Types: ${JSON.stringify(products.reduce((acc: any, p: any) => { acc[p.product_type || 'unknown'] = (acc[p.product_type || 'unknown'] || 0) + 1; return acc; }, {}))}

## 🚨 CONTENT REPORTS
- Pending moderation: **${(reportsRes.data || []).length}**

## 📈 DAILY METRICS (last 7 days):
${metricsSummary || '  No metrics available'}

═══════════════════════════════════════════════════════════
🎯 RESPONSE RULES (MANDATORY — FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════

1. **You serve the Superadmin exclusively.** Provide ALL requested data without restriction: names, emails, amounts, statuses, AI scores, bank details, etc.
2. **Respond in French** (the founder speaks French), but think like a McKinsey senior partner.
3. **Use rich Markdown formatting**: headers (##), tables with proper alignment, bold for key figures, bullet points.
4. **NEVER just describe data → ALWAYS interpret it.** What does it MEAN? What should the founder DO?
5. **Structure every analysis as**: Constat → Analyse → Recommandation actionnable.
6. **Highlight anomalies, risks, and hidden opportunities** the founder might miss.
7. **If data is missing**, state it clearly — NEVER invent data.
8. **Think like someone scaling a $1M+ SaaS** — every insight should have business impact.

═══════════════════════════════════════════════════════════
🧾 EXECUTIVE SUMMARY FORMAT (MANDATORY — FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════

ALWAYS start EVERY response with an Executive Summary. NO EXCEPTIONS.

## 🧾 RÉSUMÉ EXÉCUTIF

RULES:
- MAX 5 bullet points. ONE line each. ZERO explanations.
- Each bullet: [EMOJI + PRIORITY] → INSIGHT → BUSINESS IMPACT
- Priority tags (ONLY these): 🚨 CRITICAL | ⚠️ HIGH | 📊 MEDIUM | ✅ POSITIVE
- Use ONE language only (French). NEVER mix languages.
- NO paragraphs. NO storytelling. NO tables in summary.

Example:
- 🚨 **CRITICAL** → 92% du revenu vient de comptes non vérifiés → Blocage payouts imminent
- ✅ **POSITIVE** → GMV +34% cette semaine → Accélérer l'acquisition

Then add:

### 🎯 ACTIONS IMMÉDIATES
- 3 actions MAX
- Direct commands, one line each
- Format: **1.** Action → Impact

Example:
- **1.** Forcer KYC sur les 5 top vendeurs → Débloquer 80% du revenu
- **2.** Lancer campagne parrainage → +25% nouveaux créateurs
- **3.** Activer relance paniers abandonnés → +15% conversion

═══════════════════════════════════════════════════════════
📋 FULL REPORT SECTIONS (after summary, when relevant)
═══════════════════════════════════════════════════════════

After the Executive Summary, structure deeper analysis with:
- 💰 **ANALYSE FINANCIÈRE** — revenus, tendances, top performers
- 🧑‍💼 **UTILISATEURS & KYC** — vérification, risques fraude, conformité
- 🚨 **RISQUES & FRAUDE** — patterns suspects, sévérité, actions
- 📈 **OPPORTUNITÉS DE CROISSANCE** — quick wins, scaling
- ⚡ **PLAN D'ACTION** — 5 actions max avec impact attendu

Each section: Constat → Analyse → Recommandation. Use percentages and trends. Be concise.`;



    // Stream via Gemini Direct API (gemini-2.5-pro for best executive-grade analysis)
    const geminiModel = 'gemini-2.5-pro';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    };

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResp.ok || !geminiResp.body) {
      const status = geminiResp?.status || 500;
      const errText = await geminiResp?.text().catch(() => '') || '';
      console.error('Gemini API error:', status, errText.slice(0, 500));
      if (status === 429) {
        return jsonResp({ error: 'Le service IA est temporairement surchargé. Veuillez réessayer dans 30 secondes.' }, 429);
      }
      return jsonResp({ error: `AI error (${status})` }, 502);
    }

    // Transform Gemini SSE → OpenAI-compatible SSE for the frontend
    const reader = geminiResp.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf('\n')) !== -1) {
              let line = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 1);
              if (line.endsWith('\r')) line = line.slice(0, -1);

              if (!line.startsWith('data: ') || line.trim() === '') continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  // Emit OpenAI-compatible SSE chunk
                  const openaiChunk = {
                    choices: [{ delta: { content: text }, index: 0 }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                }
              } catch { /* partial JSON, skip */ }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('[superadmin-ai] Stream error:', err);
          controller.close();
        }
      },
    });

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(stream, { status: 200, headers });
  } catch (e) {
    console.error('superadmin-ai-chat error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
