import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const duplicateCourseFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    program_id: string;
    org_id: string;
    translate?: boolean;
    target_language?: string | null;
    tier?: string | null;
  }) => {
    if (!input?.program_id) throw new Error('program_id required');
    if (!input?.org_id) throw new Error('org_id required');
    return {
      program_id: String(input.program_id),
      org_id: String(input.org_id),
      translate: Boolean(input.translate),
      target_language: input.target_language ?? null,
      tier: (input.tier ?? 'starter') as string,
    };
  })
  .handler(async ({ data, context }) => {
    const { duplicateCourse } = await import('./duplicateCourse.server');
    const { normalizeTier } = await import('@/lib/credits/credits.server');
    return duplicateCourse(context.userId, {
      program_id: data.program_id,
      org_id: data.org_id,
      translate: data.translate,
      target_language: data.target_language,
      tier: normalizeTier(data.tier),
    });
  });
