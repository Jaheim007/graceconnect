import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asUuid = (v?: string | null) => (v && UUID_RE.test(v) ? v : null);

export interface SaveSlideProgressInput {
  /** Flat index of the current slide in the whole course player */
  slideIndex: number;
  /** Total number of slides in the player (used only as a fallback) */
  totalSlides: number;
  /** Real `program_slides.id` of the current slide, when the lesson is slide-backed */
  slideId?: string | null;
  /** Real `program_lessons.id` of the current slide (null for synthetic slides) */
  lessonId?: string | null;
  /** Total countable slides in the course (slide rows + legacy parsed slides) */
  totalCountableSlides?: number;
  /**
   * Countable slides already reached that have NO slide row (legacy HTML
   * lessons). They cannot live in `completed_slides` (uuid[]), so they are
   * added to the numerator directly.
   */
  legacyCompletedCount?: number;
  starsEarned?: number;
  assessmentScore?: number;
  assessmentTotal?: number;
  completed?: boolean;
}

/** Save slide-level progress for a learner (slide completion + resume pointer) */
export function useSaveSlideProgress(programId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slideIndex,
      totalSlides,
      slideId,
      lessonId,
      totalCountableSlides,
      legacyCompletedCount = 0,
      starsEarned,
      assessmentScore,
      assessmentTotal,
      completed,
    }: SaveSlideProgressInput) => {
      if (!user) return;

      const { data: current } = await supabase
        .from('program_enrollments')
        .select('id, completed_slides')
        .eq('program_id', programId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!current) return;

      // De-duplicate: a revisited slide never appears twice.
      const completedSlides = new Set<string>((current.completed_slides || []) as string[]);
      const realSlideId = asUuid(slideId);
      if (realSlideId) completedSlides.add(realSlideId);

      const completedCount = completedSlides.size + Math.max(0, legacyCompletedCount);
      const denominator = totalCountableSlides && totalCountableSlides > 0 ? totalCountableSlides : 0;

      const progressPercent = denominator
        ? Math.min(100, Math.round((completedCount / denominator) * 100))
        : totalSlides > 0
          ? Math.min(100, Math.round(((slideIndex + 1) / totalSlides) * 100))
          : 0;

      const updatePayload: Record<string, any> = {
        last_slide_index: slideIndex,
        progress_percent: progressPercent,
        completed_slides: Array.from(completedSlides),
        current_slide_id: realSlideId,
        current_lesson_id: asUuid(lessonId),
        last_active_at: new Date().toISOString(),
      };

      if (starsEarned !== undefined) updatePayload.total_stars = starsEarned;
      if (assessmentScore !== undefined) updatePayload.assessment_score = assessmentScore;
      if (assessmentTotal !== undefined) updatePayload.assessment_total = assessmentTotal;
      if (completed) {
        updatePayload.status = 'completed';
        updatePayload.progress_percent = 100;
        updatePayload.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('program_enrollments')
        .update(updatePayload)
        .eq('id', current.id);

      if (error) console.error('[useSaveSlideProgress]', error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment', programId] });
      qc.invalidateQueries({ queryKey: ['enrollment-progress', programId] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
      qc.invalidateQueries({ queryKey: ['course-resume'] });
    },
  });
}


/** Save lesson-level completion */
export function useSaveLessonCompletion() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;

      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('lesson_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('lesson_progress')
          .insert({ lesson_id: lessonId, user_id: user.id, completed: true, completed_at: new Date().toISOString() });
      }
    },
  });
}

/** Get enrollment progress for current user */
export function useEnrollmentProgress(programId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment-progress', programId, user?.id],
    enabled: !!programId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('*')
        .eq('program_id', programId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });
}

/** Admin: get all enrollments for a program */
export function useProgramEnrollments(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-enrollments', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('*, profiles:user_id(display_name, avatar_url, email:id)')
        .eq('program_id', programId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });
}

/** Admin: get all enrollments for an org's programs */
export function useOrgEnrollmentStats(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-enrollment-stats', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, title')
        .eq('organization_id', orgId!);

      if (!programs?.length) return { programs: [], enrollments: [] };

      const programIds = programs.map(p => p.id);
      const { data: enrollments } = await supabase
        .from('program_enrollments')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .in('program_id', programIds);

      return { programs, enrollments: enrollments || [] };
    },
  });
}

/**
 * Issue the certificate for a course.
 *
 * Server-authoritative: the browser has no INSERT grant or policy on
 * program_certificates. All eligibility checks (enrollment, every slide
 * completed, and the course-level assessment threshold when required) run
 * inside public.issue_program_certificate(). Practice slide quizzes never
 * count toward eligibility.
 */
export function useIssueCertificate() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { programId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await issueProgramCertificate(payload.programId);
      if (!result.ok) {
        const err = new Error(result.error || 'issue_failed');
        (err as any).code = result.error;
        (err as any).details = result;
        throw err;
      }
      return result;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['certificate', vars.programId] });
      qc.invalidateQueries({ queryKey: ['program-certificate', vars.programId] });
      qc.invalidateQueries({ queryKey: ['enrollment', vars.programId] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

/** Get user's certificate for a program */
export function useCertificate(programId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certificate', programId, user?.id],
    enabled: !!programId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_certificates')
        .select('*')
        .eq('program_id', programId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });
}
