import { supabase } from '@/integrations/supabase/client';

export interface DeferredCourseLessonImageJob {
  id: string;
  title: string;
  imagePrompt: string;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

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
    .slice(0, 5)
    .map((job) => ({
      id: job.id,
      title: job.title,
      image_prompt: job.imagePrompt,
    }));

  if (!jobs.length) {
    return { queued: false, data: null, error: null };
  }

  let lastResult: { data: any; error: any } = { data: null, error: null };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    lastResult = await supabase.functions.invoke('ai-generate-course-lesson-images', {
      headers: { Authorization: `Bearer ${opts.sessionToken}` },
      body: {
        program_id: opts.programId,
        tier: opts.tier || 'standard',
        lessons: jobs,
      },
    });

    if (!shouldRetryImageQueue(lastResult, attempt)) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  return { queued: true, ...lastResult };
}
