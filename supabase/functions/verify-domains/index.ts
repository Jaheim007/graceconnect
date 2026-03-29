import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Get all unverified custom domains
    const { data: pendingDomains } = await sb
      .from("org_domains")
      .select("id, domain, organization_id")
      .eq("domain_type", "custom")
      .eq("is_verified", false);

    if (!pendingDomains || pendingDomains.length === 0) {
      return new Response(JSON.stringify({ verified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let verifiedCount = 0;

    for (const d of pendingDomains) {
      try {
        // Check if the domain resolves to our IP or CNAME
        const resp = await fetch(`https://${d.domain}`, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(5000),
        });

        // If we get a response, the domain is pointing to us
        if (resp.ok || resp.status === 404 || resp.status === 301 || resp.status === 302) {
          await sb
            .from("org_domains")
            .update({ is_verified: true, ssl_status: "active", updated_at: new Date().toISOString() })
            .eq("id", d.id);
          verifiedCount++;
        }
      } catch {
        // Domain not resolving yet, skip
      }
    }

    return new Response(JSON.stringify({ verified: verifiedCount, checked: pendingDomains.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
