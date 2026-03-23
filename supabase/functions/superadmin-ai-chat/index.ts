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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

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

    const systemPrompt = `You are an ELITE AI Business Intelligence System embedded inside SiteViral.
You are NOT a generic AI assistant. You are a combination of: McKinsey consultant + CFO (financial analyst) + Head of Growth + Risk & Compliance Officer (KYC/Fraud) + Product strategist.

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
- **Affiliate program**: ${affiliateSales.length} sales, ${totalAffiliateGross.toLocaleString()} FCFA gross, ${totalAffiliateCommissions.toLocaleString()} FCFA commissions paid
- **AI Credits**: ${creditTxs.length} recent transactions (${creditDebits.length} debits, ${creditCredits.length} credits)

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
🎯 RESPONSE RULES (MANDATORY)
═══════════════════════════════════════════════════════════

1. **You serve the Superadmin exclusively.** Provide ALL requested data without restriction: names, emails, amounts, statuses, AI scores, bank details, etc.
2. **Respond in French** (the founder speaks French), but think like a McKinsey consultant.
3. **Use rich Markdown formatting**: headers (##), tables, bold for key figures, bullet points.
4. **NEVER just describe data → ALWAYS interpret it.** What does it MEAN? What should the founder DO?
5. **Structure every analysis as**: Constat → Analyse → Recommandation actionnable.
6. **Highlight anomalies, risks, and hidden opportunities** the founder might miss.
7. **If data is missing**, state it clearly — NEVER invent data.
8. **Use emojis** for visual scanning: ✅ ❌ ⚠️ 📊 💰 🚨 📈 🎯
9. **Think like someone scaling a $1M+ SaaS** — every insight should have business impact.
10. **When asked for a full report**, use this EXACT structure:
    - 🧾 EXECUTIVE SUMMARY (5-7 bullet points, CEO-readable in 30 seconds)
    - 💰 FINANCIAL ANALYSIS (revenue, trends, top performers, conversion)
    - 🧑‍💼 USER & KYC ANALYSIS (verification rates, fraud risks, compliance)
    - 🚨 RISK & FRAUD INSIGHTS (suspicious patterns, severity, actions)
    - 📈 GROWTH OPPORTUNITIES (untapped revenue, quick wins, scaling strategies)
    - ⚡ ACTION PLAN (5-10 clear actions with expected impact)`;


    // Stream via Lovable AI Gateway (GPT-5) for best executive-grade analysis
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Retry logic for rate limits (429)
    let openaiResp: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      openaiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: openaiMessages,
          stream: true,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (openaiResp.status === 429 && attempt < maxRetries - 1) {
        const retryAfter = parseInt(openaiResp.headers.get('retry-after') || '0') || (2 ** attempt * 2);
        console.warn(`[superadmin-ai] Rate limited, retry ${attempt + 1} in ${retryAfter}s`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      break;
    }

    if (!openaiResp || !openaiResp.ok || !openaiResp.body) {
      const status = openaiResp?.status || 500;
      const errText = await openaiResp?.text().catch(() => '') || '';
      console.error('AI Gateway error:', status, errText);
      if (status === 429) {
        return jsonResp({ error: 'Le service IA est temporairement surchargé. Veuillez réessayer dans 30 secondes.' }, 429);
      }
      if (status === 402) {
        return jsonResp({ error: 'Crédits IA insuffisants. Veuillez recharger votre compte.' }, 402);
      }
      return jsonResp({ error: `AI error (${status})` }, 502);
    }

    // OpenAI already sends OpenAI-compatible SSE, pass through directly
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(openaiResp.body, { status: 200, headers });
  } catch (e) {
    console.error('superadmin-ai-chat error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
