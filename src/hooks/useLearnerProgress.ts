import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Save slide progress for a learner */
export function useSaveSlideProgress(programId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slideIndex,
      totalSlides,
      starsEarned,
      assessmentScore,
      assessmentTotal,
      completed,
    }: {
      slideIndex: number;
      totalSlides: number;
      starsEarned?: number;
      assessmentScore?: number;
      assessmentTotal?: number;
      completed?: boolean;
    }) => {
      if (!user) return;

      const progressPercent = Math.round(((slideIndex + 1) / totalSlides) * 100);

      const updatePayload: Record<string, any> = {
        last_slide_index: slideIndex,
        progress_percent: progressPercent,
      };

      if (starsEarned !== undefined) updatePayload.total_stars = starsEarned;
      if (assessmentScore !== undefined) updatePayload.assessment_score = assessmentScore;
      if (assessmentTotal !== undefined) updatePayload.assessment_total = assessmentTotal;
      if (completed) {
        updatePayload.status = 'completed';
        updatePayload.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('program_enrollments')
        .update(updatePayload)
        .eq('program_id', programId)
        .eq('user_id', user.id);

      if (error) console.error('[useSaveSlideProgress]', error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment', programId] });
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
        .select('*')
        .in('program_id', programIds);

      return { programs, enrollments: enrollments || [] };
    },
  });
}

/** Save certificate */
export function useSaveCertificate() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      programId: string;
      organizationId: string;
      learnerName: string;
      courseTitle: string;
      starsEarned: number;
      assessmentScore?: number;
      assessmentTotal?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if certificate already exists
      const { data: existing } = await supabase
        .from('program_certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('program_id', payload.programId)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from('program_certificates')
        .insert({
          user_id: user.id,
          program_id: payload.programId,
          organization_id: payload.organizationId,
          learner_name: payload.learnerName,
          course_title: payload.courseTitle,
          stars_earned: payload.starsEarned,
          assessment_score: payload.assessmentScore,
          assessment_total: payload.assessmentTotal,
        } as any)
        .select('id, certificate_number')
        .single();

      if (error) throw error;
      return data;
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
