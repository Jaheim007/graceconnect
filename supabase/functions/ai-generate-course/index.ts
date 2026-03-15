import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';

const ACTION_KEY = 'ai_course_structure';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { title, description, target_audience, language = 'fr', tier = 'standard', module_count = 5, generate_images = false } = body;

    if (!title?.trim()) return jsonResp({ error: 'Title is required' }, 400);

    const creditTier = normalizeTier(tier);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const isFr = language === 'fr';

    const result = await consumeCreditsWithRefund({
      admin,
      userId,
      actionKey: ACTION_KEY,
      tier: creditTier,
      idempotencyKey: `course-${userId}-${Date.now()}`,
      metadata: { title, module_count, generate_images },
      action: async () => {
        const systemPrompt = `You are an expert micro-learning course designer. Generate a professional course with SHORT, DIGESTIBLE lesson content and EMBEDDED QUIZ QUESTIONS in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description",
      "lessons": [
        {
          "title": "Lesson title",
          "content_type": "text",
          "duration_minutes": 10,
          "description": "Brief lesson description",
          "content": "<h2>Section Title</h2><p>Short paragraph (2-3 sentences max).</p><p>Another short paragraph with a key insight.</p><h3>Key Concept</h3><p>Brief explanation.</p><ul><li>Point 1</li><li>Point 2</li></ul><!-- QUIZ:{\"question\":\"What is the main concept?\",\"options\":[\"Option A\",\"Option B\",\"Option C\"],\"correctIndex\":1,\"explanation\":\"Option B is correct because...\"} --><h3>Next Concept</h3><p>Brief content...</p><!-- QUIZ:{\"question\":\"Another question?\",\"options\":[\"Choice 1\",\"Choice 2\",\"Choice 3\",\"Choice 4\"],\"correctIndex\":0,\"explanation\":\"Explanation here.\"} -->"
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS FOR MICRO-LEARNING:
- Create ${module_count} modules with 3-5 lessons each
- KEEP EACH SECTION SHORT: max 2-3 short paragraphs per <h2> or <h3> section (50-100 words per section)
- Each lesson should have 3-5 short sections separated by <h2> or <h3> headings
- QUIZ QUESTIONS: Embed 2-3 quiz questions PER LESSON using HTML comments: <!-- QUIZ:{"question":"...","options":["A","B","C"],"correctIndex":0,"explanation":"..."} -->
- Place quizzes AFTER the content they test (between sections)
- Each quiz must have 3-4 options with exactly one correct answer (correctIndex is 0-based)
- Content must use proper HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>
- Write concise, impactful content — like a mobile learning app, NOT a textbook
- Each section should teach ONE concept clearly
- Use the language: ${isFr ? 'French' : 'English'}
- Duration should be 5-15 minutes per lesson
- DO NOT use markdown, only HTML tags
- The quiz JSON must be valid JSON inside the HTML comment`;

        const userPrompt = `Create a micro-learning course with SHORT digestible sections and EMBEDDED QUIZ questions for:
Title: ${title}
${description ? `Description/Context: ${description}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
Number of modules: ${module_count}

IMPORTANT: Keep each section very short (2-3 sentences). Users read this on mobile slides — one section per screen. Include 2-3 quiz questions per lesson embedded as <!-- QUIZ:{...} --> HTML comments between sections. Make it feel interactive and engaging like a mobile learning app.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: creditTier === 'premium' ? 'google/gemini-2.5-pro' : 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error('[ai-generate-course] AI error:', aiResponse.status, errText);
          if (aiResponse.status === 429) {
            const err = new Error('Rate limit exceeded, please try again later');
            (err as any).status = 429;
            throw err;
          }
          if (aiResponse.status === 402) {
            const err = new Error('AI credits exhausted');
            (err as any).status = 402;
            throw err;
          }
          throw new Error('AI generation failed');
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = content;
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];

        const parsed = JSON.parse(jsonStr.trim());
        if (!parsed.modules || !Array.isArray(parsed.modules)) {
          throw new Error('Invalid AI response structure');
        }

        return parsed;
      },
    });

    return jsonResp({ ok: true, ...result });
  } catch (err: any) {
    console.error('[ai-generate-course] Error:', err);
    const status = err.status || 500;
    return jsonResp({
      error: err.message || 'Internal error',
      credits_refunded: err.message?.includes('refund') || false,
    }, status);
  }
});
