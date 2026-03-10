import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { org_id, project_id, style, consistency_mode, tier } = await req.json();
    if (!org_id || !project_id) return jsonResp({ error: 'org_id and project_id required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Permission
    const { data: member } = await admin.from('organization_members').select('role').eq('user_id', auth.userId).eq('organization_id', org_id).maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) return jsonResp({ error: 'Forbidden' }, 403);

    // Load project
    const { data: project, error: projErr } = await admin.from('ai_content_projects').select('*').eq('id', project_id).eq('organization_id', org_id).single();
    if (projErr || !project) return jsonResp({ error: 'Project not found' }, 404);

    const dataJson = (project.data_json || project.structure_json || {}) as any;
    const chapters = dataJson.chapters || [];
    if (chapters.length === 0) return jsonResp({ error: 'No chapters/pages found' }, 400);

    const creditTier = normalizeTier(tier);
    const assetsCreated: string[] = [];
    const artStyle = style || project.art_style || 'colorful children illustration';
    const characterDesc = project.characters || '';
    const ageRange = project.age_range || '4-8';
    const isKids = project.project_type === 'kids_book';
    const moral = project.moral || '';

    const styleGuide = isKids
      ? `Style: ${artStyle}. Target age: ${ageRange}. Safe for children, colorful, warm, friendly. ${characterDesc ? `Characters: ${characterDesc}` : ''} ${moral ? `Moral: ${moral}` : ''}`
      : `Style: ${artStyle}.`;

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const title = chapter.title || `Page ${i + 1}`;

      // Debit credits per image
      try {
        await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: 'generate_illustration', tier: creditTier });
      } catch (e: any) {
        if (e?.status === 402) {
          console.warn(`Credits exhausted at image ${i}/${chapters.length}`);
          break;
        }
        throw e;
      }

      let imagePrompt = `Create a professional book illustration for a page titled "${title}". ${styleGuide}`;
      if (chapter.content) {
        const snippet = (chapter.content as string).replace(/<[^>]*>/g, '').slice(0, 300);
        imagePrompt += ` Scene: ${snippet}`;
      }
      if (isKids && consistency_mode !== false) {
        imagePrompt += ` Maintain exact same character designs and art style across all pages.`;
      }

      try {
        const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt: imagePrompt, timeoutMs: 60_000 });
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const storagePath = `${org_id}/${project_id}/images/page-${i}-${Date.now()}.${ext}`;

        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        await admin.storage.from('org-uploads').upload(storagePath, imageBytes, { contentType: mimeType, upsert: true });

        const { data: asset } = await admin.from('ai_assets').upsert({
          org_id, job_id: null, project_id, asset_type: 'image',
          storage_bucket: 'org-uploads', storage_path: storagePath,
          mime_type: mimeType,
          metadata: { page_index: i, title, style: artStyle, is_kids: isKids },
        }, { onConflict: 'storage_bucket,storage_path' }).select('id').single();

        if (asset) assetsCreated.push(asset.id);

        // Rate limit protection
        if (i < chapters.length - 1) await new Promise(r => setTimeout(r, 2000));
      } catch (imgErr) {
        console.error(`Image gen error page ${i}:`, imgErr);
        continue;
      }
    }

    // Audit
    await admin.from('audit_logs').insert({
      user_id: auth.userId, action: 'studio.images_generated',
      resource_type: 'ai_content_project', resource_id: project_id,
      organization_id: org_id,
      metadata: { assets_created: assetsCreated.length, style: artStyle },
    });

    return jsonResp({ ok: true, assets_created: assetsCreated.length, asset_ids: assetsCreated });
  } catch (e) {
    console.error('ai-generate-images error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
