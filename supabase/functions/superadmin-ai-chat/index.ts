import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify superadmin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const svcClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await svcClient
      .from("user_platform_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Fetch platform stats for AI context
    const [orgsRes, donationsRes, purchasesRes, membersRes, metricsRes, kycRes, payoutsRes, reportsRes] = await Promise.all([
      svcClient.from("organizations").select("id, name, slug, plan_type, kyc_status, is_active, is_suspended, category, country, created_at", { count: "exact" }),
      svcClient.from("donations").select("amount, status, currency, created_at, organization_id").eq("status", "completed").order("created_at", { ascending: false }).limit(200),
      svcClient.from("product_purchases").select("amount, status, currency, created_at, organization_id").eq("status", "completed").order("created_at", { ascending: false }).limit(200),
      svcClient.from("organization_members").select("id, role, joined_at", { count: "exact" }),
      svcClient.from("platform_metrics_daily").select("*").order("metric_date", { ascending: false }).limit(30),
      svcClient.from("kyc_submissions").select("status, organization_id").eq("status", "pending"),
      svcClient.from("payout_requests").select("amount, status").eq("status", "requested"),
      svcClient.from("content_reports").select("status").eq("status", "pending"),
    ]);

    const orgs = orgsRes.data || [];
    const donations = donationsRes.data || [];
    const purchases = purchasesRes.data || [];
    const totalDonationGMV = donations.reduce((s: number, d: any) => s + (d.amount || 0), 0);
    const totalPurchaseGMV = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalGMV = totalDonationGMV + totalPurchaseGMV;
    const totalMembers = membersRes.count || 0;
    const pendingKYC = (kycRes.data || []).length;
    const pendingPayouts = (payoutsRes.data || []).length;
    const pendingReports = (reportsRes.data || []).length;

    // Org breakdown
    const orgsByCategory: Record<string, number> = {};
    const orgsByCountry: Record<string, number> = {};
    orgs.forEach((o: any) => {
      orgsByCategory[o.category || "unknown"] = (orgsByCategory[o.category || "unknown"] || 0) + 1;
      orgsByCountry[o.country || "unknown"] = (orgsByCountry[o.country || "unknown"] || 0) + 1;
    });

    const activeOrgs = orgs.filter((o: any) => o.is_active && !o.is_suspended).length;
    const suspendedOrgs = orgs.filter((o: any) => o.is_suspended).length;

    const systemPrompt = `Tu es l'assistant IA du superadmin de SiteViral / GraceConnect, une plateforme SaaS multi-tenant pour les organisations religieuses et communautaires en Afrique (principalement Côte d'Ivoire).

DONNÉES EN TEMPS RÉEL DE LA PLATEFORME :
- Total organisations: ${orgs.length} (actives: ${activeOrgs}, suspendues: ${suspendedOrgs})
- Répartition par catégorie: ${JSON.stringify(orgsByCategory)}
- Répartition par pays: ${JSON.stringify(orgsByCountry)}
- Total membres (tous orgs): ${totalMembers}
- GMV total: ${totalGMV.toLocaleString()} XOF (donations: ${totalDonationGMV.toLocaleString()}, achats: ${totalPurchaseGMV.toLocaleString()})
- Transactions: ${donations.length} dons complétés, ${purchases.length} achats complétés
- KYC en attente: ${pendingKYC}
- Payouts en attente: ${pendingPayouts}
- Signalements en attente: ${pendingReports}
- Métriques quotidiennes (30 derniers jours): ${JSON.stringify((metricsRes.data || []).slice(0, 7))}

LISTE DES ORGANISATIONS :
${orgs.slice(0, 20).map((o: any) => `- ${o.name} (${o.slug}) | ${o.category} | ${o.country} | plan:${o.plan_type} | KYC:${o.kyc_status} | ${o.is_suspended ? "SUSPENDUE" : "active"}`).join("\n")}

Tu dois :
1. Répondre en français
2. Analyser les données et fournir des insights actionnables
3. Suggérer des améliorations produit basées sur les patterns observés
4. Alerter sur les problèmes potentiels (KYC en attente, payouts, fraude)
5. Proposer des stratégies de croissance
6. Être concis et direct

Ne révèle jamais d'informations sensibles (clés API, mots de passe). Tu peux discuter de toutes les métriques business.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits AI épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("superadmin-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
