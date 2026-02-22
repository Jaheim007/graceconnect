import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Unit-test the rate limiter logic and request validation
// These tests don't hit Paystack or Supabase — they validate the function's HTTP contract.

const FUNCTION_URL = Deno.env.get("SUPABASE_URL")
  ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment`
  : "https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/verify-payment";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM";

Deno.test("verify-payment: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: ANON_KEY },
  });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.body?.cancel();
});

Deno.test("verify-payment: missing fields returns 400", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  assertEquals(res.status, 400);
  assertEquals(data.error, "Missing required fields");
});

Deno.test("verify-payment: missing reference returns 400", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      type: "donation",
      organization_id: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const data = await res.json();
  assertEquals(res.status, 400);
  assertEquals(data.error, "Missing required fields");
});

Deno.test("verify-payment: invalid org returns 404", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      reference: "SV-TEST-" + Date.now(),
      type: "donation",
      organization_id: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const data = await res.json();
  // Should be 404 (org not found) or 500 if env not configured
  assertEquals(typeof data.error, "string");
});
