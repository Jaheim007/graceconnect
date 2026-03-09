import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPERADMIN_IDS = [
  "abb86ae5-d5b0-4f9a-b679-1e514bcfdae7",
  "af896703-393e-4373-854d-50f6bea7e009",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { mode = "daily" } = await req.json().catch(() => ({}));

    // Create run record
    const { data: run } = await db.from("ops_autopilot_runs").insert({
      run_mode: mode,
      department: "all",
      status: "running",
    }).select("id").single();

    const runId = run?.id;
    const allActions: string[] = [];
    let totalAlerts = 0;
    let totalNotifs = 0;
    const results: Record<string, any> = {};

    // ═══════════════════════════════════════════════
    // 1. GROWTH AUTOPILOT
    // ═══════════════════════════════════════════════
    const growthResults: Record<string, any> = {};

    // TTFV: avg time to first action for users registered in last 7 days
    const { data: recentProfiles } = await db
      .from("profiles")
      .select("created_at, first_action_at")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .not("first_action_at", "is", null);

    if (recentProfiles && recentProfiles.length > 0) {
      const ttfvValues = recentProfiles.map((p: any) => {
        const created = new Date(p.created_at).getTime();
        const firstAction = new Date(p.first_action_at).getTime();
        return (firstAction - created) / 1000; // seconds
      });
      growthResults.ttfv_avg_seconds = Math.round(ttfvValues.reduce((a: number, b: number) => a + b, 0) / ttfvValues.length);
      growthResults.ttfv_sample_size = ttfvValues.length;

      // Alert if TTFV > 120s
      if (growthResults.ttfv_avg_seconds > 120) {
        for (const saId of SUPERADMIN_IDS) {
          await db.from("user_notifications").insert({
            user_id: saId,
            title: "⚠️ TTFV dégradé : " + growthResults.ttfv_avg_seconds + "s",
            body: `Le Time To First Value moyen est de ${growthResults.ttfv_avg_seconds}s (objectif < 60s). ${growthResults.ttfv_sample_size} utilisateurs analysés sur 7 jours.`,
            notification_type: "ops_alert",
            action_url: "/superadmin/metrics",
          });
        }
        totalAlerts++;
        allActions.push("growth: TTFV degradation alert sent");
      }
    }

    // Inactive users J7+ reactivation
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: inactiveUsers } = await db
      .from("profiles")
      .select("id, full_name")
      .lt("updated_at", sevenDaysAgo)
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(50);

    if (inactiveUsers && inactiveUsers.length > 0) {
      const notifs = inactiveUsers.map((u: any) => ({
        user_id: u.id,
        title: "👋 Tu nous manques !",
        body: "Ça fait plus d'une semaine que tu n'as pas visité SiteViral. Reviens voir les nouveaux produits et opportunités qui t'attendent !",
        notification_type: "reactivation",
        action_url: "/",
      }));
      await db.from("user_notifications").insert(notifs);
      totalNotifs += notifs.length;
      growthResults.inactive_users_reactivated = notifs.length;
      allActions.push(`growth: ${notifs.length} inactive user reactivation notifications sent`);
    }

    // Stuck users (registered but no first_action)
    const { data: stuckUsers } = await db
      .from("profiles")
      .select("id")
      .is("first_action_at", null)
      .gte("created_at", new Date(Date.now() - 3 * 86400000).toISOString())
      .lte("created_at", new Date(Date.now() - 1 * 86400000).toISOString())
      .limit(50);

    if (stuckUsers && stuckUsers.length > 0) {
      const notifs = stuckUsers.map((u: any) => ({
        user_id: u.id,
        title: "🚀 Prêt à démarrer ?",
        body: "Crée ton premier produit en 5 minutes avec notre Studio IA ou deviens ambassadeur et gagne des commissions dès aujourd'hui !",
        notification_type: "activation_nudge",
        action_url: "/welcome",
      }));
      await db.from("user_notifications").insert(notifs);
      totalNotifs += notifs.length;
      growthResults.stuck_users_nudged = notifs.length;
      allActions.push(`growth: ${notifs.length} stuck user activation nudges sent`);
    }

    // Funnel metrics
    const { count: totalRegistered7d } = await db.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);
    const { count: totalActivated7d } = await db.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo).not("first_action_at", "is", null);
    growthResults.activation_rate_7d = totalRegistered7d ? Math.round(((totalActivated7d || 0) / totalRegistered7d) * 100) : 0;
    growthResults.new_users_7d = totalRegistered7d || 0;

    results.growth = growthResults;

    // ═══════════════════════════════════════════════
    // 2. SUPPORT AUTOPILOT
    // ═══════════════════════════════════════════════
    const supportResults: Record<string, any> = {};

    const { count: pendingKyc } = await db.from("kyc_submissions").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { count: pendingReports } = await db.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { count: pendingPayouts } = await db.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending");

    supportResults.pending_kyc = pendingKyc || 0;
    supportResults.pending_reports = pendingReports || 0;
    supportResults.pending_payouts = pendingPayouts || 0;

    // SLA alert: KYC pending > 24h
    const { data: oldKyc } = await db.from("kyc_submissions")
      .select("id, organization_id")
      .eq("status", "pending")
      .lt("submitted_at", new Date(Date.now() - 24 * 3600000).toISOString())
      .limit(10);

    if (oldKyc && oldKyc.length > 0) {
      for (const saId of SUPERADMIN_IDS) {
        await db.from("user_notifications").insert({
          user_id: saId,
          title: "🚨 KYC en retard : " + oldKyc.length + " dossier(s) > 24h",
          body: `${oldKyc.length} soumission(s) KYC attendent depuis plus de 24h. SLA en danger.`,
          notification_type: "ops_sla_breach",
          action_url: "/superadmin/kyc",
        });
      }
      totalAlerts++;
      supportResults.kyc_sla_breaches = oldKyc.length;
      allActions.push(`support: SLA alert - ${oldKyc.length} KYC pending > 24h`);
    }

    // Alert on pending reports
    if ((pendingReports || 0) > 0) {
      for (const saId of SUPERADMIN_IDS) {
        await db.from("user_notifications").insert({
          user_id: saId,
          title: "🛡️ " + pendingReports + " signalement(s) à traiter",
          body: `${pendingReports} signalement(s) de contenu en attente de modération.`,
          notification_type: "ops_alert",
          action_url: "/superadmin/reports",
        });
      }
      totalAlerts++;
      allActions.push(`support: ${pendingReports} pending content reports alerted`);
    }

    results.support = supportResults;

    // ═══════════════════════════════════════════════
    // 3. COMMUNITY AUTOPILOT
    // ═══════════════════════════════════════════════
    const communityResults: Record<string, any> = {};

    // Top ambassadors by recent sales
    const { data: topAmbassadors } = await db
      .from("affiliate_sales")
      .select("affiliate_user_id, commission_amount")
      .gte("created_at", sevenDaysAgo)
      .order("commission_amount", { ascending: false })
      .limit(100);

    if (topAmbassadors && topAmbassadors.length > 0) {
      // Aggregate by user
      const userTotals: Record<string, number> = {};
      for (const sale of topAmbassadors) {
        const uid = sale.affiliate_user_id;
        userTotals[uid] = (userTotals[uid] || 0) + (sale.commission_amount || 0);
      }

      const sorted = Object.entries(userTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      communityResults.top_5_ambassadors = sorted.map(([uid, total], i) => ({
        user_id: uid,
        rank: i + 1,
        weekly_earnings: total,
      }));

      // Congratulate top performer
      if (sorted.length > 0) {
        const [topUserId, topEarnings] = sorted[0];
        await db.from("user_notifications").insert({
          user_id: topUserId,
          title: "🏆 Tu es l'ambassadeur #1 cette semaine !",
          body: `Avec ${Math.round(topEarnings)} FCFA de commissions cette semaine, tu es en tête du classement ! Continue comme ça 🔥`,
          notification_type: "achievement",
          action_url: "/affiliation",
        });
        totalNotifs++;
        allActions.push(`community: Top ambassador congratulated (${Math.round(topEarnings)} FCFA)`);
      }

      // Notify top 5
      for (let i = 1; i < Math.min(sorted.length, 5); i++) {
        await db.from("user_notifications").insert({
          user_id: sorted[i][0],
          title: `🎯 Top ${i + 1} ambassadeur cette semaine !`,
          body: `Tu es dans le Top ${i + 1} des ambassadeurs avec ${Math.round(sorted[i][1])} FCFA de commissions ! Continue à partager pour atteindre le #1 🚀`,
          notification_type: "achievement",
          action_url: "/affiliation",
        });
        totalNotifs++;
      }
    }

    // New ambassadors onboarding
    const { data: newAmbassadors } = await db
      .from("affiliate_links")
      .select("user_id, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 3600000).toISOString())
      .limit(50);

    if (newAmbassadors && newAmbassadors.length > 0) {
      // Check which ones haven't received an onboarding nudge
      const onboardNotifs = newAmbassadors.map((a: any) => ({
        user_id: a.user_id,
        title: "🎉 Bienvenue ambassadeur !",
        body: "Astuce : partage tes liens sur WhatsApp et Facebook pour maximiser tes gains. Les ambassadeurs actifs gagnent en moyenne 5x plus la première semaine !",
        notification_type: "ambassador_onboarding",
        action_url: "/gagner",
      }));
      await db.from("user_notifications").insert(onboardNotifs);
      totalNotifs += onboardNotifs.length;
      communityResults.new_ambassadors_onboarded = onboardNotifs.length;
      allActions.push(`community: ${onboardNotifs.length} new ambassador onboarding messages sent`);
    }

    results.community = communityResults;

    // ═══════════════════════════════════════════════
    // 4. MARKETING AUTOPILOT
    // ═══════════════════════════════════════════════
    const marketingResults: Record<string, any> = {};

    // Track platform-wide metrics
    const { count: totalOrgs } = await db.from("organizations").select("*", { count: "exact", head: true }).eq("is_active", true);
    const { count: totalProducts } = await db.from("digital_products").select("*", { count: "exact", head: true }).eq("is_published", true);
    const { count: totalUsers } = await db.from("profiles").select("*", { count: "exact", head: true });

    marketingResults.total_active_orgs = totalOrgs || 0;
    marketingResults.total_published_products = totalProducts || 0;
    marketingResults.total_users = totalUsers || 0;

    // Page performance from client_events (top pages)
    const { data: pageViews } = await db
      .from("client_events")
      .select("page_url")
      .eq("event_name", "page_view")
      .gte("created_at", sevenDaysAgo)
      .limit(1000);

    if (pageViews && pageViews.length > 0) {
      const pageCounts: Record<string, number> = {};
      for (const pv of pageViews) {
        const url = pv.page_url || "unknown";
        pageCounts[url] = (pageCounts[url] || 0) + 1;
      }
      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, views: count }));
      marketingResults.top_pages_7d = topPages;
    }

    results.marketing = marketingResults;

    // ═══════════════════════════════════════════════
    // 5. PARTNERSHIPS AUTOPILOT
    // ═══════════════════════════════════════════════
    const partnerResults: Record<string, any> = {};

    const { data: activePartners } = await db
      .from("partners")
      .select("id, full_name, user_id, level, last_invite_used_at, invite_uses_count")
      .eq("status", "approved");

    if (activePartners && activePartners.length > 0) {
      partnerResults.total_active = activePartners.length;

      // Churn risk: approved partners with no activity in 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const atRisk = activePartners.filter((p: any) =>
        !p.last_invite_used_at || p.last_invite_used_at < thirtyDaysAgo
      );

      if (atRisk.length > 0) {
        partnerResults.churn_risk_count = atRisk.length;

        // Nudge inactive partners
        for (const partner of atRisk.slice(0, 20)) {
          if (partner.user_id) {
            await db.from("user_notifications").insert({
              user_id: partner.user_id,
              title: "📊 Ton espace partenaire t'attend !",
              body: "Tu n'as pas utilisé ton lien partenaire depuis un moment. Les meilleurs partenaires recrutent régulièrement pour augmenter leur niveau et leurs commissions !",
              notification_type: "partner_reactivation",
              action_url: "/partner",
            });
            totalNotifs++;
          }
        }
        allActions.push(`partnerships: ${Math.min(atRisk.length, 20)} inactive partner nudges sent`);
      }

      // Level progression check
      for (const partner of activePartners) {
        const { data: currentLevel } = await db.rpc("compute_partner_level", { _partner_id: partner.id });
        if (currentLevel && currentLevel > (partner.level || 1)) {
          // Level up!
          await db.from("partners").update({ level: currentLevel }).eq("id", partner.id);
          if (partner.user_id) {
            const levelNames = ["", "Bronze", "Argent", "Or", "Platine", "Diamant"];
            await db.from("user_notifications").insert({
              user_id: partner.user_id,
              title: `🎉 Niveau ${levelNames[currentLevel]} atteint !`,
              body: `Félicitations ! Tu passes au niveau ${levelNames[currentLevel]}. Tes commissions augmentent automatiquement !`,
              notification_type: "partner_level_up",
              action_url: "/partner",
            });
            totalNotifs++;
            allActions.push(`partnerships: Partner ${partner.full_name} leveled up to ${levelNames[currentLevel]}`);
          }
        }
      }
    }

    results.partnerships = partnerResults;

    // ═══════════════════════════════════════════════
    // 6. CONTENT AUTOPILOT
    // ═══════════════════════════════════════════════
    const contentResults: Record<string, any> = {};

    // Blog performance
    const { data: recentMedia } = await db
      .from("media_content")
      .select("id, title, view_count, like_count, content_type")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentMedia) {
      contentResults.recent_content_count = recentMedia.length;
      contentResults.total_views = recentMedia.reduce((s: number, m: any) => s + (m.view_count || 0), 0);
      contentResults.total_likes = recentMedia.reduce((s: number, m: any) => s + (m.like_count || 0), 0);
    }

    // Products without descriptions (content quality)
    const { count: productsNoDesc } = await db
      .from("digital_products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .or("description.is.null,description.eq.");

    contentResults.products_missing_description = productsNoDesc || 0;

    results.content = contentResults;

    // ═══════════════════════════════════════════════
    // WEEKLY-ONLY TASKS
    // ═══════════════════════════════════════════════
    if (mode === "weekly") {
      // Auto-generate weekly challenge
      const challengeTemplates = [
        { title: "🚀 Défi Partage", description: "Partage 5 produits cette semaine sur WhatsApp et gagne de la visibilité !", type: "shares", target: 5 },
        { title: "💰 Défi Ventes", description: "Réalise 3 ventes cette semaine grâce à tes liens ambassadeur !", type: "sales", target: 3 },
        { title: "🤝 Défi Parrainage", description: "Invite 2 amis à rejoindre SiteViral cette semaine !", type: "referrals", target: 2 },
        { title: "📦 Défi Création", description: "Publie 1 nouveau produit cette semaine et lance ta boutique !", type: "products", target: 1 },
        { title: "⭐ Défi Engagement", description: "Laisse 3 avis sur des produits que tu as achetés cette semaine !", type: "engagement", target: 3 },
      ];

      const weekNum = Math.floor(Date.now() / (7 * 86400000));
      const template = challengeTemplates[weekNum % challengeTemplates.length];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      await db.from("weekly_challenges").update({ is_active: false }).eq("is_active", true);
      await db.from("weekly_challenges").insert({
        title: template.title,
        description: template.description,
        challenge_type: template.type,
        target_value: template.target,
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
      });
      allActions.push(`content: Weekly challenge created - "${template.title}"`);

      // Weekly superadmin summary
      const summaryBody = [
        `📊 **Rapport Autopilot Hebdo**`,
        ``,
        `🚀 Growth:`,
        `  • TTFV moyen : ${growthResults.ttfv_avg_seconds || "N/A"}s`,
        `  • Taux d'activation 7j : ${growthResults.activation_rate_7d || 0}%`,
        `  • Nouveaux users : ${growthResults.new_users_7d || 0}`,
        `  • Inactifs relancés : ${growthResults.inactive_users_reactivated || 0}`,
        ``,
        `🛟 Support:`,
        `  • KYC en attente : ${supportResults.pending_kyc}`,
        `  • Signalements : ${supportResults.pending_reports}`,
        `  • Payouts en attente : ${supportResults.pending_payouts}`,
        ``,
        `👥 Communauté:`,
        `  • Top ambassadeurs identifiés : ${communityResults.top_5_ambassadors?.length || 0}`,
        `  • Nouveaux ambassadeurs onboardés : ${communityResults.new_ambassadors_onboarded || 0}`,
        ``,
        `🤝 Partenariats:`,
        `  • Partenaires actifs : ${partnerResults.total_active || 0}`,
        `  • Risque de churn : ${partnerResults.churn_risk_count || 0}`,
        ``,
        `📣 Marketing:`,
        `  • Orgs actives : ${marketingResults.total_active_orgs}`,
        `  • Produits publiés : ${marketingResults.total_published_products}`,
        `  • Users total : ${marketingResults.total_users}`,
        ``,
        `Actions : ${allActions.length} | Alertes : ${totalAlerts} | Notifs : ${totalNotifs}`,
      ].join("\n");

      for (const saId of SUPERADMIN_IDS) {
        await db.from("user_notifications").insert({
          user_id: saId,
          title: "📋 Rapport Autopilot Hebdomadaire",
          body: summaryBody,
          notification_type: "ops_weekly_report",
          action_url: "/superadmin/command-center",
        });
      }
      totalNotifs += SUPERADMIN_IDS.length;
      allActions.push("weekly: Full summary report sent to superadmins");
    }

    // Update run record
    if (runId) {
      await db.from("ops_autopilot_runs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        results,
        actions_taken: allActions,
        alerts_generated: totalAlerts,
        notifications_sent: totalNotifs,
      }).eq("id", runId);
    }

    return new Response(
      JSON.stringify({ ok: true, mode, actions: allActions.length, alerts: totalAlerts, notifications: totalNotifs, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Ops Autopilot error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
