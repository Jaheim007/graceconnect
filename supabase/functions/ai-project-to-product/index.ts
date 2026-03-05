import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const {
      org_id, project_id, price, currency,
      publish_now, sale_price, sale_ends_at, create_previews,
    } = await req.json();

    if (!org_id || !project_id) return jsonError('org_id and project_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Permission ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonError('Forbidden', 403);
    }

    // --- Load project ---
    const { data: project, error: projErr } = await admin
      .from('ai_content_projects')
      .select('*')
      .eq('id', project_id)
      .eq('organization_id', org_id)
      .single();

    if (projErr || !project) return jsonError('Project not found', 404);

    // --- Quality gate check ---
    const { data: qualityScores } = await admin
      .from('ai_quality_scores')
      .select('review_required, review_status')
      .eq('project_id', project_id)
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (qualityScores && qualityScores.length > 0) {
      const latest = qualityScores[0];
      if (latest.review_required && latest.review_status !== 'approved') {
        return jsonError('Quality gate: review must be approved before publishing', 422);
      }
    }

    // --- Find PDF/file asset ---
    const { data: pdfAsset } = await admin
      .from('ai_assets')
      .select('storage_bucket, storage_path')
      .eq('project_id', project_id)
      .eq('asset_type', 'pdf')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let fileUrl = null;
    if (pdfAsset) {
      fileUrl = `${supabaseUrl}/storage/v1/object/public/${pdfAsset.storage_bucket}/${pdfAsset.storage_path}`;
    }

    // --- Find cover image ---
    const { data: coverAsset } = await admin
      .from('ai_project_assets')
      .select('file_url')
      .eq('project_id', project_id)
      .eq('is_cover', true)
      .maybeSingle();

    // --- Get org currency ---
    const { data: org } = await admin
      .from('organizations')
      .select('currency')
      .eq('id', org_id)
      .single();

    const productCurrency = currency || org?.currency || 'XOF';
    const productPrice = price ?? 0;
    const isFree = productPrice === 0;

    // --- Check if product already linked ---
    let productId: string;

    if (project.linked_product_id) {
      // Update existing product
      const { error: updateErr } = await admin
        .from('digital_products')
        .update({
          title: project.title,
          description: project.objective || project.description || '',
          file_url: fileUrl,
          cover_image_url: coverAsset?.file_url || null,
          price: productPrice,
          currency: productCurrency,
          is_free: isFree,
          ai_generated: true,
          ai_project_id: project_id,
          sale_price: sale_price || null,
          sale_ends_at: sale_ends_at || null,
          is_published: publish_now ?? false,
          publication_status: publish_now ? 'published' : 'draft',
          product_type: mapProjectTypeToProductType(project.project_type),
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.linked_product_id);

      if (updateErr) {
        console.error('Product update error:', updateErr);
        return jsonError('Failed to update product', 500);
      }
      productId = project.linked_product_id;
    } else {
      // Create new product
      const { data: newProduct, error: createErr } = await admin
        .from('digital_products')
        .insert({
          organization_id: org_id,
          created_by: user.id,
          title: project.title,
          description: project.objective || project.description || '',
          file_url: fileUrl,
          cover_image_url: coverAsset?.file_url || null,
          price: productPrice,
          currency: productCurrency,
          is_free: isFree,
          ai_generated: true,
          ai_project_id: project_id,
          sale_price: sale_price || null,
          sale_ends_at: sale_ends_at || null,
          is_published: publish_now ?? false,
          publication_status: publish_now ? 'published' : 'draft',
          product_type: mapProjectTypeToProductType(project.project_type),
        })
        .select('id')
        .single();

      if (createErr || !newProduct) {
        console.error('Product creation error:', createErr);
        return jsonError('Failed to create product', 500);
      }
      productId = newProduct.id;
    }

    // --- Link project to product ---
    await admin.from('ai_content_projects').update({
      linked_product_id: productId,
      status: publish_now ? 'published' : project.status,
      published_at: publish_now ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', project_id);

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: publish_now ? 'studio.project_published_as_product' : 'studio.project_linked_to_product',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: { product_id: productId, price: productPrice, publish_now },
    });

    return new Response(JSON.stringify({
      ok: true,
      product_id: productId,
      published: publish_now ?? false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-project-to-product error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function mapProjectTypeToProductType(projectType: string): string {
  switch (projectType) {
    case 'ebook': return 'ebook';
    case 'kids_book': return 'kids_book';
    case 'coloring_book': return 'coloring_book';
    case 'course_pack': return 'course';
    case 'sermon_pack': return 'sermon_pack';
    case 'bible_pack': return 'bible_pack';
    case 'marketing_pack': return 'marketing_pack';
    default: return 'ebook';
  }
}
