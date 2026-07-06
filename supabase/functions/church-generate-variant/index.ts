// Generate a variant (summary, notes, whatsapp, ebook, reel script) from a
// sermon transcript. Owner-only. Uses Gemini with a locked, safety-first prompt.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { geminiGenerateText } from '../_shared/ai-gemini.ts';

const VARIANT_TYPES = ['summary', 'notes', 'whatsapp', 'ebook', 'reel', 'blog'] as const;
type VariantType = typeof VARIANT_TYPES[number];

const TYPE_INSTRUCTIONS: Record<VariantType, string> = {
  summary: 'A concise 3-paragraph summary of the sermon. Return JSON: { "title": string, "summary": string, "key_points": string[] }',
  notes: 'Structured sermon notes for church members. Return JSON: { "title": string, "outline": [{ "heading": string, "points": string[] }], "scriptures": string[], "reflection_questions": string[] }',
  whatsapp: 'A short WhatsApp message (max 500 chars) that shares the key message with an invitation to listen. Return JSON: { "message": string, "hashtags": string[] }',
  ebook: 'A long-form ebook chapter draft that faithfully expands the sermon. Return JSON: { "title": string, "introduction": string, "chapters": [{ "heading": string, "body": string }], "conclusion": string }',
  reel: 'A short-form video/reel script (30-60s). Return JSON: { "hook": string, "beats": [{ "line": string, "b_roll": string }], "call_to_action": string }',
  blog: 'A blog post based faithfully on the sermon. Return JSON: { "title": string, "excerpt": string, "body_markdown": string, "tags": string[] }',
};

const SYSTEM_PROMPT = `You are an assistant for SiteViral Church. You transform a preacher's sermon transcript into content variants.

STRICT RULES — never break these:
1. Preserve the preacher's exact message, doctrine, and intent. Never soften, contradict, or reinterpret.
2. NEVER invent scripture references, verses, testimonies, prophecies, statistics, quotes, or names. If it is not in the transcript, do not include it.
3. Quote scripture references EXACTLY as spoken. Do not fabricate book/chapter/verse.
4. If the transcript is unclear or incomplete, produce a shorter output rather than filling gaps with made-up content.
5. Use the same language as the transcript unless the user asks otherwise.
6. Output valid JSON only, matching the exact schema requested. No prose outside JSON.
7. All content is DRAFT. Do not add disclaimers unless present in the transcript.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY not configured' }, 500);

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { sermon_id, type, language } = await req.json().catch(() => ({}));
    if (!sermon_id) return json({ error: 'sermon_id required' }, 400);
    if (!VARIANT_TYPES.includes(type)) return json({ error: `type must be one of ${VARIANT_TYPES.join(', ')}` }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: sermon } = await db
      .from('church_sermons')
      .select('id, church_id, title, transcript, transcript_language, scripture_refs, preacher')
      .eq('id', sermon_id)
      .maybeSingle();
    if (!sermon) return json({ error: 'Sermon not found' }, 404);

    const { data: church } = await db
      .from('church_providers')
      .select('id, user_id')
      .eq('id', sermon.church_id)
      .maybeSingle();
    if (!church || church.user_id !== userId) return json({ error: 'Forbidden' }, 403);

    const transcript = (sermon.transcript || '').trim();
    if (transcript.length < 200) return json({ error: 'Transcript too short — transcribe the sermon first.' }, 400);

    const langHint = language || sermon.transcript_language || 'the transcript language';
    const scriptureHint = Array.isArray(sermon.scripture_refs) && sermon.scripture_refs.length
      ? `\n\nScripture references explicitly mentioned by the preacher (do not add others): ${sermon.scripture_refs.join(', ')}`
      : '';

    const prompt = `Sermon title: ${sermon.title || '(untitled)'}
Preacher: ${sermon.preacher || '(unspecified)'}
Output language: ${langHint}
Task: ${TYPE_INSTRUCTIONS[type as VariantType]}${scriptureHint}

TRANSCRIPT (source of truth):
"""
${transcript.slice(0, 24000)}
"""`;

    const raw = await geminiGenerateText({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.4,
      maxOutputTokens: type === 'ebook' ? 6000 : 2400,
      jsonMode: true,
    });

    let content: unknown;
    try {
      content = JSON.parse(raw);
    } catch {
      content = { raw };
    }

    const { data: variant, error: insErr } = await db
      .from('church_sermon_variants')
      .insert({
        sermon_id,
        type,
        content,
        status: 'ready',
        approval_status: 'draft',
        generated_by_model: 'gemini-2.5-flash',
        cost_credits: 1,
      })
      .select()
      .single();

    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, variant });
  } catch (e: any) {
    return json({ error: e?.message || 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
