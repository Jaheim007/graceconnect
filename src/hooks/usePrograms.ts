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
        .select('*, program_modules(id, program_lessons(id))')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return (data || []).map((p: any) => ({
        ...p,
        module_count: p.program_modules?.length || 0,
        lesson_count: (p.program_modules || []).reduce(
          (s: number, m: any) => s + (m.program_lessons?.length || 0), 0),
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
        .select('*, organizations(name, slug, logo_url, currency, description, banner_url, is_verified, kyc_status, category, affiliation_enabled, affiliation_commission_percent)')
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
        .select('*, program_lessons(id, title, content_type, content, video_url, duration_minutes, display_order, content_url, is_free_preview, order_index)')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });
      return (data || []).map((m: any) => ({
        ...m,
        lessons: (m.program_lessons || []).sort((a: any, b: any) => (a.display_order || a.order_index || 0) - (b.display_order || b.order_index || 0)),
      }));
    },
    enabled: !!programId,
  });
}

// ─── Single Lesson ───
export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data } = await db.from('program_lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();
      return data;
    },
    enabled: !!lessonId,
  });
}

// ─── Lesson Attachments ───
export function useLessonAttachments(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-attachments', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      const { data } = await (db as any).from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });
      return data || [];
    },
    enabled: !!lessonId,
  });
}

// ─── Lesson Quiz ───
export function useLessonQuiz(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data } = await db.from('program_quizzes')
        .select('*, quiz_questions(*)')
        .eq('lesson_id', lessonId)
        .maybeSingle();
      if (!data) return null;
      return {
        ...data,
        questions: ((data as any).quiz_questions || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      };
    },
    enabled: !!lessonId,
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
    onSuccess: async (_, programId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['enrollment', programId] }),
        qc.invalidateQueries({ queryKey: ['my-enrolled-programs'] }),
        qc.invalidateQueries({ queryKey: ['my-enrollments'] }),
        qc.invalidateQueries({ queryKey: ['user-program-progress'] }),
      ]);
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
    mutationFn: async (payload: { organization_id: string; title: string; description?: string; cover_image_url?: string; is_published?: boolean; created_by: string; price?: number; currency?: string; is_free?: boolean }) => {
      const { data, error } = await db.from('programs').insert(payload as any).select('id').single();
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
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; description?: string; cover_image_url?: string; is_published?: boolean; price?: number; currency?: string; is_free?: boolean; certificate_enabled?: boolean; passing_score?: number; require_sequential_lessons?: boolean; require_assessment_for_cert?: boolean; assessment_enabled?: boolean; gamification_enabled?: boolean }) => {
      const { error } = await db.from('programs').update(payload as any).eq('id', id);
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
      // The course may have a mirror "digital product" used for checkout/Explore.
      // If we leave it behind, the deleted course keeps showing up in Explore.
      const { data: prog } = await db.from('programs')
        .select('linked_product_id')
        .eq('id', id)
        .maybeSingle();
      const productId = (prog as any)?.linked_product_id as string | null;

      // Buyers keep what they paid for. If anyone is enrolled, the course is
      // archived (unpublished + unlisted) instead of destroyed, so enrolled
      // learners keep their access and their progress.
      const { count: enrollmentCount } = await db.from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', id);

      if ((enrollmentCount ?? 0) > 0) {
        const { error: archiveError } = await db.from('programs')
          .update({ is_published: false } as any)
          .eq('id', id);
        if (archiveError) throw archiveError;
        if (productId) {
          await db.from('digital_products')
            .update({ is_published: false, publication_status: 'draft' } as any)
            .eq('id', productId);
        }
        return { archived: true, enrollments: enrollmentCount ?? 0 };
      }

      const { data: modules } = await db.from('program_modules').select('id').eq('program_id', id);
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (moduleIds.length > 0) {
        const { data: lessons } = await db.from('program_lessons').select('id').in('module_id', moduleIds);
        const lessonIds = (lessons || []).map((l: any) => l.id);
        if (lessonIds.length > 0) {
          await db.from('lesson_progress').delete().in('lesson_id', lessonIds);
          await (db as any).from('lesson_attachments').delete().in('lesson_id', lessonIds);
        }
        await db.from('program_lessons').delete().in('module_id', moduleIds);
      }
      await db.from('program_modules').delete().eq('program_id', id);
      const { error } = await db.from('programs').delete().eq('id', id);
      if (error) throw error;


      if (productId) {
        // Buyers keep their purchase records: if anyone ever paid, we only
        // unlist the product. Otherwise it is removed completely.
        const { count } = await db.from('product_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId);
        if ((count ?? 0) > 0) {
          await db.from('digital_products')
            .update({ is_published: false, publication_status: 'draft' } as any)
            .eq('id', productId);
        } else {
          await db.from('digital_products').delete().eq('id', productId);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
      qc.invalidateQueries({ queryKey: ['org-products'] });
    },

  });
}

// ─── Module CRUD ───
export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { program_id: string; title: string; description?: string; display_order?: number }) => {
      const insertPayload: any = {
        program_id: payload.program_id,
        title: payload.title,
        description: payload.description,
        order_index: payload.display_order ?? 0,
      };
      const { data, error } = await db.from('program_modules').insert(insertPayload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['program-modules', vars.program_id] });
    },
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId, ...payload }: { id: string; programId: string; title?: string; description?: string; order_index?: number }) => {
      const { error } = await db.from('program_modules').update(payload).eq('id', id);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
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
        await (db as any).from('lesson_attachments').delete().in('lesson_id', lessonIds);
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

// ─── Lesson CRUD ───
export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { module_id: string; title: string; content_type?: string; content_url?: string; video_url?: string; content?: string; duration_minutes?: number; display_order?: number; programId: string }) => {
      const { programId, display_order, ...rest } = payload;
      const insertPayload: any = { ...rest, order_index: display_order ?? 0 };
      const { data, error } = await db.from('program_lessons').insert(insertPayload).select('id').single();
      if (error) throw error;
      return { data, programId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['program-modules', result.programId] });
    },
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId, ...payload }: { id: string; programId: string; title?: string; content?: string; video_url?: string; content_type?: string; content_url?: string; duration_minutes?: number; is_free_preview?: boolean; order_index?: number }) => {
      const { error } = await db.from('program_lessons').update(payload as any).eq('id', id);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
      qc.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, programId }: { lessonId: string; programId: string }) => {
      await db.from('lesson_progress').delete().eq('lesson_id', lessonId);
      await (db as any).from('lesson_attachments').delete().eq('lesson_id', lessonId);
      const { error } = await db.from('program_lessons').delete().eq('id', lessonId);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
    },
  });
}

// ─── Attachment CRUD ───
export function useCreateAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { lesson_id: string; file_url: string; file_name: string; file_size?: number; mime_type?: string }) => {
      const { data, error } = await (db as any).from('lesson_attachments').insert(payload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['lesson-attachments', vars.lesson_id] });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lessonId }: { id: string; lessonId: string }) => {
      const { error } = await (db as any).from('lesson_attachments').delete().eq('id', id);
      if (error) throw error;
      return lessonId;
    },
    onSuccess: (lessonId) => {
      qc.invalidateQueries({ queryKey: ['lesson-attachments', lessonId] });
    },
  });
}

// ─── Quiz CRUD ───
export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { lesson_id: string; title: string; passing_score?: number }) => {
      const { data, error } = await db.from('program_quizzes').insert(payload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['lesson-quiz', vars.lesson_id] });
    },
  });
}

export function useCreateQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { quiz_id: string; question: string; options: any; correct_index: number; display_order?: number; lessonId: string }) => {
      const { lessonId, ...rest } = payload;
      const { data, error } = await db.from('quiz_questions').insert(rest).select('id').single();
      if (error) throw error;
      return { data, lessonId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['lesson-quiz'] });
    },
  });
}

export function useUpdateQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; question?: string; options?: any; correct_index?: number }) => {
      const { error } = await db.from('quiz_questions').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-quiz'] });
    },
  });
}

export function useDeleteQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-quiz'] });
    },
  });
}

// ─── Public: list published programs for an org ───
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

// ─── Clone / Duplicate Course ───
export function useCloneProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, organizationId, createdBy }: { programId: string; organizationId: string; createdBy: string }) => {
      // 1. Fetch original program
      const { data: original } = await db.from('programs')
        .select('*')
        .eq('id', programId)
        .single();
      if (!original) throw new Error('Program not found');

      // 2. Create clone (draft, unpublished)
      const { data: newProgram, error: pErr } = await db.from('programs').insert({
        organization_id: organizationId,
        title: `${(original as any).title} (Copy)`,
        description: (original as any).description,
        cover_image_url: (original as any).cover_image_url,
        is_published: false,
        created_by: createdBy,
        price: (original as any).price,
        currency: (original as any).currency,
        is_free: (original as any).is_free,
        certificate_enabled: (original as any).certificate_enabled,
      } as any).select('id').single();
      if (pErr) throw pErr;

      // 3. Fetch modules & lessons
      const { data: modules } = await db.from('program_modules')
        .select('*, program_lessons(*)')
        .eq('program_id', programId)
        .order('order_index', { ascending: true });

      // 4. Clone modules and lessons
      for (const mod of (modules || [])) {
        const { data: newMod, error: mErr } = await db.from('program_modules').insert({
          program_id: (newProgram as any).id,
          title: (mod as any).title,
          description: (mod as any).description,
          order_index: (mod as any).order_index,
        } as any).select('id').single();
        if (mErr) continue;

        const lessons = ((mod as any).program_lessons || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
        for (const lesson of lessons) {
          await db.from('program_lessons').insert({
            module_id: (newMod as any).id,
            title: lesson.title,
            content: lesson.content,
            content_type: lesson.content_type,
            content_url: lesson.content_url,
            video_url: lesson.video_url,
            duration_minutes: lesson.duration_minutes,
            order_index: lesson.order_index,
            is_free_preview: lesson.is_free_preview,
          } as any);
        }
      }

      return newProgram;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}
