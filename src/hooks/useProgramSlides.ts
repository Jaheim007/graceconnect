import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  contentSlideToRow,
  type NewSlideInput,
  type ProgramSlideRow,
  type SlideType,
} from '@/components/programs/lesson-preview/slideAdapters';
import { parseContentIntoSlides } from '@/components/programs/lesson-preview/parseContentSlides';

const table = () => (db as any).from('program_slides');

function normalize(rows: any[]): ProgramSlideRow[] {
  return (rows || [])
    .map((r) => ({ ...r, data: r.data || {} }) as ProgramSlideRow)
    .sort((a, b) => a.display_order - b.display_order);
}

/** Slides for a single lesson */
export function useLessonSlides(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['program-slides', 'lesson', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      if (!lessonId) return [] as ProgramSlideRow[];
      const { data } = await table().select('*').eq('lesson_id', lessonId);
      return normalize(data);
    },
  });
}

/** All slides of a program, grouped by lesson id */
export function useProgramSlideMap(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-slides', 'program', programId],
    enabled: !!programId,
    queryFn: async () => {
      const map: Record<string, ProgramSlideRow[]> = {};
      if (!programId) return map;

      const { data: modules } = await db
        .from('program_modules')
        .select('id, program_lessons(id)')
        .eq('program_id', programId);
      const lessonIds = (modules || []).flatMap((m: any) => (m.program_lessons || []).map((l: any) => l.id));
      if (lessonIds.length === 0) return map;

      const { data } = await table().select('*').in('lesson_id', lessonIds);
      for (const row of normalize(data)) {
        (map[row.lesson_id] ||= []).push(row);
      }
      return map;
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['program-slides'] });
}

export function useCreateSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewSlideInput) => {
      const { data, error } = await table().insert(payload).select('*').single();
      if (error) throw error;
      return data as ProgramSlideRow;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ProgramSlideRow> & { id: string }) => {
      const { error } = await table().update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

/** Persist a new ordering for a lesson's slides */
export function useReorderSlides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) => table().update({ display_order: index }).eq('id', id)),
      );
    },
    onSuccess: () => invalidate(qc),
  });
}

/**
 * Convert a legacy HTML lesson into real slide rows (idempotent: skips lessons
 * that already have slides unless `force` is passed).
 */
export function useBackfillLessonSlides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, html, force }: { lessonId: string; html: string; force?: boolean }) => {
      const { data: existing } = await table().select('id').eq('lesson_id', lessonId);
      if (existing?.length && !force) return { created: 0 };
      if (existing?.length && force) {
        await table().delete().eq('lesson_id', lessonId);
      }

      const parsed = parseContentIntoSlides(html || '');
      if (parsed.length === 0) return { created: 0 };

      const rows = parsed.map((slide, i) => contentSlideToRow(slide, lessonId, i));
      const { error } = await table().insert(rows);
      if (error) throw error;
      return { created: rows.length };
    },
    onSuccess: () => invalidate(qc),
  });
}

export type { ProgramSlideRow, NewSlideInput, SlideType };

/**
 * One-time, idempotent migration of a program's legacy HTML lessons into
 * `program_slides` rows. Runs once per program per session for users who can
 * manage the org (RLS enforces that server-side).
 */
export function useEnsureProgramSlides(programId: string | undefined, enabled = true) {
  const qc = useQueryClient();
  const doneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!programId || !enabled || doneRef.current.has(programId)) return;
    doneRef.current.add(programId);

    let cancelled = false;

    (async () => {
      const { data: modules } = await db
        .from('program_modules')
        .select('id, program_lessons(id, content)')
        .eq('program_id', programId);

      const lessons = (modules || []).flatMap((m: any) => m.program_lessons || []);
      const withContent = lessons.filter((l: any) => (l.content || '').trim().length > 0);
      if (withContent.length === 0 || cancelled) return;

      const lessonIds = withContent.map((l: any) => l.id);
      const { data: existing } = await table().select('lesson_id').in('lesson_id', lessonIds);
      const alreadyMigrated = new Set((existing || []).map((r: any) => r.lesson_id));

      const rows: NewSlideInput[] = [];
      for (const lesson of withContent) {
        if (alreadyMigrated.has(lesson.id)) continue;
        const parsed = parseContentIntoSlides(lesson.content || '');
        parsed.forEach((slide, i) => rows.push(contentSlideToRow(slide, lesson.id, i)));
      }

      if (rows.length === 0 || cancelled) return;

      const { error } = await table().insert(rows);
      if (error) {
        // Not an admin (RLS) or transient failure: legacy runtime parsing still works.
        doneRef.current.delete(programId);
        return;
      }
      if (!cancelled) qc.invalidateQueries({ queryKey: ['program-slides'] });
    })();

    return () => { cancelled = true; };
  }, [programId, enabled, qc]);
}
