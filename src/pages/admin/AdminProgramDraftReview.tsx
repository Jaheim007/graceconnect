/**
 * AI course draft review — /admin/programs/draft/:projectId
 *
 * Two simple steps, in the order a creator thinks:
 *
 *   Step 1 · Look at what the AI generated (read-only, exactly like a learner
 *            sees it). No editing here — the full editor opens after publishing.
 *   Step 2 · Finish the course: cover image, completion rules, price, publish.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, FileText, HelpCircle, Loader2, Rocket, Quote, Eye, Tag, Layers, Image as ImageIcon,
} from 'lucide-react';
import {
  useCourseDraftProject, useUpdateCourseDraft, usePublishCourseDraft, useUpdateCourseRules,
  useGenerationJob, type CourseDraft, type CourseRules, type DraftLesson,
} from '@/hooks/useCourseDraft';
import { CourseCoverCard } from '@/components/programs/CourseCoverCard';
import { CourseCompletionRules } from '@/components/programs/CourseCompletionRules';

import { CourseGenerationLoader } from '@/components/programs/CourseGenerationLoader';
import { DraftBuyerPreview } from '@/components/programs/DraftBuyerPreview';
import { useSetCoursePricing } from '@/hooks/useCourseCommerce';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** AI-generated courses can never be free — minimum price per currency. */
const MIN_AI_COURSE_PRICE: Record<string, number> = {
  XOF: 1000, XAF: 1000, NGN: 1500, GHS: 20, KES: 200, ZAR: 40,
  MAD: 20, TND: 5, USD: 2, EUR: 2, GBP: 2,
};

export default function AdminProgramDraftReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();

  const { data: project, isLoading } = useCourseDraftProject(projectId);
  const updateDraft = useUpdateCourseDraft(projectId);
  const publishDraft = usePublishCourseDraft();
  const updateRules = useUpdateCourseRules(projectId);
  const setPricing = useSetCoursePricing();

  // latest job for this project (to show progress while generation runs)
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

  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [selected, setSelected] = useState(0);
  /** 1 = look at the generated course · 2 = finish and publish */
  const [step, setStep] = useState<1 | 2>(1);
  const [titleDirty, setTitleDirty] = useState(false);

  // Pricing step — reuses the digital-product checkout (see useCourseCommerce).
  // AI-generated courses can never be free: a minimum price is enforced.
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(currentOrg?.currency || 'XOF');
  const [buyerPreview, setBuyerPreview] = useState(false);

  // Course rules (cover, passing score, retries) — saved on the draft.
  const [rules, setRules] = useState<CourseRules>({});
  const [rulesLoaded, setRulesLoaded] = useState(false);
  useEffect(() => {
    if (rulesLoaded || !project) return;
    setRules({
      passing_score: 70,
      max_quiz_attempts: 3,
      // Lessons always unlock one by one — it is the learning model, not an option.
      require_sequential_lessons: true,
      gamification_enabled: true,
      certificate_enabled: true,
      ...(project.data_json?.settings || {}),
    });
    setRulesLoaded(true);
  }, [project, rulesLoaded]);

  const patchRules = (patch: CourseRules) => {
    setRules((r) => ({ ...r, ...patch }));
    updateRules.mutate(patch);
  };

  const minPrice = MIN_AI_COURSE_PRICE[currency] ?? MIN_AI_COURSE_PRICE.USD;
  const priceValue = Number(price) || 0;
  const priceValid = priceValue >= minPrice;

  // Seed the price with the currency minimum, and lift it whenever the chosen
  // currency has a higher floor (so the creator never stares at a red error).
  useEffect(() => {
    setPrice((p) => {
      const n = Number(p) || 0;
      return n >= minPrice ? p : String(minPrice);
    });
  }, [minPrice]);


  const remoteCourse = project?.data_json?.course;
  const jobRunning = job?.status === 'running' || job?.status === 'queued';

  // A background isolate can be killed silently, leaving the job "running"
  // forever (the classic "stuck at 82%"). When progress stops moving we treat
  // the run as finished: the incrementally-saved lessons are usable and the
  // creator can publish instead of being locked out.
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

  // The draft mirrors the server: this screen is read-only apart from the title.
  useEffect(() => {
    if (!remoteCourse) return;
    if (titleDirty) return;
    setDraft({ title: remoteCourse.title || project?.title || '', lessons: remoteCourse.lessons || [] });
  }, [remoteCourse, project?.title, titleDirty]);

  const lesson: DraftLesson | undefined = draft?.lessons[selected];
  const totals = useMemo(() => ({
    lessons: draft?.lessons.length || 0,
    slides: draft?.lessons.reduce((n, l) => n + (l.slides?.length || 0), 0) || 0,
    quizzes: draft?.lessons.reduce((n, l) => n + (l.slides || []).filter((s) => s.slide_type === 'quiz').length, 0) || 0,
    images: draft?.lessons.filter((l) => !!l.image_url).length || 0,
  }), [draft]);

  // A generation can be cut short (network loss, failed job): in that case the
  // course must stay a DRAFT — never auto-publish an incomplete course.
  const emptyLessons = useMemo(
    () => (draft?.lessons || []).filter((l) => !(l.slides?.length)).length,
    [draft],
  );
  const incomplete = generating || job?.status === 'failed' || emptyLessons > 0 || totals.lessons === 0;

  // A course with no cover looks unfinished in the catalogue: required to go
  // live, but never blocks keeping the course as a draft.
  const coverMissing = !rules.cover_image_url;


  // Title edits are saved to the cloud draft shortly after typing stops.
  useEffect(() => {
    if (!titleDirty || !draft || generating) return;
    const t = setTimeout(() => {
      updateDraft.mutate(draft, { onSuccess: () => setTitleDirty(false) });
    }, 2000);
    return () => clearTimeout(t);
  }, [titleDirty, draft, generating]);

  const handlePublish = async () => {
    if (!draft || !projectId) return;
    const orgId = project?.organization_id || currentOrg?.id;
    if (!orgId) return;
    if (!priceValid) {
      toast({
        title: isFr ? 'Prix requis' : 'Price required',
        description: isFr
          ? `Un cours généré par l’IA ne peut pas être gratuit. Minimum ${minPrice} ${currency}.`
          : `An AI-generated course cannot be free. Minimum ${minPrice} ${currency}.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Per-lesson rules travel with the quiz slides so the learner player
      // enforces exactly what the creator set for that lesson.
      const stamped: CourseDraft = structuredClone(draft);
      stamped.lessons.forEach((l, i) => {
        const rule = rules.lesson_rules?.[String(i)];
        const scored = rules.require_score !== false;
        const pass = scored ? (rule?.passing_score ?? rules.passing_score ?? 70) : 0;
        const tries = rule?.max_attempts ?? rules.max_quiz_attempts ?? 3;
        (l.slides || []).forEach((s) => {
          if (s.slide_type === 'quiz') {
            s.data = { ...(s.data || {}), passingScore: pass, maxAttempts: tries, revealAnswers: false };
          }
        });
      });
      await updateDraft.mutateAsync(stamped);
      setDraft(stamped);
      const result = await publishDraft.mutateAsync({
        org_id: orgId, project_id: projectId,
        publish_now: !incomplete,
        settings: rules.require_score === false ? { ...rules, passing_score: 0 } : rules,
      });


      // Apply pricing + keep the checkout product in sync (same flow as products)
      await setPricing.mutateAsync({
        program_id: result.program_id,
        organization_id: orgId,
        title: draft.title,
        description: project?.data_json?.source?.prompt || null,
        cover_image_url: rules.cover_image_url || null,
        is_free: false,
        price: priceValue,
        currency,
      });

      setTitleDirty(false);
      toast({
        title: isFr ? 'Cours créé' : 'Course created',
        description: isFr
          ? `${result.lessons_count} leçon(s), ${result.slides_count} slide(s).`
          : `${result.lessons_count} lesson(s), ${result.slides_count} slide(s).`,
      });
      navigate(`/admin/programs/${result.program_id}/edit`);
    } catch (e: any) {
      toast({ title: isFr ? 'Publication échouée' : 'Publish failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AdminPageShell title={isFr ? 'Brouillon IA' : 'AI draft'}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      </AdminPageShell>
    );
  }

  // Stay on the full-screen loader for the WHOLE generation. The review screen
  // is only shown once everything that will be generated is there — never a
  // second progress bar restarting from zero.
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

  if (job?.status === 'failed' && (draft?.lessons.length || 0) === 0) {
    return (
      <AdminPageShell title={isFr ? 'Génération échouée' : 'Generation failed'}>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <p className="text-sm text-muted-foreground">{job.error_message || (isFr ? 'La génération a échoué.' : 'Generation failed.')}</p>
          <Button variant="outline" onClick={() => navigate('/admin/programs')}>
            {isFr ? 'Retour aux cours' : 'Back to courses'}
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={step === 1
        ? (isFr ? 'Votre cours généré' : 'Your generated course')
        : (isFr ? 'Finaliser le cours' : 'Finish your course')}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => (step === 2 ? setStep(1) : navigate('/admin/programs'))}
              aria-label={isFr ? 'Retour' : 'Back'}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={draft?.title || ''}
              onChange={(e) => { setDraft((d) => (d ? { ...d, title: e.target.value } : d)); setTitleDirty(true); }}
              className="h-9 font-semibold max-w-sm"
              placeholder={isFr ? 'Titre du cours' : 'Course title'}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => setBuyerPreview(true)}
              disabled={totals.slides === 0}
            >
              <Eye className="h-3.5 w-3.5" />
              {isFr ? 'Vue acheteur' : 'Preview as buyer'}
            </Button>

            {step === 1 ? (
              <Button size="sm" className="gap-1.5" onClick={() => setStep(2)} disabled={totals.lessons === 0}>
                {isFr ? 'Suivant' : 'Next'} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm" className="gap-1.5" onClick={handlePublish}
                disabled={publishDraft.isPending || totals.lessons === 0 || !priceValid}
              >
                {publishDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                {incomplete
                  ? (isFr ? 'Garder en brouillon' : 'Keep as draft')
                  : (isFr ? 'Mettre le cours en ligne' : 'Put the course live')}
              </Button>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-[11px]">
          <StepChip active={step === 1} done={step > 1} label={isFr ? '1 · Aperçu' : '1 · Review'} />
          <div className="h-px flex-1 bg-border" />
          <StepChip active={step === 2} label={isFr ? '2 · Couverture, règles et prix' : '2 · Cover, rules and price'} />
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{totals.lessons} {isFr ? 'leçons' : 'lessons'}</Badge>
          <Badge variant="outline" className="text-[10px]">{totals.slides} slides</Badge>
          <Badge variant="outline" className="text-[10px]">{totals.quizzes} quiz</Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <ImageIcon className="h-3 w-3" />{totals.images} {isFr ? 'illustrations' : 'illustrations'}
          </Badge>
          {project?.data_json?.source?.file_name && (
            <Badge variant="outline" className="text-[10px] gap-1"><FileText className="h-3 w-3" />{project.data_json.source.file_name}</Badge>
          )}
        </div>

        {stalled && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
            {isFr
              ? 'La génération s’est arrêtée avant la fin, mais tout ce qui a été généré est enregistré dans le cloud. Vous pouvez publier ce brouillon et le compléter dans l’éditeur — rien n’est perdu.'
              : 'Generation stopped before finishing, but everything generated so far is saved in the cloud. You can publish this draft and complete it in the editor — nothing is lost.'}
          </div>
        )}

        {incomplete && !stalled && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
            {emptyLessons > 0
              ? (isFr
                  ? `${emptyLessons} chapitre(s) sans contenu (génération interrompue). Le cours reste en brouillon : complétez-les dans l’éditeur avant de publier.`
                  : `${emptyLessons} chapter(s) have no content (generation was interrupted). The course stays a draft: complete them in the editor before publishing.`)
              : (isFr
                  ? 'Génération incomplète — le cours reste en brouillon.'
                  : 'Incomplete generation — the course stays a draft.')}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground flex items-start gap-2">
              <Layers className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {isFr
                  ? 'Regardez ce que l’IA a écrit, leçon par leçon. Rien à modifier ici : après la publication, l’éditeur complet vous laisse tout retoucher.'
                  : 'Look through what the AI wrote, lesson by lesson. Nothing to edit here: after publishing, the full editor lets you change anything.'}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              {/* Lesson list */}
              <div className="space-y-1.5">
                {(draft?.lessons || []).map((l, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={cn(
                      'w-full text-left rounded-lg border px-3 py-2 transition-colors',
                      i === selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <p className="text-[12px] font-medium leading-tight line-clamp-2">{i + 1}. {l.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {l.slides?.length || 0} slides
                      {l.image_url ? ' · ' : ''}
                      {l.image_url ? (isFr ? 'illustration' : 'illustration') : ''}
                      {l.source_page ? ` · p.${l.source_page}` : ''}
                    </p>
                  </button>
                ))}
              </div>

              {/* Lesson content, read-only */}
              {lesson ? (
                <div className="space-y-3 min-w-0">
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                    {lesson.image_url && (
                      <div className="relative rounded-lg overflow-hidden aspect-[16/7]">
                        <img src={lesson.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-medium text-white/90">
                          {isFr ? 'Illustration générée (fond des slides)' : 'Generated illustration (slide backdrop)'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-semibold">{selected + 1}. {lesson.title}</p>
                    {lesson.summary && <p className="text-[12px] text-muted-foreground">{lesson.summary}</p>}

                    {lesson.source_excerpt && (
                      <details className="rounded-lg bg-muted/40 p-2.5">
                        <summary className="text-[11px] font-medium cursor-pointer flex items-center gap-1.5">
                          <Quote className="h-3 w-3" />
                          {isFr ? 'Extrait source' : 'Source excerpt'}
                          {lesson.source_page ? ` · p.${lesson.source_page}` : ''}
                        </summary>
                        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-56 overflow-auto">
                          {lesson.source_excerpt}
                        </p>
                      </details>
                    )}
                  </div>

                  {(lesson.slides || []).map((s, si) => (
                    <div key={si} className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {s.slide_type === 'quiz' ? <HelpCircle className="h-3 w-3" />
                          : s.slide_type === 'flashcard' ? <Layers className="h-3 w-3" />
                          : <FileText className="h-3 w-3" />}
                        {s.slide_type === 'quiz' ? 'Quiz'
                          : s.slide_type === 'flashcard' ? (isFr ? 'Carte mémo' : 'Flashcard')
                          : (isFr ? 'Texte' : 'Text')} · {si + 1}
                      </Badge>

                      {s.slide_type === 'quiz' ? (
                        <div className="space-y-1.5">
                          <p className="text-[12px] font-medium">{s.data?.question || s.title}</p>
                          <ul className="space-y-1">
                            {(s.data?.options || []).map((opt: string, oi: number) => (
                              <li key={oi} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                {opt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {s.title && <p className="text-[12px] font-medium">{s.title}</p>}
                          {s.body && (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-[12px] leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: s.body }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-[12px] text-muted-foreground">
                  {isFr ? 'Aucune leçon dans ce brouillon.' : 'No lesson in this draft.'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {/* Cover image */}
            <CourseCoverCard
              orgId={project?.organization_id || currentOrg?.id}
              title={draft?.title || ''}
              tier={((job?.result_summary as any)?.tier === 'premium' ? 'premium' : 'standard')}
              coverUrl={rules.cover_image_url}
              onChange={(url) => patchRules({ cover_image_url: url })}
            />

            {/* Completion rules — global defaults + per-lesson overrides */}
            <CourseCompletionRules
              rules={rules}
              lessons={(draft?.lessons || []).map((l) => ({ title: l.title }))}
              onChange={patchRules}
            />

            {/* Pricing — AI-generated courses are always paid */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{isFr ? 'Prix du cours' : 'Course price'}</p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {isFr
                  ? `Les cours générés par l’IA ne peuvent pas être gratuits. Prix minimum : ${minPrice} ${currency}.`
                  : `AI-generated courses cannot be free. Minimum price: ${minPrice} ${currency}.`}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="number"
                  min={minPrice}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={String(minPrice)}
                  className="h-9 w-32"
                  aria-label={isFr ? 'Prix' : 'Price'}
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!priceValid && (
                  <span className="text-[11px] text-destructive">{`Minimum ${minPrice} ${currency}`}</span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                {isFr
                  ? 'Un cours payant utilise exactement le même paiement que vos produits numériques (Mobile Money, carte, codes promo, affiliation).'
                  : 'A paid course uses the exact same checkout as your digital products (Mobile Money, card, promo codes, affiliates).'}
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Revoir le contenu' : 'Back to content'}
              </Button>
              <Button
                size="sm" className="gap-1.5" onClick={handlePublish}
                disabled={publishDraft.isPending || totals.lessons === 0 || !priceValid}
              >
                {publishDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                {incomplete
                  ? (isFr ? 'Garder en brouillon' : 'Keep as draft')
                  : (isFr ? 'Mettre le cours en ligne' : 'Put the course live')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {buyerPreview && draft && (
        <DraftBuyerPreview
          draft={draft}
          price={priceValue}
          currency={currency}
          isFree={false}
          orgLogoUrl={(currentOrg as any)?.logo_url || null}
          fallbackImageUrl={rules.cover_image_url || null}
          onClose={() => setBuyerPreview(false)}
        />
      )}
    </AdminPageShell>
  );
}

function StepChip({ active, done, label }: { active?: boolean; done?: boolean; label: string }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 font-medium',
        active ? 'border-primary bg-primary/10 text-primary'
          : done ? 'border-border bg-muted text-muted-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
