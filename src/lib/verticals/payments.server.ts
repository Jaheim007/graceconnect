// Shared server-only payment helpers for the vertical marketplaces
// (Beauty / Home / Events / Education). Worker-friendly: Stripe is called via
// its REST API, GeniusPay via fetch.

export const AFRICA_MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);
export const ZERO_DECIMAL = ['XOF', 'XAF', 'JPY', 'KRW', 'VND'];

export type AnyDb = { from: (table: string) => any; auth: any };

export async function adminDb(): Promise<AnyDb> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as AnyDb;
}

export async function getAuthUser(db: AnyDb, userId: string) {
  const { data } = await db.auth.admin.getUserById(userId);
  return data?.user as { email?: string; user_metadata?: Record<string, unknown> } | undefined;
}

export function baseOrigin(returnOrigin?: string) {
  return String(returnOrigin || 'https://siteviral.com').replace(/\/$/, '');
}

export async function geniusPayCheckout(args: {
  amount: number;
  currency: string;
  description: string;
  email?: string;
  name?: unknown;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, unknown>;
  tag: string;
}): Promise<{ checkout_url: string; reference: string } | { error: string }> {
  const key = process.env['GENIUSPAY_API_KEY'] || '';
  const secret = process.env['GENIUSPAY_API_SECRET'] || '';
  if (!key || !secret) return { error: 'GeniusPay not configured' };

  const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: { 'X-API-Key': key, 'X-API-Secret': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(args.amount),
      currency: args.currency,
      description: args.description.slice(0, 120),
      customer: { email: args.email, name: args.name },
      success_url: args.successUrl,
      error_url: args.cancelUrl,
      metadata: args.metadata,
    }),
  });
  const gp = await res.json().catch(() => null);
  if (!res.ok || !gp?.success || !gp?.data?.checkout_url) {
    console.error(`[${args.tag}] geniuspay fail`, res.status, gp);
    return { error: 'Payment provider error' };
  }
  return { checkout_url: gp.data.checkout_url as string, reference: gp.data.reference as string };
}

/** Stripe Checkout session via REST (no Node SDK — Worker friendly). */
export async function stripeCheckout(args: {
  amount: number;
  currency: string;
  productName: string;
  productDescription?: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  tag: string;
}): Promise<{ checkout_url: string; id: string } | { error: string }> {
  const secret = process.env['STRIPE_SECRET_KEY'] || '';
  if (!secret) return { error: 'Stripe not configured' };

  const currency = args.currency.toUpperCase();
  const unitAmount = ZERO_DECIMAL.includes(currency)
    ? Math.round(args.amount)
    : Math.round(args.amount * 100);

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', args.successUrl);
  form.set('cancel_url', args.cancelUrl);
  if (args.email) form.set('customer_email', args.email);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', currency.toLowerCase());
  form.set('line_items[0][price_data][unit_amount]', String(unitAmount));
  form.set('line_items[0][price_data][product_data][name]', args.productName.slice(0, 120));
  if (args.productDescription) {
    form.set(
      'line_items[0][price_data][product_data][description]',
      args.productDescription.slice(0, 300),
    );
  }
  for (const [k, v] of Object.entries(args.metadata)) form.set(`metadata[${k}]`, String(v));

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.url) {
    console.error(`[${args.tag}] stripe fail`, res.status, session?.error?.message);
    return { error: session?.error?.message || 'Stripe error' };
  }
  return { checkout_url: session.url as string, id: session.id as string };
}

/** Retrieve a Stripe Checkout session via REST. */
export async function stripeRetrieveSession(
  sessionId: string,
  tag: string,
): Promise<{ payment_status?: string; amount_total?: number; currency?: string } | { error: string }> {
  const secret = process.env['STRIPE_SECRET_KEY'] || '';
  if (!secret) return { error: 'Stripe not configured' };
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.id) {
    console.error(`[${tag}] stripe retrieve fail`, res.status, session?.error?.message);
    return { error: session?.error?.message || 'Stripe error' };
  }
  return session as { payment_status?: string; amount_total?: number; currency?: string };
}
