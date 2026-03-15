import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';

/**
 * AI Help for course title & description generation.
 * No credit cost — lightweight text generation.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { type, course_title, course_description, language = 'fr' } = await req.json();

    if (!type || !['title', 'description'].includes(type)) {
      return jsonResp({ error: 'type must be "title" or "description"' }, 400);
    }

    const isFr = language === 'fr';
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

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: `You are a marketing copywriter specializing in online education. ${isFr ? 'Write exclusively in French.' : 'Write exclusively in English.'}` },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return jsonResp({ error: 'Rate limit exceeded' }, 429);
      if (aiResponse.status === 402) return jsonResp({ error: 'Credits exhausted' }, 402);
      throw new Error('AI generation failed');
    }

    const data = await aiResponse.json();
    const result = (data.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');

    return jsonResp({ ok: true, result });
  } catch (e: any) {
    console.error('[ai-course-help] Error:', e);
    return jsonResp({ error: e.message || 'Internal error' }, e.status || 500);
  }
});
