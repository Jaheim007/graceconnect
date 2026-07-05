// Beauty auto-release cron worker.
// Runs every 15 minutes via pg_cron -> net.http_post.
// 1) Auto-complete confirmed bookings whose slot ended >24h ago.
// 2) Mark completed bookings as "released" once auto_release_at is past
//    (funds available for payout; provider payouts are settled via existing manual_payouts flow).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();
  const twentyFourHoursAgoIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // 1) Auto-complete confirmed bookings whose slot ended >24h ago
  const { data: toComplete, error: e1 } = await supabase
    .from("beauty_bookings")
    .select("id, provider_id")
    .eq("status", "confirmed")
    .lt("slot_end", twentyFourHoursAgoIso)
    .limit(500);

  let completed = 0;
  if (!e1 && toComplete?.length) {
    for (const b of toComplete) {
      const { error } = await supabase
        .from("beauty_bookings")
        .update({ status: "completed", completed_at: nowIso })
        .eq("id", b.id)
        .eq("status", "confirmed");
      if (!error) {
        completed++;
        await supabase.from("beauty_booking_events").insert({
          booking_id: b.id,
          event_type: "auto_completed",
          payload: { reason: "slot_end_plus_24h" },
        });
      }
    }
  }

  // 2) Release escrow for completed bookings past auto_release_at
  const { data: toRelease, error: e2 } = await supabase
    .from("beauty_bookings")
    .select("id, provider_id, price_xof, commission_xof")
    .eq("status", "completed")
    .lt("auto_release_at", nowIso)
    .is("cancelled_at", null)
    .limit(500);

  let released = 0;
  if (!e2 && toRelease?.length) {
    for (const b of toRelease) {
      // Mark released via event; keep status "completed" (funds accounting handled by payout flow).
      const { data: existing } = await supabase
        .from("beauty_booking_events")
        .select("id")
        .eq("booking_id", b.id)
        .eq("event_type", "escrow_released")
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("beauty_booking_events").insert({
        booking_id: b.id,
        event_type: "escrow_released",
        payload: {
          net_xof: (b.price_xof ?? 0) - (b.commission_xof ?? 0),
          released_at: nowIso,
        },
      });
      if (!error) released++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, completed, released, errors: [e1?.message, e2?.message].filter(Boolean) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
