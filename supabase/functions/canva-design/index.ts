import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANVA_API = "https://api.canva.com/rest/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, canva_token } = body;

    if (!canva_token) throw new Error("Missing canva_token");

    const canvaHeaders = {
      Authorization: `Bearer ${canva_token}`,
      "Content-Type": "application/json",
    };

    // ── CREATE DESIGN ──
    if (action === "create") {
      const { title, width, height, preset } = body;

      const designBody: Record<string, any> = {};
      if (title) designBody.title = title;

      if (preset) {
        // Use preset type like "doc", "presentation", "whiteboard"
        designBody.design_type = { type: "preset", name: preset };
      } else {
        // Custom dimensions
        designBody.design_type = {
          type: "custom",
          width: width || 600,
          height: height || 900,
        };
      }

      const res = await fetch(`${CANVA_API}/designs`, {
        method: "POST",
        headers: canvaHeaders,
        body: JSON.stringify(designBody),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Canva create design error:", data);
        throw new Error(data.message || data.error?.message || "Failed to create design");
      }

      return new Response(
        JSON.stringify({
          ok: true,
          design_id: data.design?.id,
          edit_url: data.design?.urls?.edit_url,
          view_url: data.design?.urls?.view_url,
          thumbnail_url: data.design?.thumbnail?.url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── EXPORT DESIGN ──
    if (action === "export") {
      const { design_id, format } = body;
      if (!design_id) throw new Error("Missing design_id");

      // Start export job
      const exportRes = await fetch(`${CANVA_API}/exports`, {
        method: "POST",
        headers: canvaHeaders,
        body: JSON.stringify({
          design_id,
          format: { type: format || "png" },
        }),
      });

      const exportData = await exportRes.json();
      if (!exportRes.ok) {
        console.error("Canva export error:", exportData);
        throw new Error(exportData.message || "Export failed");
      }

      const jobId = exportData.job?.id;
      if (!jobId) throw new Error("No export job ID returned");

      // Poll for completion (max 30 seconds)
      let exportUrl = null;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));

        const statusRes = await fetch(`${CANVA_API}/exports/${jobId}`, {
          headers: canvaHeaders,
        });
        const statusData = await statusRes.json();

        if (statusData.job?.status === "success") {
          exportUrl = statusData.job?.urls?.[0];
          break;
        }
        if (statusData.job?.status === "failed") {
          throw new Error("Export job failed");
        }
      }

      if (!exportUrl) throw new Error("Export timed out");

      // Download the image and upload to Supabase storage
      const imageRes = await fetch(exportUrl);
      const imageBlob = await imageRes.arrayBuffer();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const fileName = `canva-covers/${design_id}-${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("org-uploads")
        .upload(fileName, new Uint8Array(imageBlob), {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage
        .from("org-uploads")
        .getPublicUrl(fileName);

      return new Response(
        JSON.stringify({ ok: true, cover_url: urlData.publicUrl, canva_url: exportUrl }),
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
