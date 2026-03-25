import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

// ─── Module Quiz CRUD ───
export function useModuleQuiz(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['module-quiz', moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      if (!moduleId) return null;
      const { data } = await db.from('program_quizzes')
        .select('*, quiz_questions(*)')
        .eq('module_id', moduleId)
        .maybeSingle();
      if (!data) return null;
      return {
        ...data,
        questions: ((data as any).quiz_questions || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      };
    },
  });
}

export function useCreateModuleQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { module_id: string; title: string; passing_score?: number; max_attempts?: number }) => {
      const { data, error } = await db.from('program_quizzes').insert({
        module_id: payload.module_id,
        title: payload.title,
        passing_score: payload.passing_score || 60,
        max_attempts: payload.max_attempts,
        quiz_type: 'module_end',
      } as any).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['module-quiz', vars.module_id] });
    },
  });
}

export function useUpdateModuleQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moduleId, ...payload }: { id: string; moduleId: string; title?: string; passing_score?: number; max_attempts?: number | null }) => {
      const { error } = await db.from('program_quizzes').update(payload as any).eq('id', id);
      if (error) throw error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      qc.invalidateQueries({ queryKey: ['module-quiz', moduleId] });
    },
  });
}

export function useDeleteModuleQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const { error } = await db.from('program_quizzes').delete().eq('id', id);
      if (error) throw error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      qc.invalidateQueries({ queryKey: ['module-quiz', moduleId] });
    },
  });
}

// ─── Quiz Questions ───
export function useAddQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      quiz_id: string;
      question: string;
      options: any;
      correct_index: number;
      question_type?: string;
      explanation?: string;
      correct_text?: string;
      display_order?: number;
    }) => {
      const { data, error } = await db.from('quiz_questions').insert(payload as any).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-quiz'] });
    },
  });
}

export function useUpdateQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; question?: string; options?: any; correct_index?: number; question_type?: string; explanation?: string; correct_text?: string }) => {
      const { error } = await db.from('quiz_questions').update(payload as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-quiz'] });
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
      qc.invalidateQueries({ queryKey: ['module-quiz'] });
    },
  });
}

// ─── Quiz Attempts ───
export function useQuizAttempts(quizId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quiz-attempts', quizId, user?.id],
    enabled: !!quizId && !!user,
    queryFn: async () => {
      const { data } = await db.from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId!)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });
      return data || [];
    },
  });
}

export function useSubmitQuizAttempt() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      quiz_id: string;
      score: number;
      passed: boolean;
      answers: any;
      total_questions: number;
      correct_count: number;
      attempt_number: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db.from('quiz_attempts').insert({
        ...payload,
        user_id: user.id,
      } as any).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['quiz-attempts', vars.quiz_id] });
    },
  });
}

// ─── Module Flashcards ───
export function useModuleFlashcards(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['module-flashcards', moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      if (!moduleId) return [];
      const { data } = await (db as any).from('module_flashcards')
        .select('*')
        .eq('module_id', moduleId)
        .order('display_order', { ascending: true });
      return data || [];
    },
  });
}

export function useAddFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { module_id: string; front_text: string; back_text: string; display_order?: number }) => {
      const { data, error } = await (db as any).from('module_flashcards').insert(payload).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-flashcards'] });
    },
  });
}

export function useUpdateFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; front_text?: string; back_text?: string }) => {
      const { error } = await (db as any).from('module_flashcards').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-flashcards'] });
    },
  });
}

export function useDeleteFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (db as any).from('module_flashcards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-flashcards'] });
    },
  });
}
