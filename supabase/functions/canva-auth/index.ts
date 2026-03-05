import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CANVA_CLIENT_ID = Deno.env.get("CANVA_CLIENT_ID");
    const CANVA_CLIENT_SECRET = Deno.env.get("CANVA_CLIENT_SECRET");
    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      throw new Error("Canva credentials not configured");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "authorize";

    // ── ACTION: authorize → return the Canva OAuth URL ──
    if (action === "authorize") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing auth");

      const body = await req.json();
      const redirectUri = body.redirect_uri;
      const state = body.state || "";

      if (!redirectUri) throw new Error("Missing redirect_uri");

      // Canva OAuth2 authorize URL
      const scopes = "design:content:read design:content:write asset:read asset:write";
      const authorizeUrl = `https://www.canva.com/api/oauth/authorize?` +
        `response_type=code` +
        `&client_id=${encodeURIComponent(CANVA_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${encodeURIComponent(state)}`;

      return new Response(
        JSON.stringify({ ok: true, authorize_url: authorizeUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: token → exchange code for access_token ──
    if (action === "token") {
      const body = await req.json();
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) throw new Error("Missing code or redirect_uri");

      const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Canva token error:", tokenData);
        throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
      }

      return new Response(
        JSON.stringify({ ok: true, ...tokenData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: refresh → refresh an expired token ──
    if (action === "refresh") {
      const body = await req.json();
      const { refresh_token } = body;
      if (!refresh_token) throw new Error("Missing refresh_token");

      const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error_description || "Refresh failed");
      }

      return new Response(
        JSON.stringify({ ok: true, ...tokenData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
