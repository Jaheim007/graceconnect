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

    const { org_id, project_id, voice, language_code } = await req.json();
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

    // --- Check TTS provider ---
    const TTS_PROVIDER = Deno.env.get('TTS_PROVIDER');
    const TTS_API_KEY = Deno.env.get('TTS_API_KEY');

    if (!TTS_PROVIDER || !TTS_API_KEY) {
      // No TTS provider configured - return structured info for future implementation
      return new Response(JSON.stringify({
        ok: false,
        message: 'Audio generation requires TTS_PROVIDER and TTS_API_KEY secrets to be configured.',
        supported_providers: ['elevenlabs', 'google_tts', 'azure_tts'],
        setup_instructions: [
          '1. Choose a TTS provider (ElevenLabs recommended for quality)',
          '2. Add TTS_PROVIDER secret (e.g., "elevenlabs")',
          '3. Add TTS_API_KEY secret with your API key',
          '4. Retry audio generation',
        ],
      }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Parse chapters for narration ---
    const dataJson = (project.data_json || project.structure_json || {}) as any;
    const chapters = dataJson.chapters || [];

    if (chapters.length === 0) {
      return jsonError('No chapters found for audio narration', 400);
    }

    const lang = language_code || project.language || 'fr';
    const selectedVoice = voice || 'default';
    const assetsCreated: string[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const plainText = (chapter.content || '')
        .replace(/<[^>]*>/g, '') // strip HTML
        .replace(/\s+/g, ' ')
        .trim();

      if (!plainText || plainText.length < 10) continue;

      try {
        let audioData: ArrayBuffer | null = null;

        if (TTS_PROVIDER === 'elevenlabs') {
          const ttsRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + selectedVoice, {
            method: 'POST',
            headers: {
              'xi-api-key': TTS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: plainText.slice(0, 5000), // ElevenLabs limit
              model_id: 'eleven_multilingual_v2',
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          });

          if (!ttsRes.ok) {
            console.error(`TTS error for chapter ${i}:`, ttsRes.status);
            continue;
          }
          audioData = await ttsRes.arrayBuffer();
        }
        // Add more providers here as needed

        if (audioData) {
          const storagePath = `${org_id}/${project_id}/audio/chapter-${i}-${Date.now()}.mp3`;
          await admin.storage.from('org-uploads').upload(storagePath, audioData, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

          const { data: asset } = await admin.from('ai_assets').upsert({
            org_id,
            project_id,
            asset_type: 'audio',
            storage_bucket: 'org-uploads',
            storage_path: storagePath,
            mime_type: 'audio/mpeg',
            metadata: {
              chapter_index: i,
              title: chapter.title,
              voice: selectedVoice,
              language: lang,
              text_length: plainText.length,
            },
          }, { onConflict: 'storage_bucket,storage_path' }).select('id').single();

          if (asset) assetsCreated.push(asset.id);
        }

        // Rate limit protection
        if (i < chapters.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }

      } catch (ttsErr) {
        console.error(`Audio generation error chapter ${i}:`, ttsErr);
        continue;
      }
    }

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.audio_generated',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: {
        assets_created: assetsCreated.length,
        voice: selectedVoice,
        language: lang,
        provider: TTS_PROVIDER,
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
    console.error('ai-generate-audio error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
