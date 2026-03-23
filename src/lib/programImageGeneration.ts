import { supabase } from '@/integrations/supabase/client';

export interface DeferredCourseLessonImageJob {
  id: string;
  title: string;
  imagePrompt: string;
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

  const { data, error } = await supabase.functions.invoke('ai-generate-course-lesson-images', {
    headers: { Authorization: `Bearer ${opts.sessionToken}` },
    body: {
      program_id: opts.programId,
      tier: opts.tier || 'standard',
      lessons: jobs,
    },
  });

  return { queued: true, data, error };
}
