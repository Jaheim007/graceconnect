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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const { org_id, project_id, style, consistency_mode } = await req.json();
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

    if (!LOVABLE_API_KEY) {
      return jsonError('LOVABLE_API_KEY not configured. Image generation requires AI gateway.', 500);
    }

    // --- Parse scenes/pages ---
    const dataJson = (project.data_json || project.structure_json || {}) as any;
    const chapters = dataJson.chapters || [];

    if (chapters.length === 0) {
      return jsonError('No chapters/pages found in project', 400);
    }

    const assetsCreated: string[] = [];
    const artStyle = style || project.art_style || 'colorful children illustration';
    const characterDesc = project.characters || '';
    const ageRange = project.age_range || '4-8';
    const isKids = project.project_type === 'kids_book';
    const moral = project.moral || '';

    // --- Build a consistent style prompt for kids books ---
    const styleGuide = isKids
      ? `Style: ${artStyle}. Target age: ${ageRange} years old. 
         The illustration MUST be: safe for children, colorful, warm, friendly, expressive characters with big eyes.
         NO scary elements, NO violence, NO realistic humans in distress.
         ${characterDesc ? `Characters to maintain consistently across all pages: ${characterDesc}` : ''}
         ${moral ? `Story moral: ${moral}` : ''}`
      : `Style: ${artStyle}.`;

    // --- Generate images for each chapter/page ---
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const title = chapter.title || `Page ${i + 1}`;

      // Build image prompt
      let imagePrompt = `Create a professional book illustration for a page titled "${title}". ${styleGuide}`;

      if (chapter.content) {
        const contentSnippet = (chapter.content as string)
          .replace(/<[^>]*>/g, '')
          .slice(0, 300);
        imagePrompt += ` Scene to illustrate: ${contentSnippet}`;
      }

      // Add consistency instructions for kids books
      if (isKids && consistency_mode !== false) {
        imagePrompt += ` IMPORTANT: Maintain exact same character designs, proportions, colors, and art style as previous pages for visual consistency throughout the book.`;
      }

      try {
        // Call Lovable AI Gateway with best image model
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-pro-image-preview',
            messages: [
              { role: 'user', content: imagePrompt },
            ],
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error(`Image gen error for page ${i}:`, aiRes.status, errText);

          if (aiRes.status === 429) {
            console.warn('Rate limited, stopping image generation');
            break;
          }
          if (aiRes.status === 402) {
            console.warn('Credits exhausted, stopping image generation');
            break;
          }
          continue;
        }

        const aiData = await aiRes.json();
        const choice = aiData.choices?.[0]?.message;

        // Handle different response formats (base64, URL, or text description)
        let imageData: string | null = null;
        let mimeType = 'text/plain';
        let ext = 'txt';

        // Check for inline_data (base64 image)
        if (choice?.content && Array.isArray(choice.content)) {
          const imgPart = choice.content.find((p: any) => p.type === 'image' || p.inline_data);
          if (imgPart?.inline_data) {
            imageData = imgPart.inline_data.data;
            mimeType = imgPart.inline_data.mime_type || 'image/png';
            ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
          }
        }

        // Fallback to text content
        if (!imageData && choice?.content) {
          const textContent = typeof choice.content === 'string' ? choice.content : JSON.stringify(choice.content);
          imageData = textContent;
        }

        if (imageData) {
          const storagePath = `${org_id}/${project_id}/images/page-${i}-${Date.now()}.${ext}`;
          
          let blob: Blob;
          if (ext !== 'txt' && imageData.length > 100) {
            // Base64 image data
            const binaryString = atob(imageData);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            blob = new Blob([bytes], { type: mimeType });
          } else {
            blob = new Blob([imageData], { type: 'text/plain' });
            mimeType = 'text/plain';
          }

          await admin.storage.from('org-uploads').upload(storagePath, blob, {
            contentType: mimeType,
            upsert: true,
          });

          const { data: asset } = await admin.from('ai_assets').upsert({
            org_id,
            job_id: null,
            project_id,
            asset_type: 'image',
            storage_bucket: 'org-uploads',
            storage_path: storagePath,
            mime_type: mimeType,
            metadata: {
              page_index: i,
              title,
              style: artStyle,
              prompt: imagePrompt.slice(0, 500),
              is_kids: isKids,
            },
          }, { onConflict: 'storage_bucket,storage_path' }).select('id').single();

          if (asset) assetsCreated.push(asset.id);
        }

        // Rate limit protection: delay between requests
        if (i < chapters.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }

      } catch (imgErr) {
        console.error(`Image generation error for page ${i}:`, imgErr);
        continue;
      }
    }

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.images_generated',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: {
        assets_created: assetsCreated.length,
        style: artStyle,
        consistency_mode: consistency_mode ?? false,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      assets_created: assetsCreated.length,
      asset_ids: assetsCreated,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-generate-images error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
