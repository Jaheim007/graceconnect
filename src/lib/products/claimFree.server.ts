// Server-only logic for claiming a free product. Ported from the
// `claim-free-product` edge function.

export interface ClaimFreeInput {
  product_id: string;
  organization_id: string;
}

export type ClaimFreeResult =
  | { ok: true; already_claimed: boolean }
  | { error: string };

export async function runClaimFreeProduct(
  input: ClaimFreeInput,
  userId: string,
): Promise<ClaimFreeResult> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as any;
  const { product_id, organization_id } = input;

  const { data: product } = await db
    .from('digital_products')
    .select('id, is_free, price, is_published, organization_id')
    .eq('id', product_id)
    .maybeSingle();

  if (!product) return { error: 'Product not found' };
  if (!product.is_free && (product.price ?? 0) > 0) return { error: 'This product is not free' };
  if (!product.is_published) return { error: 'Product is not published' };
  if (product.organization_id !== organization_id) return { error: 'Organization mismatch' };

  const { data: existing } = await db
    .from('product_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', product_id)
    .maybeSingle();
  if (existing) return { ok: true, already_claimed: true };

  const { error: insertError } = await db.from('product_purchases').insert({
    user_id: userId,
    product_id,
    organization_id,
    amount: 0,
    currency: 'XOF',
    status: 'completed',
    completed_at: new Date().toISOString(),
    paystack_reference: `free-${userId.slice(0, 8)}-${Date.now()}`,
    platform_fee: 0,
    organization_amount: 0,
  });
  if (insertError) {
    console.error('[claim-free-product] Insert error:', insertError);
    return { error: 'Failed to claim product' };
  }

  const { data: productInfo } = await db
    .from('digital_products')
    .select('title, organizations(name)')
    .eq('id', product_id)
    .maybeSingle();
  const productTitle = productInfo?.title || 'Ressource gratuite';
  const orgName = productInfo?.organizations?.name || 'Organisation';

  await db.from('user_notifications').insert({
    user_id: userId,
    organization_id,
    title: '✅ Ressource récupérée',
    body: `Vous avez récupéré "${productTitle}" de ${orgName}. Accédez-y dans vos ressources.`,
    notification_type: 'purchase',
    action_url: '/resources',
  });

  const { data: admins } = await db
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organization_id)
    .in('role', ['owner', 'admin']);

  if (admins?.length) {
    await db.from('user_notifications').insert(
      admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        organization_id,
        title: '🆓 Nouveau téléchargement gratuit',
        body: `Un utilisateur a récupéré "${productTitle}"`,
        notification_type: 'sale_admin',
        action_url: '/admin/analytics',
      })),
    );
  }

  // Free claims used to create only in-app notifications, so buyers of free
  // resources never got an email like paid buyers do. Send the same
  // purchase confirmation (amount 0) so every claim leaves an email trail.
  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const { data: userRow } = await db.auth.admin.getUserById(userId);
    const buyerEmail = userRow?.user?.email as string | undefined;
    if (supabaseUrl && serviceKey && buyerEmail) {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          template: 'purchase_confirmation',
          to: buyerEmail,
          organization_id,
          data: {
            product_title: productTitle,
            org_name: orgName,
            amount: 0,
            currency: 'XOF',
          },
        }),
      });
    }
  } catch (e) {
    console.error('[claim-free-product] confirmation email failed:', e);
  }

  return { ok: true, already_claimed: false };
}

