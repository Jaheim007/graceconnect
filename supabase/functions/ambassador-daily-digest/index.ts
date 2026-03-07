import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // 1. Get products published in the last 24h from orgs with affiliation enabled
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: newProducts, error: prodErr } = await db
      .from("digital_products")
      .select("id, title, price, currency, cover_image_url, organization_id, organizations(name, affiliation_commission_percent, affiliation_enabled)")
      .eq("is_published", true)
      .eq("is_express_demo", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (prodErr) throw prodErr;

    // Filter to only products from orgs with affiliation enabled
    const affiliateProducts = (newProducts || []).filter(
      (p: any) => p.organizations?.affiliation_enabled === true
    );

    if (affiliateProducts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No new affiliate products today", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get all unique active ambassadors (distinct user_ids with active affiliate links)
    const { data: ambassadors, error: ambErr } = await db
      .from("affiliate_links")
      .select("user_id")
      .eq("is_active", true);

    if (ambErr) throw ambErr;

    const uniqueUserIds = [...new Set((ambassadors || []).map((a: any) => a.user_id))];

    if (uniqueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No active ambassadors", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Build digest content
    const productCount = affiliateProducts.length;
    const topProducts = affiliateProducts.slice(0, 5);
    const productList = topProducts
      .map((p: any) => {
        const commission = p.organizations?.affiliation_commission_percent || 10;
        const earning = Math.round((p.price || 0) * commission / 100);
        const currency = p.currency || "XOF";
        return `• "${p.title}" par ${p.organizations?.name} — ${commission}% (${earning} ${currency}/vente)`;
      })
      .join("\n");

    const moreText = productCount > 5 ? `\n...et ${productCount - 5} autre(s)` : "";

    const title = productCount === 1
      ? "🆕 1 nouveau produit à promouvoir !"
      : `🆕 ${productCount} nouveaux produits à promouvoir !`;

    const body = `Voici les nouveautés du jour :\n${productList}${moreText}\n\nRendez-vous sur la page Gagner pour obtenir vos liens de partage !`;

    // 4. Batch insert notifications (in chunks to avoid payload limits)
    const CHUNK = 500;
    let notified = 0;

    // Exclude product creators from their own notifications
    const creatorIds = new Set(
      affiliateProducts
        .map((p: any) => p.created_by)
        .filter(Boolean)
    );

    const eligibleUsers = uniqueUserIds.filter((uid: string) => !creatorIds.has(uid));

    for (let i = 0; i < eligibleUsers.length; i += CHUNK) {
      const chunk = eligibleUsers.slice(i, i + CHUNK);
      const rows = chunk.map((userId: string) => ({
        user_id: userId,
        title,
        body,
        notification_type: "ambassador_digest",
        action_url: "/gagner",
      }));

      const { error: insertErr } = await db.from("user_notifications").insert(rows);
      if (insertErr) {
        console.error("Insert error for chunk", i, insertErr.message);
      } else {
        notified += chunk.length;
      }
    }

    console.log(`Ambassador digest: ${notified} notified, ${productCount} products`);

    return new Response(
      JSON.stringify({ ok: true, notified, products: productCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Ambassador digest error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
