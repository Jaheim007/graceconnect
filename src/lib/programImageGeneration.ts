import { supabase } from '@/integrations/supabase/client';

export interface DeferredCourseLessonImageJob {
  id: string;
  title: string;
  imagePrompt: string;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_LESSON_IMAGES_PER_BATCH = 5;

function chunkJobs<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function shouldRetryImageQueue(result: { data: any; error: any }, attempt: number) {
  if (attempt > 0) return false;

  const status = Number(
    result.error?.context?.status ||
    result.error?.status ||
    result.data?.status ||
    0,
  );

  const message = String(result.error?.message || result.data?.error || '').toLowerCase();
  return (
    RETRYABLE_STATUSES.has(status) ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('abort')
  );
}

export async function queueDeferredCourseLessonImages(opts: {
  programId: string;
  lessonJobs: DeferredCourseLessonImageJob[];
  sessionToken: string;
  tier?: 'standard' | 'premium';
}) {
  const jobs = opts.lessonJobs
    .filter((job) => job.id && job.imagePrompt?.trim())
    .map((job) => ({
      id: job.id,
      title: job.title,
      image_prompt: job.imagePrompt,
    }));

  if (!jobs.length) {
    return { queued: false, data: null, error: null };
  }

  const aggregate = {
    ok: true,
    images_generated: 0,
    generated_lesson_ids: [] as string[],
    failed_lesson_ids: [] as string[],
    skipped: 0,
    failed: 0,
  };

  const batchErrors: string[] = [];

  for (const batch of chunkJobs(jobs, MAX_LESSON_IMAGES_PER_BATCH)) {
    let lastResult: { data: any; error: any } = { data: null, error: null };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      lastResult = await supabase.functions.invoke('ai-generate-course-lesson-images', {
        headers: { Authorization: `Bearer ${opts.sessionToken}` },
        body: {
          program_id: opts.programId,
          tier: opts.tier || 'standard',
          lessons: batch,
        },
      });

      if (!shouldRetryImageQueue(lastResult, attempt)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    if (lastResult.error || lastResult.data?.error) {
      aggregate.failed += batch.length;
      aggregate.failed_lesson_ids.push(...batch.map((lesson) => lesson.id));
      batchErrors.push(String(lastResult.error?.message || lastResult.data?.error || 'Lesson image generation failed'));

      const failedStatus = Number(lastResult.error?.context?.status || lastResult.error?.status || lastResult.data?.status || 0);
      if (failedStatus === 402 || failedStatus === 403) break;
      continue;
    }

    aggregate.images_generated += Number(lastResult.data?.images_generated || 0);
    aggregate.skipped += Number(lastResult.data?.skipped || 0);
    aggregate.failed += Number(lastResult.data?.failed || 0);
    aggregate.generated_lesson_ids.push(...(Array.isArray(lastResult.data?.generated_lesson_ids) ? lastResult.data.generated_lesson_ids : []));
    aggregate.failed_lesson_ids.push(...(Array.isArray(lastResult.data?.failed_lesson_ids) ? lastResult.data.failed_lesson_ids : []));

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return {
    queued: true,
    error: null,
    data: {
      ...aggregate,
      error: aggregate.images_generated === 0 && batchErrors.length > 0 ? batchErrors[0] : undefined,
    },
  };
}
