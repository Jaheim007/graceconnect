// Marketplace Templates — publish, browse, clone, moderate
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    const { data: isSuperadmin } = await admin.rpc('is_superadmin', { _user_id: user.id });

    switch (action) {
      // ---------------- PUBLISH from existing product ----------------
      case 'publish': {
        const { source_product_id, kind, clone_price, currency, author_commission_percent, description, tags, language } = body;
        if (!source_product_id) return jsonError('source_product_id required', 400);

        // Load product + verify ownership
        const { data: product } = await admin
          .from('digital_products')
          .select('id, title, description, cover_image_url, content, organization_id, product_type')
          .eq('id', source_product_id)
          .maybeSingle();
        if (!product) return jsonError('Product not found', 404);

        const { data: member } = await admin
          .from('organization_members')
          .select('role')
          .eq('organization_id', product.organization_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!member || !['owner','admin'].includes(member.role)) {
          return jsonError('Only owner/admin can publish templates', 403);
        }

        const snapshot = {
          title: product.title,
          description: product.description,
          cover_image_url: product.cover_image_url,
          content: product.content,
          product_type: product.product_type,
        };

        const { data: created, error } = await admin
          .from('marketplace_templates')
          .insert({
            author_org_id: product.organization_id,
            author_user_id: user.id,
            source_product_id,
            kind: kind || 'other',
            title: product.title,
            description: description || product.description,
            cover_image_url: product.cover_image_url,
            tags: tags || [],
            language: language || 'fr',
            clone_price: clone_price || 0,
            currency: currency || 'XOF',
            author_commission_percent: author_commission_percent ?? 50,
            content_snapshot: snapshot,
            status: 'pending_review',
          })
          .select('id')
          .single();

        if (error) return jsonError(error.message, 500);
        return jsonOk({ ok: true, template_id: created.id });
      }

      // ---------------- MODERATE (superadmin only) ----------------
      case 'moderate': {
        if (!isSuperadmin) return jsonError('Superadmin only', 403);
        const { template_id, decision, rejection_reason } = body;
        if (!template_id || !['approved','rejected','archived'].includes(decision)) {
          return jsonError('template_id + decision (approved/rejected/archived) required', 400);
        }
        const updates: any = { status: decision, updated_at: new Date().toISOString() };
        if (decision === 'approved') updates.published_at = new Date().toISOString();
        if (decision === 'rejected') updates.rejection_reason = rejection_reason || null;

        const { error } = await admin.from('marketplace_templates').update(updates).eq('id', template_id);
        if (error) return jsonError(error.message, 500);
        return jsonOk({ ok: true });
      }

      // ---------------- CLONE template into target org ----------------
      case 'clone': {
        const { template_id, target_org_id } = body;
        if (!template_id || !target_org_id) return jsonError('template_id + target_org_id required', 400);

        const { data: tpl } = await admin
          .from('marketplace_templates')
          .select('*')
          .eq('id', template_id)
          .eq('status', 'approved')
          .maybeSingle();
        if (!tpl) return jsonError('Template not available', 404);

        // Verify target org membership
        const { data: member } = await admin
          .from('organization_members')
          .select('role')
          .eq('organization_id', target_org_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!member || !['owner','admin'].includes(member.role)) {
          return jsonError('Only owner/admin can clone into target org', 403);
        }

        // Anti-self-clone
        if (tpl.author_org_id === target_org_id) {
          return jsonError('Cannot clone your own template', 400);
        }

        // NOTE: payment flow handled separately. Here we only register clone for FREE templates.
        if (Number(tpl.clone_price) > 0) {
          return jsonError('Paid templates require payment flow (use checkout-template-clone)', 402);
        }

        // Create cloned product
        const snap = tpl.content_snapshot || {};
        const { data: newProduct, error: pErr } = await admin
          .from('digital_products')
          .insert({
            organization_id: target_org_id,
            title: `${snap.title || tpl.title} (copie)`,
            description: snap.description || tpl.description,
            cover_image_url: snap.cover_image_url || tpl.cover_image_url,
            content: snap.content || null,
            product_type: snap.product_type || 'ebook',
            is_published: false,
            is_free: false,
            price: 0,
            currency: 'XOF',
            created_by: user.id,
          })
          .select('id')
          .single();

        if (pErr) return jsonError(pErr.message, 500);

        const { data: cloneId } = await admin.rpc('register_template_clone', {
          _template_id: template_id,
          _cloner_org_id: target_org_id,
          _cloner_user_id: user.id,
          _cloned_product_id: newProduct.id,
          _amount_paid: 0,
          _currency: tpl.currency,
        });

        return jsonOk({ ok: true, cloned_product_id: newProduct.id, clone_id: cloneId });
      }

      default:
        return jsonError(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    console.error('marketplace-templates error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
