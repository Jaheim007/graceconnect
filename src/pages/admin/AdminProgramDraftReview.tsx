/**
 * AI course draft handoff — /admin/programs/draft/:projectId
 *
 * There is only ONE course interface on SiteViral: the course builder
 * (Edit · Preview · Settings · Publish). This screen therefore does not ask the
 * creator anything: it shows the generation progress, then materialises the
 * draft into a real (private) course and sends the creator straight into the
 * builder's Edit tab, where the content, the learner preview and every setting
 * (title, description, cover, price, completion rules, certificate) live.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { Loader2 } from 'lucide-react';
import {
  useCourseDraftProject, usePublishCourseDraft, useGenerationJob, type CourseRules,
} from '@/hooks/useCourseDraft';
import { CourseGenerationLoader } from '@/components/programs/CourseGenerationLoader';
import { MIN_AI_COURSE_PRICE } from '@/lib/coursePricing';

export default function AdminProgramDraftReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();

  const { data: project, isLoading } = useCourseDraftProject(projectId);
  const publishDraft = usePublishCourseDraft();

  const { data: latestJob } = useQuery({
    queryKey: ['course-draft-job', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_generation_jobs')
        .select('id')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { id: string } | null;
    },
  });
  const { data: job } = useGenerationJob(latestJob?.id);

  const jobRunning = job?.status === 'running' || job?.status === 'queued';

  // A background isolate can be killed silently, leaving the job "running"
  // forever (the classic "stuck at 82%"). When progress stops moving we treat
  // the run as finished: the incrementally-saved lessons are usable.
  const progressRef = useRef<number | undefined>(undefined);
  const [lastTick, setLastTick] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (job?.progress !== progressRef.current) {
      progressRef.current = job?.progress;
      setLastTick(Date.now());
    }
  }, [job?.progress]);
  useEffect(() => {
    if (!jobRunning) return;
    const i = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(i);
  }, [jobRunning]);
  const stalled = jobRunning && now - lastTick > 150_000;
  const generating = jobRunning && !stalled;

  const lessons = project?.data_json?.course?.lessons || [];
  const currency = currentOrg?.currency || 'XOF';
  const minPrice = MIN_AI_COURSE_PRICE[currency] ?? MIN_AI_COURSE_PRICE.USD;

  const [error, setError] = useState<string | null>(null);
  const handedOff = useRef(false);

  const defaultRules = useMemo<CourseRules>(() => ({
    // No score is required by default — the creator opts in from the builder.
    score_mode: 'none',
    require_score: false,
    passing_score: 0,
    max_quiz_attempts: 0,
    require_sequential_lessons: true,
    gamification_enabled: false,
    certificate_enabled: true,
    ...(project?.data_json?.settings || {}),
  }), [project?.data_json?.settings]);

  // Already materialised → the builder is the single source of truth.
  useEffect(() => {
    if (project?.linked_program_id && !handedOff.current) {
      handedOff.current = true;
      navigate(`/admin/programs/${project.linked_program_id}/edit`, { replace: true });
    }
  }, [project?.linked_program_id, navigate]);

  // Generation finished → create the private course and open the builder.
  useEffect(() => {
    if (handedOff.current || generating || isLoading) return;
    if (!projectId || !project || project.linked_program_id) return;
    if (lessons.length === 0) return;
    const orgId = project.organization_id || currentOrg?.id;
    if (!orgId) return;

    handedOff.current = true;
    publishDraft.mutate(
      {
        org_id: orgId,
        project_id: projectId,
        // Never auto-publish: the creator finishes in the builder and puts it live.
        publish_now: false,
        settings: { ...defaultRules, max_quiz_attempts: 10 },
        price: minPrice,
        currency,
      },
      {
        onSuccess: (result) => {
          toast({
            title: isFr ? 'Cours prêt à éditer' : 'Course ready to edit',
            description: isFr
              ? `${result.lessons_count} leçon(s), ${result.slides_count} slide(s).`
              : `${result.lessons_count} lesson(s), ${result.slides_count} slide(s).`,
          });
          navigate(`/admin/programs/${result.program_id}/edit`, { replace: true });
        },
        onError: (e: any) => {
          handedOff.current = false;
          setError(e.message);
        },
      },
    );
  }, [generating, isLoading, projectId, project, lessons.length, currentOrg?.id, defaultRules, minPrice, currency]);

  if (generating) {
    return (
      <AdminPageShell title={isFr ? 'Génération du cours' : 'Generating course'}>
        <CourseGenerationLoader
          phase="generating"
          mode="convert"
          progress={job?.progress}
          doneCount={(job?.result_summary as any)?.done}
          totalCount={(job?.result_summary as any)?.topics}
        />
        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          {isFr
            ? 'Vous pouvez quitter cette page : le brouillon est enregistré automatiquement dans le cloud et vous le retrouverez dans « Cours ».'
            : 'You can leave this page: the draft is auto-saved to the cloud and will be waiting for you under “Courses”.'}
        </p>
      </AdminPageShell>
    );
  }

  if (error || (job?.status === 'failed' && lessons.length === 0)) {
    return (
      <AdminPageShell title={isFr ? 'Génération échouée' : 'Generation failed'}>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <p className="text-sm text-muted-foreground">
            {error || job?.error_message || (isFr ? 'La génération a échoué.' : 'Generation failed.')}
          </p>
          <Button variant="outline" onClick={() => navigate('/admin/programs')}>
            {isFr ? 'Retour aux cours' : 'Back to courses'}
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={isFr ? 'Préparation de l’éditeur' : 'Opening the editor'}>
      <div className="max-w-md mx-auto flex flex-col items-center gap-3 py-20 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium">
          {isFr ? 'Votre cours est prêt' : 'Your course is ready'}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {isFr
            ? 'Nous ouvrons l’éditeur : contenu, aperçu apprenant et réglages (couverture, prix, règles) au même endroit.'
            : 'Opening the editor: content, learner preview and settings (cover, price, rules) all in one place.'}
        </p>
      </div>
    </AdminPageShell>
  );
}
