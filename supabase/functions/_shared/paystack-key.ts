/**
 * Returns the correct Paystack secret key based on the VITE_PAYSTACK_MODE env var.
 * - "test" → PAYSTACK_SECRET_KEY_TEST
 * - "live" (default) → PAYSTACK_SECRET_KEY
 */
export function getPaystackSecretKey(): string {
  const mode = Deno.env.get('VITE_PAYSTACK_MODE') || 'live';
  const key = mode === 'test'
    ? Deno.env.get('PAYSTACK_SECRET_KEY_TEST')
    : Deno.env.get('PAYSTACK_SECRET_KEY');

  if (!key) {
    throw new Error(`Paystack secret key not configured for mode "${mode}". Set ${mode === 'test' ? 'PAYSTACK_SECRET_KEY_TEST' : 'PAYSTACK_SECRET_KEY'} in Supabase secrets.`);
  }

  console.log(`[Paystack] Using ${mode} mode`);
  return key;
}
