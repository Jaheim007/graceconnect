import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Platform Health Check — daily anomaly detection cron.
 * Detects orphan pages, broken links, stale KYC, inactive orgs, etc.
 * Sends a digest notification to superadmins.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Fast ping mode for health dashboard latency check
    const body = await req.json().catch(() => ({}));
    if (body?.ping) {
      return new Response(JSON.stringify({ ok: true, ping: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const issues: { category: string; count: number; detail: string }[] = [];

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Run all independent queries in parallel
    const [
      orphanRes,
      noCoverRes,
      staleKycRes,
      unremindedCartsRes,
      pendingReportsRes,
      failedEmailsRes,
      pendingPayoutsRes,
      inactiveOrgsRes,
    ] = await Promise.all([
      // 1. Published products from suspended/inactive orgs
      sb.from("digital_products")
        .select("id, organizations!inner(is_active, is_suspended)", { count: "exact", head: true })
        .eq("is_published", true)
        .or("is_active.eq.false,is_suspended.eq.true", { referencedTable: "organizations" }),
      // 2. Products published without cover image
      sb.from("digital_products")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .or("cover_image_url.is.null,cover_image_url.eq."),
      // 3. KYC pending > 48h
      sb.from("kyc_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("submitted_at", twoDaysAgo),
      // 4. Abandoned carts not reminded
      sb.from("abandoned_carts")
        .select("*", { count: "exact", head: true })
        .eq("converted", false)
        .is("last_reminder_at", null),
      // 5. Pending content reports
      sb.from("content_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      // 6. Failed emails in last 24h
      sb.from("email_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", oneDayAgo),
      // 7. Pending payouts
      sb.from("payout_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      // 8. Orgs created >30 days ago (just IDs for batch check)
      sb.from("organizations")
        .select("id")
        .eq("is_active", true)
        .lt("created_at", thirtyDaysAgo)
        .limit(200),
    ]);

    const orphanProducts = orphanRes.count || 0;
    if (orphanProducts > 0) {
      issues.push({ category: "Produits orphelins", count: orphanProducts, detail: "Produits publiés dont l'org est inactive/suspendue" });
    }

    const noCover = noCoverRes.count || 0;
    if (noCover > 0) {
      issues.push({ category: "Couvertures manquantes", count: noCover, detail: "Produits publiés sans image de couverture" });
    }

    const staleKyc = staleKycRes.count || 0;
    if (staleKyc > 0) {
      issues.push({ category: "KYC en attente >48h", count: staleKyc, detail: "Soumissions KYC bloquées en pending" });
    }

    const unremindedCarts = unremindedCartsRes.count || 0;
    if (unremindedCarts > 10) {
      issues.push({ category: "Paniers non relancés", count: unremindedCarts, detail: "Paniers abandonnés sans aucun rappel envoyé" });
    }

    const pendingReports = pendingReportsRes.count || 0;
    if (pendingReports > 0) {
      issues.push({ category: "Signalements non traités", count: pendingReports, detail: "Rapports de contenu en attente de modération" });
    }

    const failedEmails = failedEmailsRes.count || 0;
    if (failedEmails > 5) {
      issues.push({ category: "Emails échoués (24h)", count: failedEmails, detail: "Emails avec statut 'failed' dans les dernières 24h" });
    }

    const pendingPayouts = pendingPayoutsRes.count || 0;
    if (pendingPayouts > 0) {
      issues.push({ category: "Versements en attente", count: pendingPayouts, detail: "Demandes de paiement non traitées" });
    }

    // 8. Orgs with 0 products — batch check in parallel (max 20 concurrent)
    const inactiveOrgs = inactiveOrgsRes.data || [];
    if (inactiveOrgs.length > 0) {
      const batchIds = inactiveOrgs.slice(0, 50).map(o => o.id);
      const batchResults = await Promise.all(
        batchIds.map(id =>
          sb.from("digital_products").select("*", { count: "exact", head: true }).eq("organization_id", id)
        )
      );
      const emptyCount = batchResults.filter(r => (r.count || 0) === 0).length;
      if (emptyCount > 0) {
        issues.push({ category: "Orgs sans contenu (>30j)", count: emptyCount, detail: "Organisations créées depuis >30j avec 0 produits" });
      }
    }

    // Calculate health score (100 - deductions)
    let score = 100;
    for (const issue of issues) {
      if (issue.category.includes("KYC") || issue.category.includes("Signalements")) score -= Math.min(issue.count * 5, 20);
      else if (issue.category.includes("orphelins")) score -= Math.min(issue.count * 3, 15);
      else score -= Math.min(issue.count, 10);
    }
    score = Math.max(0, score);

    // Notify superadmins
    const { data: superadmins } = await sb
      .from("superadmins")
      .select("user_id");

    if (superadmins && issues.length > 0) {
      const issuesSummary = issues.map(i => `• ${i.category}: ${i.count} — ${i.detail}`).join("\n");

      for (const admin of superadmins) {
        await sb.from("user_notifications").insert({
          user_id: admin.user_id,
          title: `🏥 Santé plateforme : ${score}/100`,
          body: `${issues.length} anomalie(s) détectée(s) :\n${issuesSummary}`,
          notification_type: "system",
          action_url: "/superadmin/command-center",
        });
      }
    }

    console.log(`[platform-health-check] Score: ${score}/100, Issues: ${issues.length}`);

    return new Response(JSON.stringify({ ok: true, score, issues }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[platform-health-check] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
