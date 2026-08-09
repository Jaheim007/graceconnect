/**
 * Client hooks for the document → AI course draft pipeline (Phase 3).
 *
 * The pipeline never writes courses directly: it produces a draft stored in
 * `ai_content_projects.data_json.course`, reviewed at
 * `/admin/programs/draft/:projectId`, and materialised into real
 * `programs` / `program_lessons` / `program_slides` rows only by the explicit
 * "Publish as course" action (`ai-project-to-program`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DraftSlide {
  slide_type: 'text' | 'quiz' | 'image' | 'video' | 'flashcard';
  title: string | null;
  body: string | null;
  media_url?: string | null;
  caption?: string | null;
  data: Record<string, any>;
  duration_seconds?: number;
}

export interface DraftLesson {
  title: string;
  summary?: string;
  source_excerpt?: string;
  source_page?: number | null;
  approved?: boolean;
  /** AI-generated lesson illustration, used as the slide backdrop. */
  image_url?: string | null;
  image_prompt?: string | null;
  slides: DraftSlide[];
}


/** Per-lesson override of the completion rules (keyed by lesson index). */
export interface LessonRule {
  passing_score?: number;
  /** 0 = unlimited retries. */
  max_attempts?: number;
}

/** How scoring gates the course: no score, one score for all, or per lesson. */
export type ScoreMode = 'none' | 'global' | 'per_lesson';

/** Course rules chosen on the review screen, applied when publishing. */
export interface CourseRules {
  cover_image_url?: string | null;
  score_mode?: ScoreMode;
  /** When false the quizzes stay informative: no score is required to move on. */
  require_score?: boolean;
  passing_score?: number;
  /** 0 = unlimited retries. */
  max_quiz_attempts?: number;
  require_sequential_lessons?: boolean;

  gamification_enabled?: boolean;
  certificate_enabled?: boolean;
  /** Sales description shown to buyers (set on the finalisation step). */
  description?: string;

  /** Lesson index (as string) → override. Missing entries follow the defaults. */
  lesson_rules?: Record<string, LessonRule>;
}


export interface CourseDraft {
  title: string;
  lessons: DraftLesson[];
}

export interface DraftProject {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  language: string | null;
  linked_program_id: string | null;
  data_json: {
    pipeline?: string;
    source?: { kind?: string; file_name?: string | null; file_url?: string | null; words?: number; prompt?: string | null };
    course?: CourseDraft;
    settings?: CourseRules;
  } | null;
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('SESSION_EXPIRED');
  return { Authorization: `Bearer ${session.access_token}` };
}

/** Kick off the pipeline. Returns the draft project + job to poll. */
export function useStartCourseDraft() {
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      source: 'document' | 'prompt';
      file_url?: string;
      file_name?: string;
      mime?: string;
      prompt?: string;
      title?: string;
      language?: string;
      tier?: 'standard' | 'premium';
      /** Drives quiz count + difficulty in the pipeline. */
      level?: 'beginner' | 'intermediate' | 'advanced';
      /** Opt-in per-lesson AI illustrations (extra credits per image). */
      generate_images?: boolean;

    }) => {
      const { data, error } = await supabase.functions.invoke('course-from-document', {
        headers: await authHeaders(),
        body: input,
      });
      if (error) {
        // Surface the function's JSON error body (size caps, credits, …)
        let detail: any = null;
        try { detail = await (error as any).context?.json?.(); } catch { /* ignore */ }
        const err = new Error(detail?.error || error.message);
        (err as any).status = (error as any).context?.status;
        (err as any).detail = detail;
        throw err;
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { project_id: string; job_id: string; words: number };
    },
  });
}

export interface GenerationJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error_message: string | null;
  result_summary: Record<string, any> | null;
  project_id: string | null;
}

/** Poll a generation job while it is running. */
export function useGenerationJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['ai-generation-job', jobId],
    enabled: !!jobId,
    refetchInterval: (query) => {
      const s = (query.state.data as GenerationJob | undefined)?.status;
      return s === 'completed' || s === 'failed' || s === 'cancelled' ? false : 2000;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generation_jobs')
        .select('id, status, progress, error_message, result_summary, project_id')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data as unknown as GenerationJob;
    },
  });
}

export function useCourseDraftProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['course-draft', projectId],
    enabled: !!projectId,
    // The pipeline writes lessons incrementally in the background, so keep
    // polling while the project is still generating / has no lessons yet.
    refetchInterval: (query) => {
      const p = query.state.data as DraftProject | undefined;
      if (!p) return 2000;
      const lessons = p.data_json?.course?.lessons?.length || 0;
      if (p.status === 'generating' || lessons === 0) return 2500;
      return false;
    },
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_projects')
        .select('id, organization_id, title, status, language, linked_program_id, data_json')
        .eq('id', projectId!)
        .single();
      if (error) throw error;
      return data as unknown as DraftProject;
    },
  });
}


/** Persist edits to the draft tree (title, lesson order, slide content, quiz fixes). */
export function useUpdateCourseDraft(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: CourseDraft) => {
      const { data: current } = await supabase
        .from('ai_content_projects')
        .select('data_json')
        .eq('id', projectId!)
        .single();
      const next = { ...(((current as any)?.data_json) || {}), course };
      const { error } = await supabase
        .from('ai_content_projects')
        .update({ data_json: next as any, title: course.title, updated_at: new Date().toISOString() })
        .eq('id', projectId!);
      if (error) throw error;
      return course;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-draft', projectId] }); },
  });
}

/** Persist the course rules (cover, passing score, retries) on the draft. */
export function useUpdateCourseRules(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: CourseRules) => {
      const { data: current } = await supabase
        .from('ai_content_projects')
        .select('data_json')
        .eq('id', projectId!)
        .single();
      const prev = ((current as any)?.data_json) || {};
      const next = { ...prev, settings: { ...(prev.settings || {}), ...settings } };
      const { error } = await supabase
        .from('ai_content_projects')
        .update({ data_json: next as any, updated_at: new Date().toISOString() })
        .eq('id', projectId!);
      if (error) throw error;
      return next.settings as CourseRules;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-draft', projectId] }); },
  });
}

/** Explicit "Publish as course" — materialises real records. */
export function usePublishCourseDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { org_id: string; project_id: string; publish_now?: boolean; settings?: CourseRules; price: number; currency: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-project-to-program', {
        headers: await authHeaders(),
        body: { ...input, publish_now: input.publish_now ?? false },
      });
      if (error) {
        let detail: any = null;
        try { detail = await (error as any).context?.json?.(); } catch { /* ignore */ }
        throw new Error(detail?.error || error.message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { program_id: string; lessons_count: number; slides_count: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}

export interface CourseDraftSummary {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  lessons: number;
  slides: number;
  source_kind?: string | null;
  /** Live generation progress (0-100) when a job is still running. */
  progress?: number | null;
  job_status?: string | null;
}

/**
 * Every AI course draft is auto-saved server-side, so leaving the page (or
 * losing the connection) never destroys work. This lists the drafts that were
 * never published so the creator can always come back and finish them.
 *
 * Drafts still generating carry their live job progress so the list can show a
 * real percentage instead of a static "in progress" label.
 */
export function useOrgCourseDrafts(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-course-drafts', orgId],
    enabled: !!orgId,
    // Keep the percentage moving while any draft is still being generated.
    refetchInterval: (query) => {
      const rows = query.state.data as CourseDraftSummary[] | undefined;
      const active = rows?.some((r) => r.status === 'generating' || r.job_status === 'running' || r.job_status === 'queued');
      return active ? 4000 : false;
    },
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<CourseDraftSummary[]> => {
      const { data, error } = await supabase
        .from('ai_content_projects')
        .select('id, title, status, updated_at, linked_program_id, data_json')
        .eq('organization_id', orgId!)
        .eq('project_type', 'course_pack')
        .is('linked_program_id', null)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      const rows = data || [];
      const generatingIds = rows.filter((r: any) => r.status === 'generating').map((r: any) => r.id);

      const jobByProject = new Map<string, { progress: number; status: string }>();
      if (generatingIds.length) {
        const { data: jobs } = await supabase
          .from('ai_generation_jobs')
          .select('project_id, progress, status, created_at')
          .in('project_id', generatingIds)
          .order('created_at', { ascending: false });
        for (const j of (jobs || []) as any[]) {
          if (j.project_id && !jobByProject.has(j.project_id)) {
            jobByProject.set(j.project_id, { progress: j.progress ?? 0, status: j.status });
          }
        }
      }

      return rows.map((row: any) => {
        const lessons = row.data_json?.course?.lessons || [];
        const job = jobByProject.get(row.id);
        return {
          id: row.id,
          title: row.title || 'Cours',
          status: row.status,
          updated_at: row.updated_at,
          lessons: lessons.length,
          slides: lessons.reduce((n: number, l: any) => n + (l.slides?.length || 0), 0),
          source_kind: row.data_json?.source?.kind ?? null,
          progress: job ? job.progress : null,
          job_status: job ? job.status : null,
        };
      });
    },
  });
}


export function useDeleteCourseDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('ai_content_projects').delete().eq('id', projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-course-drafts'] }); },
  });
}
