import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

// ─── Programs ───
export function useOrgPrograms(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-programs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('programs')
        .select('*, program_modules(id)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return (data || []).map((p: any) => ({
        ...p,
        module_count: p.program_modules?.length || 0,
      }));
    },
    enabled: !!orgId,
  });
}

export function useProgram(programId: string | undefined) {
  return useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      if (!programId) return null;
      const { data } = await db.from('programs')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('id', programId)
        .maybeSingle();
      return data;
    },
    enabled: !!programId,
  });
}

export function useProgramModules(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-modules', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data } = await db.from('program_modules')
        .select('*, program_lessons(id, title, content_type, duration_minutes, display_order, content_url)')
        .eq('program_id', programId)
        .order('display_order', { ascending: true });
      return (data || []).map((m: any) => ({
        ...m,
        lessons: (m.program_lessons || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      }));
    },
    enabled: !!programId,
  });
}

// ─── Enrollment & Progress ───
export function useEnrollment(programId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['enrollment', programId, user?.id],
    queryFn: async () => {
      if (!programId || !user) return null;
      const { data } = await db.from('program_enrollments')
        .select('*')
        .eq('program_id', programId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!programId && !!user,
  });
}

export function useLessonProgress(programId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lesson-progress', programId, user?.id],
    queryFn: async () => {
      if (!programId || !user) return {};
      // Get all lesson IDs for this program
      const { data: modules } = await db.from('program_modules')
        .select('program_lessons(id)')
        .eq('program_id', programId);
      const lessonIds = (modules || []).flatMap((m: any) => (m.program_lessons || []).map((l: any) => l.id));
      if (lessonIds.length === 0) return {};

      const { data: progress } = await db.from('lesson_progress')
        .select('lesson_id, completed, completed_at')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      const map: Record<string, { completed: boolean; completed_at: string | null }> = {};
      (progress || []).forEach((p: any) => { map[p.lesson_id] = { completed: p.completed, completed_at: p.completed_at }; });
      return map;
    },
    enabled: !!programId && !!user,
  });
}

export function useEnrollInProgram() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('program_enrollments').insert({
        program_id: programId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, programId) => {
      qc.invalidateQueries({ queryKey: ['enrollment', programId] });
    },
  });
}

export function useToggleLessonComplete() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, completed, programId }: { lessonId: string; completed: boolean; programId: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (completed) {
        await db.from('lesson_progress').upsert({
          lesson_id: lessonId,
          user_id: user.id,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'lesson_id,user_id' });
      } else {
        await db.from('lesson_progress')
          .update({ completed: false, completed_at: null })
          .eq('lesson_id', lessonId)
          .eq('user_id', user.id);
      }
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', programId] });
    },
  });
}

// ─── Admin Mutations ───
export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { organization_id: string; title: string; description?: string; cover_image_url?: string; is_published?: boolean; created_by: string }) => {
      const { data, error } = await db.from('programs').insert(payload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; description?: string; cover_image_url?: string; is_published?: boolean }) => {
      const { error } = await db.from('programs').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
      qc.invalidateQueries({ queryKey: ['program'] });
    },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete lessons, modules, enrollments first
      const { data: modules } = await db.from('program_modules').select('id').eq('program_id', id);
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (moduleIds.length > 0) {
        const { data: lessons } = await db.from('program_lessons').select('id').in('module_id', moduleIds);
        const lessonIds = (lessons || []).map((l: any) => l.id);
        if (lessonIds.length > 0) {
          await db.from('lesson_progress').delete().in('lesson_id', lessonIds);
        }
        await db.from('program_lessons').delete().in('module_id', moduleIds);
      }
      await db.from('program_modules').delete().eq('program_id', id);
      await db.from('program_enrollments').delete().eq('program_id', id);
      const { error } = await db.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}

// Module CRUD
export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { program_id: string; title: string; display_order?: number }) => {
      const { data, error } = await db.from('program_modules').insert(payload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['program-modules', vars.program_id] });
    },
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, programId }: { moduleId: string; programId: string }) => {
      const { data: lessons } = await db.from('program_lessons').select('id').eq('module_id', moduleId);
      const lessonIds = (lessons || []).map((l: any) => l.id);
      if (lessonIds.length > 0) {
        await db.from('lesson_progress').delete().in('lesson_id', lessonIds);
      }
      await db.from('program_lessons').delete().eq('module_id', moduleId);
      const { error } = await db.from('program_modules').delete().eq('id', moduleId);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
    },
  });
}

// Lesson CRUD
export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { module_id: string; title: string; content_type?: string; content_url?: string; duration_minutes?: number; display_order?: number; programId: string }) => {
      const { programId, ...rest } = payload;
      const { data, error } = await db.from('program_lessons').insert(rest).select('id').single();
      if (error) throw error;
      return { data, programId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['program-modules', result.programId] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, programId }: { lessonId: string; programId: string }) => {
      await db.from('lesson_progress').delete().eq('lesson_id', lessonId);
      const { error } = await db.from('program_lessons').delete().eq('id', lessonId);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
    },
  });
}

// Public: list published programs for an org
export function usePublicPrograms(orgId: string | undefined) {
  return useQuery({
    queryKey: ['public-programs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('programs')
        .select('id, title, description, cover_image_url, created_at, program_modules(id, program_lessons(id))')
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      return (data || []).map((p: any) => {
        const totalLessons = (p.program_modules || []).reduce((s: number, m: any) => s + (m.program_lessons?.length || 0), 0);
        return { ...p, module_count: p.program_modules?.length || 0, lesson_count: totalLessons };
      });
    },
    enabled: !!orgId,
  });
}
