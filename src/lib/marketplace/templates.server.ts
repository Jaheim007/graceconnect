// Server-only marketplace template logic. Ported from the
// `marketplace-templates` edge function (publish / moderate / clone).

type Admin = any;

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as Admin;
}

async function assertOrgManager(db: Admin, orgId: string, userId: string, message: string) {
  const { data: member } = await db
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!member || !['owner', 'admin'].includes(member.role)) throw new Error(message);
}

export async function publishTemplate(
  userId: string,
  input: {
    source_product_id: string;
    kind?: string | null;
    clone_price?: number | null;
    currency?: string | null;
    author_commission_percent?: number | null;
    description?: string | null;
    tags?: string[] | null;
    language?: string | null;
  },
): Promise<{ ok: true; template_id: string }> {
  const db = await admin();

  const { data: product } = await db
    .from('digital_products')
    .select('id, title, description, cover_image_url, content, organization_id, product_type')
    .eq('id', input.source_product_id)
    .maybeSingle();
  if (!product) throw new Error('Product not found');

  await assertOrgManager(
    db,
    product.organization_id,
    userId,
    'Only owner/admin can publish templates',
  );

  const snapshot = {
    title: product.title,
    description: product.description,
    cover_image_url: product.cover_image_url,
    content: product.content,
    product_type: product.product_type,
  };

  const { data: created, error } = await db
    .from('marketplace_templates')
    .insert({
      author_org_id: product.organization_id,
      author_user_id: userId,
      source_product_id: input.source_product_id,
      kind: input.kind || 'other',
      title: product.title,
      description: input.description || product.description,
      cover_image_url: product.cover_image_url,
      tags: input.tags || [],
      language: input.language || 'fr',
      clone_price: input.clone_price || 0,
      currency: input.currency || 'XOF',
      author_commission_percent: input.author_commission_percent ?? 50,
      content_snapshot: snapshot,
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { ok: true, template_id: created.id };
}

export async function moderateTemplate(
  userId: string,
  input: { template_id: string; decision: string; rejection_reason?: string | null },
): Promise<{ ok: true }> {
  const db = await admin();

  const { data: isSuperadmin } = await db.rpc('is_superadmin', { _user_id: userId });
  if (!isSuperadmin) throw new Error('Superadmin only');

  if (!['approved', 'rejected', 'archived'].includes(input.decision)) {
    throw new Error('decision must be approved/rejected/archived');
  }

  const updates: Record<string, any> = {
    status: input.decision,
    updated_at: new Date().toISOString(),
  };
  if (input.decision === 'approved') updates.published_at = new Date().toISOString();
  if (input.decision === 'rejected') updates.rejection_reason = input.rejection_reason || null;

  const { error } = await db
    .from('marketplace_templates')
    .update(updates)
    .eq('id', input.template_id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function cloneTemplate(
  userId: string,
  input: { template_id: string; target_org_id: string },
): Promise<{ ok: true; cloned_product_id: string; clone_id: string | null }> {
  const db = await admin();

  const { data: tpl } = await db
    .from('marketplace_templates')
    .select('*')
    .eq('id', input.template_id)
    .eq('status', 'approved')
    .maybeSingle();
  if (!tpl) throw new Error('Template not available');

  await assertOrgManager(
    db,
    input.target_org_id,
    userId,
    'Only owner/admin can clone into target org',
  );

  if (tpl.author_org_id === input.target_org_id) {
    throw new Error('Cannot clone your own template');
  }
  if (Number(tpl.clone_price) > 0) {
    throw new Error('Paid templates require the payment flow');
  }

  const snap = tpl.content_snapshot || {};
  const { data: newProduct, error: pErr } = await db
    .from('digital_products')
    .insert({
      organization_id: input.target_org_id,
      title: `${snap.title || tpl.title} (copie)`,
      description: snap.description || tpl.description,
      cover_image_url: snap.cover_image_url || tpl.cover_image_url,
      content: snap.content || null,
      product_type: snap.product_type || 'ebook',
      is_published: false,
      is_free: false,
      price: 0,
      currency: 'XOF',
      created_by: userId,
    })
    .select('id')
    .single();
  if (pErr) throw new Error(pErr.message);

  const { data: cloneId } = await db.rpc('register_template_clone', {
    _template_id: input.template_id,
    _cloner_org_id: input.target_org_id,
    _cloner_user_id: userId,
    _cloned_product_id: newProduct.id,
    _amount_paid: 0,
    _currency: tpl.currency,
  });

  return { ok: true, cloned_product_id: newProduct.id, clone_id: (cloneId as string) ?? null };
}
