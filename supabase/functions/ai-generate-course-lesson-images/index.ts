import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

const IMAGE_BUCKET = 'media';
const MAX_LESSON_IMAGES = 5;
const FUNCTION_HARD_DEADLINE_MS = 120_000;
const IMAGE_MIN_REMAINING_MS = 12_000;

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

function escapeAttribute(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);
    const { program_id, lessons = [], tier = 'standard' } = await req.json();

    if (!program_id) return jsonResp({ error: 'program_id is required' }, 400);
    if (!Array.isArray(lessons)) return jsonResp({ error: 'lessons must be an array' }, 400);

    const creditTier = normalizeTier(tier);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!OPENAI_API_KEY && !GEMINI_API_KEY) return jsonResp({ error: 'No AI image provider configured' }, 500);

    const { data: program, error: programErr } = await admin
      .from('programs')
      .select('id, created_by')
      .eq('id', program_id)
      .maybeSingle();

    if (programErr) throw programErr;
    if (!program) return jsonResp({ error: 'Program not found' }, 404);
    if (program.created_by && program.created_by !== userId) return jsonResp({ error: 'Forbidden' }, 403);

    const startedAt = Date.now();
    const remainingBudgetMs = () => FUNCTION_HARD_DEADLINE_MS - (Date.now() - startedAt);

    const requestedLessons = lessons
      .filter((lesson: any) => lesson?.id && lesson?.image_prompt)
      .slice(0, MAX_LESSON_IMAGES);

    if (!requestedLessons.length) {
      return jsonResp({ ok: true, images_generated: 0, skipped: 0, failed: 0 });
    }

    const { data: modules, error: modulesErr } = await admin
      .from('program_modules')
      .select('id')
      .eq('program_id', program_id);

    if (modulesErr) throw modulesErr;
    const moduleIds = (modules || []).map((module: any) => module.id);
    if (!moduleIds.length) {
      return jsonResp({ ok: true, images_generated: 0, skipped: requestedLessons.length, failed: 0 });
    }

    const requestedLessonIds = requestedLessons.map((lesson: any) => lesson.id);
    const { data: lessonRows, error: lessonsErr } = await admin
      .from('program_lessons')
      .select('id, title, content, module_id')
      .in('id', requestedLessonIds)
      .in('module_id', moduleIds);

    if (lessonsErr) throw lessonsErr;

    const lessonMap = new Map((lessonRows || []).map((lesson: any) => [lesson.id, lesson]));

    let imagesGenerated = 0;
    let skipped = 0;
    let failed = 0;
    let creditsExhausted = false;

    const refundImageCredits = async (amount: number) => {
      if (amount <= 0) return;
      try {
        await refundCreditsAsBonus({
          admin,
          userId,
          amount,
          source: 'ai_course_image',
          expiresInDays: 30,
        });
      } catch (_) {
        // no-op
      }
    };

    for (const requestLesson of requestedLessons) {
      if (creditsExhausted || remainingBudgetMs() <= IMAGE_MIN_REMAINING_MS) {
        skipped += 1;
        continue;
      }

      const lesson = lessonMap.get(requestLesson.id);
      if (!lesson) {
        skipped += 1;
        continue;
      }

      if (String(lesson.content || '').includes('lesson-hero-image')) {
        skipped += 1;
        continue;
      }

      let imgDebited = 0;
      try {
        const debitResult = await consumeCreditsOrThrow({
          admin,
          userId,
          actionKey: 'ai_course_image',
          tier: creditTier,
          idempotencyKey: `course-image-${program_id}-${lesson.id}`,
          metadata: { program_id, lesson_id: lesson.id, lesson_title: lesson.title },
        });
        if (!('skipped' in debitResult)) imgDebited = debitResult.debited;
      } catch (error: any) {
        if (error?.status === 402) {
          creditsExhausted = true;
          skipped += 1;
          continue;
        }
        throw error;
      }

      try {
        const budgetMs = remainingBudgetMs();
        if (budgetMs <= IMAGE_MIN_REMAINING_MS) {
          await refundImageCredits(imgDebited);
          skipped += 1;
          continue;
        }

        const timeoutMs = Math.min(20_000, Math.max(8_000, budgetMs - 8_000));
        const { base64, mimeType } = await aiGenerateImageBase64({
          geminiKey: GEMINI_API_KEY || '',
          openaiKey: OPENAI_API_KEY || undefined,
          prompt: `Professional educational lesson illustration in 16:9 landscape format: ${requestLesson.image_prompt}. Clean, modern, purposeful visual. No text, labels, letters, or watermarks. Suitable as a lesson header image.`,
          timeoutMs,
        });

        const ext = imageExtFromMime(mimeType);
        const imagePath = `ai/courses/${program_id}/${lesson.id}-${crypto.randomUUID()}.${ext}`;
        const bytes = decodeBase64(base64);

        const { error: uploadErr } = await admin.storage
          .from(IMAGE_BUCKET)
          .upload(imagePath, bytes, { contentType: mimeType, upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
        const imageUrl = publicUrlData?.publicUrl;
        if (!imageUrl) throw new Error('Image upload succeeded but no public URL was returned');

        const hero = `<div class="lesson-hero-image"><img src="${imageUrl}" alt="${escapeAttribute(lesson.title || requestLesson.title || 'Lesson image')}" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:16px;" /></div>`;
        const nextContent = `${hero}${lesson.content || ''}`;

        const { error: updateErr } = await admin
          .from('program_lessons')
          .update({ content: nextContent })
          .eq('id', lesson.id);
        if (updateErr) throw updateErr;

        imagesGenerated += 1;
      } catch (error: any) {
        failed += 1;
        await refundImageCredits(imgDebited);

        const status = Number(error?.status || 0);
        const message = String(error?.message || '');
        console.error(`[ai-generate-course-lesson-images] Failed for lesson ${lesson.id}:`, error);

        if (status === 429 || status >= 500 || message.includes('Abort')) {
          break;
        }
      }
    }

    return jsonResp({
      ok: true,
      images_generated: imagesGenerated,
      skipped,
      failed,
    });
  } catch (error: any) {
    console.error('[ai-generate-course-lesson-images] Error:', error);
    return jsonResp({ error: error?.message || 'Internal error' }, error?.status || 500);
  }
});
