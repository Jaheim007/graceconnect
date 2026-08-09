import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { geminiGenerateText } from '../_shared/ai-gemini.ts';
import { SAFETY_SYSTEM_RULES, moderateMessage, safetyResponse, logSafetyFlag } from '../_shared/ai-safety.ts';

/**
 * AI Help for course title & description generation.
 * No credit cost — lightweight text generation via direct Gemini API.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { type, course_title, course_description, language = 'fr' } = await req.json();

    if (!type || !['title', 'description'].includes(type)) {
      return jsonResp({ error: 'type must be "title" or "description"' }, 400);
    }

    const isFr = language === 'fr';

    // Independent moderation of the user-supplied text (layer 2).
    const userText = `${course_title || ''}\n${course_description || ''}`;
    const verdict = await moderateMessage({ geminiKey: GEMINI_API_KEY, text: userText });
    if (verdict.flagged) {
      await logSafetyFlag({
        admin: adminClient(auth.supabaseUrl, auth.serviceKey),
        userId: auth.userId,
        surface: 'ai-course-help',
        verdict,
        text: userText,
        language,
      });
      return jsonResp({ ok: false, blocked: true, safety_category: verdict.category, error: safetyResponse(verdict.category, isFr) }, 200);
    }

    let prompt = '';

    if (type === 'title') {
      prompt = `Generate a compelling, marketing-ready course title based on this context:
Current title/prompt: "${course_title || ''}"
Description: "${course_description || ''}"

Requirements:
- ${isFr ? 'Write in FRENCH' : 'Write in ENGLISH'}
- Make it catchy, professional, and concise (max 80 characters)
- It should make someone want to enroll immediately
- Return ONLY the title text, nothing else`;
    } else {
      prompt = `Generate a professional marketing description for this online course:
Title: "${course_title || ''}"
Current description: "${course_description || ''}"

Requirements:
- ${isFr ? 'Write in FRENCH' : 'Write in ENGLISH'}
- 2-4 sentences maximum
- Highlight what the learner will gain
- Professional, compelling tone
- Return ONLY the description text, nothing else`;
    }

    const result = await geminiGenerateText({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      system: `You are a marketing copywriter specializing in online education. ${isFr ? 'Write exclusively in French.' : 'Write exclusively in English.'}\n\n${SAFETY_SYSTEM_RULES}`,
      prompt,
    });

    const cleaned = (result || '').trim().replace(/^["']|["']$/g, '');

    return jsonResp({ ok: true, result: cleaned });
  } catch (e: any) {
    console.error('[ai-course-help] Error:', e);
    if (e?.status === 429) return jsonResp({ error: 'Rate limit exceeded' }, 429);
    return jsonResp({ error: e.message || 'Internal error' }, e.status || 500);
  }
});
