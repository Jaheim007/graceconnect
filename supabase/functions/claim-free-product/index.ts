import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const { product_id, organization_id } = await req.json();
    if (!product_id || !organization_id) {
      return new Response(JSON.stringify({ error: "product_id and organization_id are required" }), { status: 400, headers: corsHeaders });
    }

    // Verify the product is truly free
    const { data: product, error: productError } = await supabase
      .from("digital_products")
      .select("id, is_free, price, is_published, organization_id")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: corsHeaders });
    }

    if (!product.is_free && (product.price ?? 0) > 0) {
      return new Response(JSON.stringify({ error: "This product is not free" }), { status: 403, headers: corsHeaders });
    }

    if (!product.is_published) {
      return new Response(JSON.stringify({ error: "Product is not published" }), { status: 403, headers: corsHeaders });
    }

    if (product.organization_id !== organization_id) {
      return new Response(JSON.stringify({ error: "Organization mismatch" }), { status: 400, headers: corsHeaders });
    }

    // Check if already claimed
    const { data: existing } = await supabase
      .from("product_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, already_claimed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role for insert to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabaseAdmin
      .from("product_purchases")
      .insert({
        user_id: userId,
        product_id: product_id,
        organization_id: organization_id,
        amount: 0,
        currency: "XOF",
        status: "completed",
        completed_at: new Date().toISOString(),
        paystack_reference: `free-${userId.slice(0, 8)}-${Date.now()}`,
        platform_fee: 0,
        organization_amount: 0,
      });

    if (insertError) {
      console.error("[claim-free-product] Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to claim product" }), { status: 500, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ ok: true, already_claimed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[claim-free-product] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
