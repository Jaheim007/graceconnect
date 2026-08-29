// Server-only payment lookup used by the /payment/success page.
//
// Why this exists: the success page previously read `product_purchases` /
// `donations` with the browser (anon) client. RLS only exposes rows to the
// buyer (`user_id = auth.uid()`) or to org admins, so guest checkouts — and
// any row written without a user_id — were invisible. The page then polled
// forever ("the page just kept turning") even though the payment succeeded.
// Reading through the service-role client, keyed by the buyer's own payment
// reference, resolves the transaction for everyone who actually paid.

export interface PublicPaymentInfo {
  type: 'product' | 'donation';
  reference: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  product_title?: string;
  product_type?: string;
  product_id?: string;
  organization_id?: string;
  file_url?: string | null;
  external_link?: string | null;
  cover_image_url?: string | null;
  org_name: string;
  org_slug?: string;
  org_logo?: string | null;
  leader_name?: string | null;
  leader_title?: string | null;
  campaign_title?: string;
  buyer_email?: string | null;
}

export const REFERENCE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{5,79}$/;

export async function lookupPaymentByReference(
  reference: string,
): Promise<PublicPaymentInfo | null> {
  if (!REFERENCE_RE.test(reference)) return null;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as unknown as { from: (t: string) => any };

  const { data: purchase } = await db
    .from('product_purchases')
    .select(
      '*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, slug, logo_url, leader_name, leader_title))',
    )
    .eq('paystack_reference', reference)
    .limit(1)
    .maybeSingle();

  if (purchase) {
    const product = purchase.digital_products;
    const org = product?.organizations;
    return {
      type: 'product',
      reference: purchase.paystack_reference,
      amount: Number(purchase.amount || 0),
      currency: purchase.currency || 'XOF',
      status: purchase.status ?? '',
      created_at: purchase.completed_at || purchase.created_at || '',
      product_title: product?.title,
      product_type: product?.product_type ?? undefined,
      product_id: product?.id,
      organization_id: product?.organization_id,
      file_url: product?.file_url ?? null,
      external_link: product?.external_link ?? null,
      cover_image_url: product?.cover_image_url ?? null,
      org_name: org?.name || 'Organization',
      org_slug: org?.slug,
      org_logo: org?.logo_url ?? null,
      leader_name: org?.leader_name ?? null,
      leader_title: org?.leader_title ?? null,
      buyer_email: purchase.buyer_email ?? null,
    };
  }

  const { data: donation } = await db
    .from('donations')
    .select(
      '*, donation_campaigns(title), organizations(name, slug, logo_url, leader_name, leader_title)',
    )
    .eq('paystack_reference', reference)
    .limit(1)
    .maybeSingle();

  if (donation) {
    const org = donation.organizations;
    return {
      type: 'donation',
      reference: donation.paystack_reference,
      amount: Number(donation.amount || 0),
      currency: donation.currency || 'XOF',
      status: donation.status ?? '',
      created_at: donation.completed_at || donation.created_at || '',
      campaign_title: donation.donation_campaigns?.title,
      org_name: org?.name || 'Organization',
      org_slug: org?.slug,
      org_logo: org?.logo_url ?? null,
      leader_name: org?.leader_name ?? null,
      leader_title: org?.leader_title ?? null,
      buyer_email: donation.donor_email ?? null,
    };
  }

  return null;
}
