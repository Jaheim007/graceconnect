import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FUNCTION_URL = Deno.env.get("SUPABASE_URL")
  ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack-webhook`
  : "https://api.siteviral.com/functions/v1/paystack-webhook";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM";

Deno.test("paystack-webhook: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: ANON_KEY },
  });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.body?.cancel();
});

Deno.test("paystack-webhook: missing signature returns 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ event: "charge.success", data: {} }),
  });
  // Should be 401 since no x-paystack-signature header
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test("paystack-webhook: invalid signature returns 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      "x-paystack-signature": "invalid-signature-hash",
    },
    body: JSON.stringify({ event: "charge.success", data: { reference: "SV-TEST-123" } }),
  });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});
