import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';
import { openaiGenerateImageBase64 } from '../_shared/ai-openai.ts';
import { geminiGenerateText } from '../_shared/ai-gemini.ts';

const ACTION_KEY = 'ai_course_structure';
const IMAGE_GEN_CONCURRENCY = 2;
const IMAGE_BUCKET = 'media';
const FUNCTION_HARD_DEADLINE_MS = 280_000;
const IMAGE_MIN_REMAINING_MS = 60_000;

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

function tryParseCourseJson(rawContent: string): any | null {
  if (!rawContent) return null;

  const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1] : rawContent;
  candidate = candidate
    .replace(/[\u0000-\u0019\u007F]/g, '')
    .trim();

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    candidate = candidate.slice(start, end + 1);
  }

  try {
    return JSON.parse(candidate);
  } catch {
    let repaired = candidate;
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
    repaired = repaired.replace(/\r?\n/g, '\\n');

    const opens = (repaired.match(/{/g) || []).length;
    const closes = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < opens - closes; i++) repaired += '}';

    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { title, description, target_audience, language, tier = 'standard', module_count = 5, generate_images = false, audience_level = 'intermediate' } = body;

    const functionStartedAt = Date.now();
    const remainingBudgetMs = () => FUNCTION_HARD_DEADLINE_MS - (Date.now() - functionStartedAt);

    if (!title?.trim()) return jsonResp({ error: 'Title is required' }, 400);

    const creditTier = normalizeTier(tier);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!OPENAI_API_KEY && !GEMINI_API_KEY) return jsonResp({ error: 'No AI provider configured' }, 500);

    console.log('[ai-generate-course] Start', {
      userId,
      tier: creditTier,
      module_count,
      generate_images,
      title_len: String(title || '').length,
    });

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
        // ─── Audience level complexity mapping ───
        const audienceLevelMap: Record<string, string> = {
          beginner: isFr
            ? 'Débutant — Utilise un vocabulaire simple, des analogies du quotidien, et explique chaque concept comme si c\'était la première fois. Pas de jargon technique sans définition.'
            : 'Beginner — Use simple vocabulary, everyday analogies, and explain every concept as if for the first time. No technical jargon without definition.',
          intermediate: isFr
            ? 'Intermédiaire — Suppose une connaissance de base du sujet. Introduis des concepts plus nuancés avec des exemples concrets.'
            : 'Intermediate — Assume basic knowledge of the subject. Introduce more nuanced concepts with concrete examples.',
          advanced: isFr
            ? 'Avancé — Suppose une bonne maîtrise. Approfondis avec des analyses critiques, des cas complexes, et des perspectives multiples.'
            : 'Advanced — Assume strong mastery. Deepen with critical analysis, complex cases, and multiple perspectives.',
          professional: isFr
            ? 'Professionnel — Orienté mise en pratique immédiate. Inclus des frameworks, méthodologies, et études de cas réels du milieu professionnel.'
            : 'Professional — Oriented toward immediate practical application. Include frameworks, methodologies, and real-world professional case studies.',
          academic: isFr
            ? 'Académique — Rigueur intellectuelle maximale. Cite des théories reconnues, des chercheurs, et des publications. Encourage l\'esprit critique.'
            : 'Academic — Maximum intellectual rigor. Cite recognized theories, researchers, and publications. Encourage critical thinking.',
          youth: isFr
            ? 'Jeune public — Langage très accessible, ludique, avec des exemples tirés de la vie des jeunes. Ton encourageant et dynamique.'
            : 'Youth audience — Very accessible, fun language with examples from young people\'s lives. Encouraging and dynamic tone.',
        };
        const audienceInstruction = audienceLevelMap[audience_level] || audienceLevelMap.intermediate;

        // ─── Domain detection for context-aware references ───
        const domainDetectionPrompt = `
DOMAIN-AWARE INTELLIGENCE — CRITICAL INSTRUCTION:
Analyze the course topic and AUTOMATICALLY detect the domain. Based on the domain, include RELEVANT authoritative references throughout the lesson content.

## If the topic relates to CHRISTIANITY, theology, church leadership, or biblical teaching:
- Include Bible verse references (e.g., John 3:16, Romans 12:2, Matthew 5:14-16)
- Format as: <blockquote><strong>📖 [Book Chapter:Verse]</strong> — "[Verse text]"</blockquote>
- Add contextual theological explanations of how the verse supports the teaching point
- Include at least 1-2 scripture references per lesson where relevant

## If the topic relates to ISLAM:
- Include Qur'an references (Surah + Ayah, e.g., Surah Al-Baqarah 2:286)
- Include Hadith references where appropriate (e.g., Sahih Bukhari)
- Format as: <blockquote><strong>📖 [Surah Name Ayah:Number]</strong> — "[Text]"</blockquote>
- Provide contextual explanations aligned with Islamic teachings

## If the topic is ACADEMIC or SCIENTIFIC:
- Reference recognized experts and pioneers (e.g., Alan Turing, Isaac Newton, Geoffrey Hinton)
- Include well-known theories and their historical context
- Reference research concepts, methodologies, and publications
- Format as: <blockquote><strong>📚 [Expert Name, Year]</strong> — [Key contribution or quote]</blockquote>

## If the topic is BUSINESS, ENTREPRENEURSHIP, MARKETING, or TECHNOLOGY:
- Include practical frameworks (SWOT analysis, product-market fit, marketing funnels, growth loops)
- Reference real-world case studies and implementation strategies
- Include actionable methodologies and step-by-step approaches
- Format as: <blockquote><strong>💼 Framework:</strong> [Name] — [Brief description and application]</blockquote>

## For ALL domains:
- References MUST be ACCURATE — never invent verses, quotes, or sources
- Clearly label interpretations as such
- Respect cultural and religious sensitivity
- When uncertain about exact text, reference the source without fabricating content`;

        const systemPrompt = `You are an ELITE INSTRUCTIONAL DESIGNER and PROFESSIONAL COURSE ARCHITECT. You design courses that rival university-level programs and professional training academies. You combine pedagogical science with engaging micro-learning principles.

CRITICAL: ALL content MUST be written in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'}. Every title, description, question, option, explanation — everything in ${isFr ? 'French' : 'English'}.

## AUDIENCE LEVEL
${audienceInstruction}

${domainDetectionPrompt}

Return ONLY valid JSON with this exact structure:
{
  "course_title": "A compelling marketing-ready title for the course in ${isFr ? 'French' : 'English'}",
  "course_description": "A professional 2-3 sentence marketing description in ${isFr ? 'French' : 'English'}",
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description (1-2 sentences explaining the learning objective)",
      "emoji": "🎯",
      "lessons": [
        {
          "title": "Lesson title",
          "content_type": "text",
          "duration_minutes": 10,
          "description": "Brief lesson description",
          "image_prompt": "A vivid English description for AI image generation: professional illustration showing [specific scene related to lesson content], modern flat design style, educational context",
          "content": "FULL HTML LESSON CONTENT (see structure below)"
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
        "explanation": "Detailed explanation of why this answer is correct, with reference to lesson content."
      }
    ]
  }
}

## MANDATORY LESSON STRUCTURE (each lesson MUST follow this flow):

### 1. INTRODUCTION (1 paragraph)
<h2>🎯 [Concept Name]</h2>
<p>A compelling hook that explains WHY this concept matters and what the learner will gain. Connect to real-world relevance.</p>

### 2. DETAILED EXPLANATION (2-3 paragraphs with sub-headings)
<h3>💡 [Core Concept]</h3>
<p>Clear, structured explanation with depth. Use <strong>bold</strong> for key terms. Break complex ideas into digestible pieces.</p>
<h3>[Supporting Details]</h3>
<p>Expand with nuances, conditions, or layers of understanding.</p>

### 3. EXAMPLE or CASE STUDY (1-2 paragraphs)
<h3>📋 ${isFr ? 'Exemple pratique' : 'Practical Example'}</h3>
<p>A concrete, relatable example or mini case study that illustrates the concept in action. Make it specific and memorable.</p>

### 4. KEY TAKEAWAYS
<h3>🔑 ${isFr ? 'Points clés' : 'Key Takeaways'}</h3>
<ul><li><strong>[Takeaway 1]</strong> — Brief explanation</li><li><strong>[Takeaway 2]</strong> — Brief explanation</li><li><strong>[Takeaway 3]</strong> — Brief explanation</li></ul>

### 5. REFLECTION QUESTION (optional but encouraged)
<h3>🤔 ${isFr ? 'Question de réflexion' : 'Reflection Question'}</h3>
<p><em>[A thought-provoking question that encourages the learner to apply the concept to their own context]</em></p>

### 6. INTERACTIVE ELEMENTS (embedded after relevant sections)
Quiz, Flashcard, Matching, etc. (see gamification rules below)

## COURSE ARCHITECTURE:
- Create ${module_count} modules following a clear pedagogical progression:
  * Module 1: Foundations & Introduction
  * Module 2-${Math.max(2, module_count - 2)}: Core Concepts (progressive complexity)
  * Module ${Math.max(3, module_count - 1)}: Practical Applications & Case Studies
  * Module ${module_count}: Synthesis, Exercises & Next Steps
- Each module: 2-3 lessons
- Each lesson: 5-15 minutes of reading time
- "course_title" should be a MARKETING-READY title (compelling, concise, professional) — NOT the raw prompt
- "course_description" should be a marketing description explaining what the learner will gain
- "image_prompt" for each lesson should be a vivid description in ENGLISH for AI image generation

## CONTENT DEPTH REQUIREMENTS:
- Each lesson MUST have at least 4-6 HTML sections (h2/h3 headings)
- Include SPECIFIC examples, not generic statements
- Use data points, statistics, or concrete numbers when relevant
- Reference domain-appropriate authorities (see domain detection above)
- Each section should be 50-120 words (richer than a summary, digestible for mobile)

## SLIDE COMPATIBILITY:
- Each h2/h3 section doubles as a potential slide
- Include a "🔑 ${isFr ? 'Points clés' : 'Key Takeaways'}" section per lesson (bullet-point highlights ideal for slide summaries)
- Keep individual sections self-contained so they can be displayed as standalone slides

## GAMIFICATION & INTERACTIVE ELEMENTS:
- QUIZ: 1-2 per lesson: <!-- QUIZ:{"question":"...","options":["A","B","C"],"correctIndex":0,"explanation":"..."} -->
- FLASHCARD: 1 per lesson: <!-- FLASHCARD:{"front":"Term or question","back":"Definition or answer"} -->
- MATCHING: 1 per module: <!-- MATCHING:{"pairs":[{"left":"Term","right":"Definition"},{"left":"Term2","right":"Definition2"}]} --> (min 3 pairs)
- ORDERING: optional: <!-- ORDERING:{"instruction":"...","items":["Step 1","Step 2","Step 3"],"correctOrder":[0,1,2]} -->
- FILL-IN-BLANK: 1 per module: <!-- FILLINBLANK:{"sentence":"The ___ is key","answer":"word","hint":"hint","acceptableAnswers":["alt"]} -->
- Place interactive elements AFTER the content they test
- Each quiz: 3-4 options, one correct (correctIndex 0-based)

## FINAL ASSESSMENT:
- 8-10 comprehensive multiple-choice questions covering ALL modules
- Questions should test understanding AND application, not just memorization
- Each question MUST have exactly 4 options
- Mix difficulty: 30% easy, 40% medium, 30% hard
- Include scenario-based questions that require applying learned concepts

## CONTENT STYLE:
- ALL text in ${isFr ? 'FRENCH' : 'ENGLISH'}
- HTML only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>. NO markdown.
- Tone: authoritative yet conversational and motivating
- Use emojis sparingly in headings (🎯, 💡, 🔑, ⚡, 📋, 🤔, 📖)
- The quiz JSON must be valid JSON inside the HTML comment`;


        const userPrompt = `Design a PROFESSIONAL, IN-DEPTH course as an expert instructional designer:

COURSE TOPIC: ${title}
${description ? `ADDITIONAL CONTEXT: ${description}` : ''}
${target_audience ? `TARGET AUDIENCE: ${target_audience}` : ''}
AUDIENCE LEVEL: ${audience_level}
NUMBER OF MODULES: ${module_count}

MANDATORY REQUIREMENTS:
- Write ALL content in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'} — the user's prompt is in ${isFr ? 'French' : 'English'}.
- Generate a compelling "course_title" (marketing-ready) and "course_description" (2-3 sentences).
- For each lesson include an "image_prompt" in English for AI image generation.
- Each lesson MUST follow the full structure: Introduction → Detailed Explanation → Example/Case Study → Key Takeaways → Reflection Question → Interactive elements.
- DETECT THE DOMAIN and include appropriate references (Bible verses for Christian topics, Qur'an for Islamic topics, expert citations for academic topics, frameworks for business topics).
- Include a final_assessment with 8-10 comprehensive questions.
- Each lesson should have 4-6 sections with substantive content (50-120 words per section).
- Return ONLY valid JSON with no markdown fences.
- 2-3 lessons per module, each with rich pedagogical content.
- Make it feel like a professional training program — deep, structured, and actionable.`;

        const openaiModel = creditTier === 'premium' && !generate_images
          ? 'gpt-4o'
          : 'gpt-4o-mini';
        const geminiModel = creditTier === 'premium'
          ? 'gemini-2.5-pro'
          : 'gemini-2.5-flash';

        const requestCourseCompletion = async (promptText: string, maxTokens: number, preferredTimeoutMs: number) => {
          const budgetMs = remainingBudgetMs();
          const safeTimeoutMs = Math.min(preferredTimeoutMs, Math.max(15_000, budgetMs - 8_000));
          if (safeTimeoutMs <= 15_000) {
            const err = new Error('Server timeout budget reached. Please retry with a shorter prompt.');
            (err as any).status = 504;
            throw err;
          }

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText },
          ];

          // TEXT: Gemini FIRST (cheaper), OpenAI fallback
          const providers = [
            {
              name: 'Gemini',
              isAvailable: () => Boolean(GEMINI_API_KEY),
              generate: async () => {
                const content = await geminiGenerateText({
                  apiKey: GEMINI_API_KEY!,
                  model: geminiModel,
                  system: systemPrompt,
                  prompt: promptText,
                  maxOutputTokens: maxTokens,
                  jsonMode: true,
                });

                return {
                  choices: [
                    {
                      message: {
                        content,
                      },
                    },
                  ],
                };
              },
            },
            {
              name: 'OpenAI',
              isAvailable: () => Boolean(OPENAI_API_KEY),
              generate: async () => {
                const aiController = new AbortController();
                const aiTimeout = setTimeout(() => aiController.abort(), safeTimeoutMs);
                try {
                  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: openaiModel,
                      max_tokens: maxTokens,
                      messages,
                    }),
                    signal: aiController.signal,
                  });

                  if (!aiResponse.ok) {
                    const errText = await aiResponse.text();
                    const err = new Error('OpenAI request failed');
                    (err as any).status = aiResponse.status;
                    (err as any).detail = errText;
                    throw err;
                  }

                  return await aiResponse.json();
                } finally {
                  clearTimeout(aiTimeout);
                }
              },
            },
          ];

          let lastError: any = null;

          for (const provider of providers) {
            if (!provider.isAvailable()) {
              console.warn(`[ai-generate-course] Skipping ${provider.name}: no API key`);
              continue;
            }

            try {
              console.log(`[ai-generate-course] Trying ${provider.name}`);
              const aiData = await provider.generate();
              console.log(`[ai-generate-course] Success with ${provider.name}`);
              return aiData;
            } catch (fetchErr: any) {
              const status = Number(fetchErr?.status || 0);
              const detail = String(fetchErr?.detail || fetchErr?.message || '').toLowerCase();
              console.error(`[ai-generate-course] ${provider.name} error:`, status, fetchErr?.detail || fetchErr?.message || fetchErr);

              if (fetchErr?.name === 'AbortError') {
                const err = new Error('AI generation timed out. Please retry.');
                (err as any).status = 504;
                throw err;
              }

              const shouldFallback = status === 429 || status >= 500 || detail.includes('insufficient_quota') || detail.includes('quota');
              if (shouldFallback) {
                console.warn(`[ai-generate-course] ${provider.name} unavailable/quota hit, trying fallback...`);
                lastError = fetchErr;
                continue;
              }

              if (status === 402) {
                const err = new Error('AI credits exhausted');
                (err as any).status = 402;
                throw err;
              }

              throw fetchErr;
            }
          }

          if (lastError) throw lastError;
          throw new Error('No AI provider available');
        };

        const aiData = await requestCourseCompletion(userPrompt, 16_000, 90_000);
        const content = aiData.choices?.[0]?.message?.content || '';

        let parsed: any = tryParseCourseJson(content);

        if (!parsed) {
          console.warn('[ai-generate-course] Primary output malformed, retrying with compact constraints');
          const retryPrompt = `${userPrompt}\n\nRETRY MODE (MANDATORY):\n- Return STRICT valid JSON only.\n- Keep response compact to avoid truncation.\n- EXACTLY 2 lessons per module.\n- EXACTLY 3 sections per lesson (Introduction, Core Content, Key Takeaways).\n- EXACTLY 1 quiz comment per lesson.\n- EXACTLY 6 final assessment questions.\n- Still include domain-appropriate references where relevant.`;
          const retryData = await requestCourseCompletion(retryPrompt, 8_000, 50_000);
          const retryContent = retryData.choices?.[0]?.message?.content || '';
          parsed = tryParseCourseJson(retryContent);

          if (!parsed) {
            const jsonPreview = (retryContent || content || '').trim();
            console.error('[ai-generate-course] JSON repair failed. First 500 chars:', jsonPreview.slice(0, 500));
            console.error('[ai-generate-course] Last 500 chars:', jsonPreview.slice(-500));
            throw new Error('AI returned malformed JSON that could not be repaired');
          }
        }

        if (!parsed.modules || !Array.isArray(parsed.modules)) {
          throw new Error('Invalid AI response structure');
        }

        return parsed;
      },
    });

    console.log('[ai-generate-course] Structure generated', {
      modules: Array.isArray(result?.modules) ? result.modules.length : 0,
      remaining_budget_ms: remainingBudgetMs(),
    });

    // ─── Image generation (after structure, per lesson) ───
    let imagesGenerated = 0;
    if (generate_images && result?.modules) {
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

      const imageJobs: Array<{ lesson: any; imagePrompt: string }> = [];
      for (const mod of result.modules) {
        for (const lesson of (mod.lessons || [])) {
          if (lesson?.image_prompt) imageJobs.push({ lesson, imagePrompt: lesson.image_prompt });
        }
      }

      let nextJob = 0;
      let creditsExhausted = false;

      const worker = async () => {
        while (!creditsExhausted) {
          if (remainingBudgetMs() <= IMAGE_MIN_REMAINING_MS) {
            console.warn('[ai-generate-course] Skipping remaining image jobs to avoid edge timeout');
            return;
          }

          const idx = nextJob++;
          if (idx >= imageJobs.length) return;

          const { lesson, imagePrompt } = imageJobs[idx];

          // Debit credits per image
          let imgDebited = 0;
          try {
            const debitResult = await consumeCreditsOrThrow({
              admin,
              userId,
              actionKey: 'ai_course_image',
              tier: creditTier,
              metadata: { lesson_title: lesson.title },
            });
            if (!('skipped' in debitResult)) imgDebited = debitResult.debited;
          } catch (e: any) {
            if (e?.status === 402) {
              creditsExhausted = true;
              console.warn(`[ai-generate-course] Credits exhausted for images at lesson "${lesson.title}"`);
              return;
            }
            throw e;
          }

          try {
            const budgetMs = remainingBudgetMs();
            if (budgetMs <= IMAGE_MIN_REMAINING_MS) {
              throw new Error('Not enough time remaining for image generation');
            }

            const imageTimeoutMs = Math.min(30_000, Math.max(12_000, budgetMs - 10_000));
            const { base64, mimeType } = await aiGenerateImageBase64({
              geminiKey: GEMINI_API_KEY || '',
              prompt: `Professional educational illustration: ${imagePrompt}. Clean, modern, flat design style. No text in the image.`,
              timeoutMs: imageTimeoutMs,
            });

            const ext = imageExtFromMime(mimeType);
            const imagePath = `ai/courses/${userId}/${crypto.randomUUID()}.${ext}`;
            const bytes = decodeBase64(base64);

            const { error: uploadErr } = await admin.storage
              .from(IMAGE_BUCKET)
              .upload(imagePath, bytes, { contentType: mimeType, upsert: false });
            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
            const imageUrl = publicUrlData?.publicUrl;
            if (!imageUrl) throw new Error('Image upload succeeded but no public URL was returned');

            lesson.content = `<div class="lesson-hero-image"><img src="${imageUrl}" alt="${lesson.title}" loading="lazy" style="width:100%;border-radius:12px;margin-bottom:16px;" /></div>${lesson.content}`;
            imagesGenerated++;
          } catch (imgErr: any) {
            if (String(imgErr?.message || '').includes('Not enough time remaining')) {
              console.warn('[ai-generate-course] Time budget reached during image generation, returning partial images');
              if (imgDebited > 0) {
                try {
                  await refundCreditsAsBonus({
                    admin,
                    userId,
                    amount: imgDebited,
                    source: 'ai_course_image',
                    expiresInDays: 30,
                  });
                } catch (_) {
                  // no-op
                }
              }
              return;
            }

            console.error(`[ai-generate-course] Image gen error for "${lesson.title}":`, imgErr);
            if (imgDebited > 0) {
              try {
                await refundCreditsAsBonus({
                  admin,
                  userId,
                  amount: imgDebited,
                  source: 'ai_course_image',
                  expiresInDays: 30,
                });
              } catch (_) {
                // no-op
              }
            }
          }
        }
      };

      const workerCount = Math.min(IMAGE_GEN_CONCURRENCY, imageJobs.length || 1);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    }

    console.log('[ai-generate-course] Completed', {
      images_generated: imagesGenerated,
      elapsed_ms: Date.now() - functionStartedAt,
      remaining_budget_ms: remainingBudgetMs(),
    });

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
