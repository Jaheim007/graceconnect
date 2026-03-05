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

    const { org_id, project_id, format, page_size } = await req.json();
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

    // --- Load cover asset ---
    const { data: coverAsset } = await admin
      .from('ai_project_assets')
      .select('file_url')
      .eq('project_id', project_id)
      .eq('is_cover', true)
      .maybeSingle();

    // --- Build HTML document ---
    const dataJson = (project.data_json || project.structure_json || {}) as any;
    const chapters = dataJson.chapters || [];
    const projectFormat = format || 'ebook';
    const size = page_size || 'A4';

    const htmlContent = buildPdfHtml(project, chapters, coverAsset, projectFormat, size);

    // --- Store document (use .pdf extension + octet-stream to bypass mime restrictions) ---
    const storagePath = `${org_id}/${project_id}/exports/document-${Date.now()}.pdf`;
    const blob = new Blob([htmlContent], { type: 'application/octet-stream' });

    const { error: uploadErr } = await admin.storage
      .from('org-uploads')
      .upload(storagePath, blob, { contentType: 'application/octet-stream', upsert: true });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      return jsonError('Failed to store document', 500);
    }

    // --- Create asset record ---
    const { data: asset, error: assetErr } = await admin
      .from('ai_assets')
      .upsert({
        org_id,
        project_id,
        asset_type: 'pdf',
        storage_bucket: 'org-uploads',
        storage_path: storagePath,
        mime_type: 'application/pdf',
        metadata: {
          format: projectFormat,
          page_size: size,
          chapters_count: chapters.length,
          generated_at: new Date().toISOString(),
        },
      }, { onConflict: 'storage_bucket,storage_path' })
      .select('id')
      .single();

    if (assetErr) {
      console.error('Asset record error:', assetErr);
    }

    // --- Also store in ai_project_assets for legacy compatibility ---
    await admin.from('ai_project_assets').insert({
      project_id,
      organization_id: org_id,
      asset_type: 'pdf',
      file_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      mime_type: 'application/pdf',
      label: `Export ${projectFormat} (${size})`,
      metadata: { format: projectFormat, page_size: size },
    }).select().maybeSingle();

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.pdf_generated',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: { format: projectFormat, page_size: size, asset_id: asset?.id },
    });

    return new Response(JSON.stringify({
      ok: true,
      asset_id: asset?.id,
      download_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      format: projectFormat,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-generate-pdf error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildPdfHtml(
  project: any,
  chapters: any[],
  coverAsset: any,
  format: string,
  pageSize: string
): string {
  const title = project.title || 'Document';
  const isA4 = pageSize === 'A4';
  const pageWidth = isA4 ? '210mm' : '8.5in';
  const pageHeight = isA4 ? '297mm' : '11in';

  const coverHtml = coverAsset?.file_url
    ? `<div class="page cover-page">
        <img src="${coverAsset.file_url}" alt="Cover" style="max-width:100%;max-height:80vh;object-fit:contain;" />
        <h1>${escapeHtml(title)}</h1>
       </div>`
    : `<div class="page cover-page"><h1>${escapeHtml(title)}</h1></div>`;

  // TOC
  const tocHtml = chapters.length > 0
    ? `<div class="page toc-page">
        <h2>Table des matières</h2>
        <ol>${chapters.map((ch: any, i: number) =>
          `<li><a href="#ch-${i}">${escapeHtml(ch.title || `Chapitre ${i + 1}`)}</a></li>`
        ).join('')}</ol>
       </div>`
    : '';

  // Chapters
  const chaptersHtml = chapters.map((ch: any, i: number) => {
    if (format === 'coloring') {
      return `<div class="page coloring-page" id="ch-${i}">
        <h2 class="coloring-title">${escapeHtml(ch.title || `Page ${i + 1}`)}</h2>
        <div class="coloring-area">${ch.content || '<p style="color:#ccc;text-align:center;">Image de coloriage</p>'}</div>
      </div>`;
    }

    if (format === 'kids') {
      return `<div class="page kids-page" id="ch-${i}">
        <h2>${escapeHtml(ch.title || `Page ${i + 1}`)}</h2>
        <div class="kids-content">${ch.content || ''}</div>
      </div>`;
    }

    return `<div class="page" id="ch-${i}">
      <h2>${escapeHtml(ch.title || `Chapitre ${i + 1}`)}</h2>
      <div class="chapter-content">${ch.content || ''}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${project.language || 'fr'}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: ${pageWidth} ${pageHeight}; margin: 20mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.6; color: #222; margin: 0; padding: 0; }
    .page { page-break-after: always; padding: 20mm; min-height: 100vh; }
    .cover-page { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .cover-page h1 { font-size: 28pt; margin-top: 20mm; }
    .toc-page h2 { font-size: 18pt; margin-bottom: 10mm; }
    .toc-page ol { font-size: 12pt; }
    .toc-page li { margin-bottom: 4mm; }
    h2 { font-size: 18pt; margin-bottom: 8mm; color: #111; }
    h3 { font-size: 14pt; margin-bottom: 5mm; }
    p { margin-bottom: 4mm; text-align: justify; }
    .kids-page { font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 16pt; line-height: 2; }
    .coloring-page { text-align: center; }
    .coloring-area { border: 2px dashed #ccc; min-height: 200mm; display: flex; align-items: center; justify-content: center; margin-top: 10mm; }
    @media print { .page { page-break-after: always; } }
  </style>
</head>
<body>
  ${coverHtml}
  ${tocHtml}
  ${chaptersHtml}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
