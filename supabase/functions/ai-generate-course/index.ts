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
        const systemPrompt = `You are an expert course designer and content writer. Generate a COMPLETE professional course with FULL lesson content in JSON format.

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
          "duration_minutes": 15,
          "description": "Brief lesson description",
          "content": "<h2>Lesson Title</h2><p>Full lesson content here with multiple paragraphs...</p><h3>Sub-section</h3><p>More detailed content...</p><ul><li>Key point 1</li><li>Key point 2</li></ul><blockquote>Important takeaway or quote</blockquote><p>Conclusion paragraph...</p>"
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create ${module_count} modules with 3-5 lessons each
- Each lesson MUST have a "content" field with RICH HTML content (500-1500 words per lesson)
- Content must use proper HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>
- Content should be educational, detailed, actionable, and professional
- Each lesson should teach something concrete with examples
- Include practical exercises, tips, or actionable steps where relevant
- Lessons should progress from basic to advanced within each module
- Use the language: ${isFr ? 'French' : 'English'}
- Duration should be realistic (5-30 minutes per lesson)
- DO NOT use markdown, only HTML tags`;

        const userPrompt = `Create a COMPLETE professional course with FULL detailed lesson content for:
Title: ${title}
${description ? `Description/Context: ${description}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
Number of modules: ${module_count}

Remember: Each lesson must have complete, educational HTML content (not just a title). Write as if you're authoring a real online course textbook.`;

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
