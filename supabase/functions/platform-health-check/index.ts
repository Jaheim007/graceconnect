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

    const issues: { category: string; count: number; detail: string }[] = [];

    // 1. Published products from suspended/inactive orgs
    const { count: orphanProducts } = await sb
      .from("digital_products")
      .select("id, organizations!inner(is_active, is_suspended)", { count: "exact", head: true })
      .eq("is_published", true)
      .or("is_active.eq.false,is_suspended.eq.true", { referencedTable: "organizations" });
    if ((orphanProducts || 0) > 0) {
      issues.push({ category: "Produits orphelins", count: orphanProducts || 0, detail: "Produits publiés dont l'org est inactive/suspendue" });
    }

    // 2. Products published without cover image
    const { count: noCover } = await sb
      .from("digital_products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .or("cover_image_url.is.null,cover_image_url.eq.");
    if ((noCover || 0) > 0) {
      issues.push({ category: "Couvertures manquantes", count: noCover || 0, detail: "Produits publiés sans image de couverture" });
    }

    // 3. KYC pending > 48h
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { count: staleKyc } = await sb
      .from("kyc_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("submitted_at", twoDaysAgo);
    if ((staleKyc || 0) > 0) {
      issues.push({ category: "KYC en attente >48h", count: staleKyc || 0, detail: "Soumissions KYC bloquées en pending" });
    }

    // 4. Abandoned carts not reminded
    const { count: unremindedCarts } = await sb
      .from("abandoned_carts")
      .select("*", { count: "exact", head: true })
      .eq("converted", false)
      .is("last_reminder_at", null);
    if ((unremindedCarts || 0) > 10) {
      issues.push({ category: "Paniers non relancés", count: unremindedCarts || 0, detail: "Paniers abandonnés sans aucun rappel envoyé" });
    }

    // 5. Pending content reports
    const { count: pendingReports } = await sb
      .from("content_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if ((pendingReports || 0) > 0) {
      issues.push({ category: "Signalements non traités", count: pendingReports || 0, detail: "Rapports de contenu en attente de modération" });
    }

    // 6. Failed emails in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: failedEmails } = await sb
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", oneDayAgo);
    if ((failedEmails || 0) > 5) {
      issues.push({ category: "Emails échoués (24h)", count: failedEmails || 0, detail: "Emails avec statut 'failed' dans les dernières 24h" });
    }

    // 7. Orgs created >30 days ago with 0 products
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inactiveOrgs } = await sb
      .from("organizations")
      .select("id")
      .eq("is_active", true)
      .lt("created_at", thirtyDaysAgo);
    
    if (inactiveOrgs && inactiveOrgs.length > 0) {
      let emptyCount = 0;
      // Check in batches
      for (const org of inactiveOrgs.slice(0, 100)) {
        const { count } = await sb
          .from("digital_products")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);
        if ((count || 0) === 0) emptyCount++;
      }
      if (emptyCount > 0) {
        issues.push({ category: "Orgs sans contenu (>30j)", count: emptyCount, detail: "Organisations créées depuis >30j avec 0 produits" });
      }
    }

    // 8. Pending payouts
    const { count: pendingPayouts } = await sb
      .from("payout_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if ((pendingPayouts || 0) > 0) {
      issues.push({ category: "Versements en attente", count: pendingPayouts || 0, detail: "Demandes de paiement non traitées" });
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
