import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

const ACTION_KEY = 'ai_course_structure';
const IMAGE_GEN_CONCURRENCY = 4;
const IMAGE_BUCKET = 'media';

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function imageExtFromMime(mimeType: string): string {
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { title, description, target_audience, language, tier = 'standard', module_count = 5, generate_images = false } = body;

    if (!title?.trim()) return jsonResp({ error: 'Title is required' }, 400);

    const creditTier = normalizeTier(tier);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    // ─── Detect language from prompt (not from interface locale) ───
    // Simple heuristic: check for common French patterns in the title/description
    const textToAnalyze = `${title} ${description || ''}`.toLowerCase();
    const frenchPatterns = /\b(le|la|les|un|une|des|du|de|et|ou|est|sont|pour|dans|avec|sur|par|que|qui|ce|cette|ces|mon|ton|son|nous|vous|ils|elles|créer|comment|apprendre|formation|cours|comprendre|utiliser)\b/g;
    const englishPatterns = /\b(the|a|an|is|are|for|in|with|on|by|that|which|this|my|your|his|our|they|create|how|learn|course|understand|use|what|about)\b/g;
    const frenchMatches = (textToAnalyze.match(frenchPatterns) || []).length;
    const englishMatches = (textToAnalyze.match(englishPatterns) || []).length;
    
    // Use explicit language param as fallback, but prompt language takes priority
    const detectedLang = frenchMatches > englishMatches ? 'fr' : (englishMatches > frenchMatches ? 'en' : (language || 'fr'));
    const isFr = detectedLang === 'fr';

    const result = await consumeCreditsWithRefund({
      admin,
      userId,
      actionKey: ACTION_KEY,
      tier: creditTier,
      idempotencyKey: `course-${userId}-${Date.now()}`,
      metadata: { title, module_count, generate_images, detected_language: detectedLang },
      action: async () => {
        const systemPrompt = `You are an expert micro-learning course designer specializing in mobile-first, gamified education experiences. Generate a professional course with SHORT, DIGESTIBLE lesson content, EMBEDDED QUIZ QUESTIONS, and a FINAL ASSESSMENT in JSON format.

CRITICAL: ALL content MUST be written in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'}. Every title, description, question, option, explanation — everything in ${isFr ? 'French' : 'English'}.

Return ONLY valid JSON with this exact structure:
{
  "course_title": "A compelling marketing-ready title for the course in ${isFr ? 'French' : 'English'}",
  "course_description": "A professional 2-3 sentence marketing description in ${isFr ? 'French' : 'English'}",
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description",
      "emoji": "🎯",
      "lessons": [
        {
          "title": "Lesson title",
          "content_type": "text",
          "duration_minutes": 10,
          "description": "Brief lesson description",
          "image_prompt": "A vivid English description for AI image generation: professional illustration showing [specific scene related to lesson content], modern flat design style, educational context",
          "content": "<h2>Section Title</h2><p>Short paragraph (2-3 sentences max).</p><!-- QUIZ:{\\"question\\":\\"...\\",\\"options\\":[\\"A\\",\\"B\\",\\"C\\"],\\"correctIndex\\":1,\\"explanation\\":\\"...\\"} --><h3>Key Concept</h3><p>Brief explanation.</p><!-- QUIZ:{...} -->"
        }
      ]
    }
  ],
  "final_assessment": {
    "title": "${isFr ? 'Évaluation finale' : 'Final Assessment'}",
    "description": "${isFr ? 'Testez vos connaissances sur le cours' : 'Test your knowledge of the entire course'}",
    "questions": [
      {
        "question": "Comprehensive question about the course material?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 2,
        "explanation": "Explanation of the correct answer."
      }
    ]
  }
}

CRITICAL REQUIREMENTS FOR MICRO-LEARNING:
- Create ${module_count} modules with 3-5 lessons each
- KEEP EACH SECTION SHORT: max 2-3 short paragraphs per <h2> or <h3> section (50-100 words per section)
- Each lesson should have 3-5 short sections separated by <h2> or <h3> headings
- "course_title" should be a MARKETING-READY title (compelling, concise, professional) — NOT the raw prompt
- "course_description" should be a marketing description explaining what the learner will gain
- "image_prompt" for each lesson should be a vivid description in ENGLISH for AI image generation (even if course is in French)

GAMIFICATION & QUIZ RULES:
- QUIZ QUESTIONS: Embed 2-3 quiz questions PER LESSON using HTML comments: <!-- QUIZ:{"question":"...","options":["A","B","C"],"correctIndex":0,"explanation":"..."} -->
- Place quizzes AFTER the content they test (between sections)
- Each quiz must have 3-4 options with exactly one correct answer (correctIndex is 0-based)
- Make quizzes FUN and ENGAGING — use real-world scenarios, not boring textbook questions
- Include encouraging language in explanations
- Vary question types: true/false style, scenario-based, fill-in-the-blank style, "which of the following"

FINAL ASSESSMENT:
- Generate 8-12 comprehensive multiple-choice questions covering ALL modules
- Questions should test understanding, not just memorization
- Each question MUST have exactly 4 options
- Mix difficulty levels: 40% easy, 40% medium, 20% hard

CONTENT STYLE:
- ALL text content in ${isFr ? 'FRENCH' : 'ENGLISH'} — titles, content, quiz questions, explanations, everything
- Content must use proper HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>
- Write concise, impactful content — like a mobile learning app, NOT a textbook
- Each section should teach ONE concept clearly
- Duration should be 5-15 minutes per lesson
- DO NOT use markdown, only HTML tags
- The quiz JSON must be valid JSON inside the HTML comment
- Make the tone conversational and motivating
- Use emojis sparingly in headings for visual appeal (🎯, 💡, 🔑, ⚡, etc.)`;

        const userPrompt = `Create a micro-learning course with SHORT digestible sections, EMBEDDED QUIZ questions, and a FINAL ASSESSMENT for:
Prompt: ${title}
${description ? `Additional context: ${description}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
Number of modules: ${module_count}

IMPORTANT: 
- Write ALL content in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'} — the user's prompt is in ${isFr ? 'French' : 'English'}.
- Generate a compelling "course_title" (marketing-ready, not the raw prompt) and a "course_description" (2-3 sentences explaining what they'll learn).
- For each lesson, include an "image_prompt" in English describing a relevant illustration.
- Keep each section very short (2-3 sentences). Users read this on mobile slides — one section per screen.
- Include 2-3 quiz questions per lesson embedded as <!-- QUIZ:{...} --> HTML comments between sections.
- Include a final_assessment with 8-12 comprehensive questions covering the entire course.
- Make it feel interactive, engaging, and gamified like Duolingo or EdApp.`;

        const model = creditTier === 'premium' && !generate_images
          ? 'google/gemini-2.5-pro'
          : 'google/gemini-2.5-flash';

        const aiController = new AbortController();
        const aiTimeout = setTimeout(() => aiController.abort(), 95_000);

        let aiResponse: Response;
        try {
          aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              max_tokens: 7000,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
            signal: aiController.signal,
          });
        } catch (fetchErr: any) {
          if (fetchErr?.name === 'AbortError') {
            const err = new Error('AI generation timed out. Please retry.');
            (err as any).status = 504;
            throw err;
          }
          throw fetchErr;
        } finally {
          clearTimeout(aiTimeout);
        }

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
          if (aiResponse.status >= 500) {
            const err = new Error('AI provider temporarily unavailable. Please retry.');
            (err as any).status = 502;
            throw err;
          }
          throw new Error('AI generation failed');
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        // Parse JSON from response (handle markdown code blocks + repair)
        let jsonStr = content;
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];
        jsonStr = jsonStr.trim();

        // Attempt direct parse first
        let parsed: any;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (_firstErr) {
          // Repair common AI JSON issues
          let repaired = jsonStr;
          // Remove trailing commas before } or ]
          repaired = repaired.replace(/,\s*([}\]])/g, '$1');
          // Fix unescaped newlines inside strings
          repaired = repaired.replace(/(?<=":[ ]*"[^"]*)\n/g, '\\n');
          // Truncated JSON: try to close open braces/brackets
          const opens = (repaired.match(/{/g) || []).length;
          const closes = (repaired.match(/}/g) || []).length;
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
          for (let i = 0; i < opens - closes; i++) repaired += '}';
          try {
            parsed = JSON.parse(repaired);
          } catch (secondErr) {
            console.error('[ai-generate-course] JSON repair failed. First 500 chars:', jsonStr.slice(0, 500));
            console.error('[ai-generate-course] Last 500 chars:', jsonStr.slice(-500));
            throw new Error('AI returned malformed JSON that could not be repaired');
          }
        }

        if (!parsed.modules || !Array.isArray(parsed.modules)) {
          throw new Error('Invalid AI response structure');
        }

        return parsed;
      },
    });

    // ─── Image generation (after structure, per lesson) ───
    let imagesGenerated = 0;
    if (generate_images && result?.modules) {
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      
      for (const mod of result.modules) {
        for (const lesson of (mod.lessons || [])) {
          const imagePrompt = lesson.image_prompt;
          if (!imagePrompt) continue;

          // Debit credits per image
          let imgDebited = 0;
          try {
            const debitResult = await consumeCreditsOrThrow({
              admin, userId,
              actionKey: 'ai_course_image',
              tier: creditTier,
              metadata: { lesson_title: lesson.title },
            });
            if (!('skipped' in debitResult)) imgDebited = debitResult.debited;
          } catch (e: any) {
            if (e?.status === 402) {
              console.warn(`[ai-generate-course] Credits exhausted for images at lesson "${lesson.title}"`);
              break;
            }
            throw e;
          }

          try {
            const { base64, mimeType } = await aiGenerateImageBase64({
              geminiKey: GEMINI_API_KEY || '',
              prompt: `Professional educational illustration: ${imagePrompt}. Clean, modern, flat design style. No text in the image.`,
              timeoutMs: 60_000,
            });

            // Convert to data URL for inline use (stored in lesson content)
            const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            // Prepend image to lesson content
            lesson.content = `<div class="lesson-hero-image"><img src="${dataUrl}" alt="${lesson.title}" style="width:100%;border-radius:12px;margin-bottom:16px;" /></div>${lesson.content}`;
            imagesGenerated++;

            // Rate limit protection
            await new Promise(r => setTimeout(r, 2000));
          } catch (imgErr) {
            console.error(`[ai-generate-course] Image gen error for "${lesson.title}":`, imgErr);
            if (imgDebited > 0) {
              try { await refundCreditsAsBonus({ admin, userId, amount: imgDebited, source: 'ai_course_image', expiresInDays: 30 }); } catch (_) {}
            }
            continue;
          }
        }
      }
    }

    return jsonResp({ ok: true, ...result, images_generated: imagesGenerated });
  } catch (err: any) {
    console.error('[ai-generate-course] Error:', err);
    const status = err.status || 500;
    return jsonResp({
      error: err.message || 'Internal error',
      credits_refunded: err.message?.includes('refund') || false,
    }, status);
  }
});
