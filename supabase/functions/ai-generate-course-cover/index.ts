import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const { title, description, tier = 'standard', org_id } = await req.json();
    if (!title?.trim()) return jsonResp({ error: 'Title is required' }, 400);

    const creditTier = normalizeTier(tier);
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    const imageUrl = await consumeCreditsWithRefund({
      admin, userId,
      actionKey: 'generate_cover',
      tier: creditTier,
      idempotencyKey: `course-cover-${userId}-${Date.now()}`,
      metadata: { title, type: 'course_cover' },
      action: async () => {
        const prompt = `Create a professional, modern course cover image in wide 16:9 landscape format for a learning platform.
Title: "${title}"
${description ? `Topic: ${description.replace(/<[^>]*>/g, '').slice(0, 200)}` : ''}

Requirements:
- Professional educational/corporate design
- Clean, modern aesthetic with bold colors
- NO text or words in the image — purely visual/graphic
- Abstract or illustrative representation of the topic
- Suitable as a course thumbnail/banner
- High quality, visually striking composition
- Framed for a 1280x720 style cover without important content near the edges`;

        const { base64, mimeType } = await aiGenerateImageBase64({
          geminiKey: GEMINI_API_KEY || '',
          prompt,
          size: '1792x1024',
          timeoutMs: 120_000,
        });

        // Upload to storage
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const storagePath = `programs/${org_id || 'general'}/cover-${Date.now()}.${ext}`;
        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        const { error: uploadErr } = await admin.storage
          .from('org-uploads')
          .upload(storagePath, imageBytes, { contentType: mimeType, upsert: true });

        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        const { data: urlData } = admin.storage.from('org-uploads').getPublicUrl(storagePath);
        return urlData.publicUrl;
      },
    });

    return jsonResp({ ok: true, url: imageUrl });
  } catch (e: any) {
    console.error('[ai-generate-course-cover] Error:', e);
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Rate limit exceeded' }, 429);
    return jsonResp({ error: e.message || 'Internal error' }, e.status || 500);
  }
});
