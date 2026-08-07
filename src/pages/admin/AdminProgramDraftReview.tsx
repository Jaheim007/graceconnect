/**
 * AI course draft review — /admin/programs/draft/:projectId
 *
 * Shows the full generated Lesson → Slide tree, editable in place, with the
 * source excerpt beside each lesson so the admin can check fidelity. Publishing
 * is a single explicit action; the created course starts as a draft unless the
 * admin opts into publishing immediately.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, CheckCircle2, FileText,
  HelpCircle, Loader2, Rocket, Quote, Eye, Tag,
} from 'lucide-react';
import {
  useCourseDraftProject, useUpdateCourseDraft, usePublishCourseDraft,
  useGenerationJob, type CourseDraft, type DraftLesson, type DraftSlide,
} from '@/hooks/useCourseDraft';
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
  const [publishNow, setPublishNow] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Pricing step — reuses the digital-product checkout (see useCourseCommerce).
  // AI-generated courses can never be free: a minimum price is enforced.
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(currentOrg?.currency || 'XOF');
  const [buyerPreview, setBuyerPreview] = useState(false);
  const minPrice = MIN_AI_COURSE_PRICE[currency] ?? MIN_AI_COURSE_PRICE.USD;
  const priceValue = Number(price) || 0;
  const priceValid = priceValue >= minPrice;

  // Seed the price with the currency minimum
  useEffect(() => { setPrice((p) => (p ? p : String(minPrice))); }, [minPrice]);


  const remoteCourse = project?.data_json?.course;
  const generating = job?.status === 'running' || job?.status === 'queued';

  // Sync from server until the admin starts editing
  useEffect(() => {
    if (!remoteCourse) return;
    if (dirty) return;
    setDraft({ title: remoteCourse.title || project?.title || '', lessons: remoteCourse.lessons || [] });
  }, [remoteCourse, project?.title, dirty]);

  const lesson: DraftLesson | undefined = draft?.lessons[selected];
  const totals = useMemo(() => ({
    lessons: draft?.lessons.length || 0,
    slides: draft?.lessons.reduce((n, l) => n + (l.slides?.length || 0), 0) || 0,
    quizzes: draft?.lessons.reduce((n, l) => n + (l.slides || []).filter((s) => s.slide_type === 'quiz').length, 0) || 0,
    approved: draft?.lessons.filter((l) => l.approved).length || 0,
  }), [draft]);

  // A generation can be cut short (network loss, failed job): in that case the
  // course must stay a DRAFT — never auto-publish an incomplete course.
  const emptyLessons = useMemo(
    () => (draft?.lessons || []).filter((l) => !(l.slides?.length)).length,
    [draft],
  );
  const incomplete = generating || job?.status === 'failed' || emptyLessons > 0 || totals.lessons === 0;

  // Force "draft" whenever the draft is incomplete
  useEffect(() => { if (incomplete && publishNow) setPublishNow(false); }, [incomplete, publishNow]);


  const mutate = (fn: (d: CourseDraft) => CourseDraft) => {
    setDraft((prev) => (prev ? fn(structuredClone(prev)) : prev));
    setDirty(true);
  };

  const patchLesson = (index: number, patch: Partial<DraftLesson>) =>
    mutate((d) => { d.lessons[index] = { ...d.lessons[index], ...patch }; return d; });

  const patchSlide = (li: number, si: number, patch: Partial<DraftSlide>) =>
    mutate((d) => { d.lessons[li].slides[si] = { ...d.lessons[li].slides[si], ...patch }; return d; });

  const moveLesson = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (!draft || to < 0 || to >= draft.lessons.length) return;
    mutate((d) => {
      const [item] = d.lessons.splice(index, 1);
      d.lessons.splice(to, 0, item);
      return d;
    });
    setSelected(to);
  };

  const moveSlide = (li: number, si: number, dir: -1 | 1) => {
    const to = si + dir;
    if (!draft || to < 0 || to >= draft.lessons[li].slides.length) return;
    mutate((d) => {
      const [item] = d.lessons[li].slides.splice(si, 1);
      d.lessons[li].slides.splice(to, 0, item);
      return d;
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updateDraft.mutateAsync(draft);
      setDirty(false);
      toast({ title: isFr ? 'Brouillon enregistré' : 'Draft saved' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

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
      if (dirty) await updateDraft.mutateAsync(draft);
      const result = await publishDraft.mutateAsync({ org_id: orgId, project_id: projectId, publish_now: publishNow && !incomplete });

      // Apply pricing + keep the checkout product in sync (same flow as products)
      await setPricing.mutateAsync({
        program_id: result.program_id,
        organization_id: orgId,
        title: draft.title,
        description: project?.data_json?.source?.prompt || null,
        cover_image_url: null,
        is_free: false,
        price: priceValue,
        currency,
      });

      setDirty(false);
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

  if (generating && (draft?.lessons.length || 0) === 0) {
    return (
      <AdminPageShell title={isFr ? 'Génération du cours' : 'Generating course'}>
        <CourseGenerationLoader phase="generating" mode="convert" />
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
    <AdminPageShell title={isFr ? 'Relire le brouillon' : 'Review draft'}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/programs')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={draft?.title || ''}
              onChange={(e) => mutate((d) => ({ ...d, title: e.target.value }))}
              className="h-9 font-semibold max-w-sm"
              placeholder={isFr ? 'Titre du cours' : 'Course title'}
            />
          </div>
          <div className="flex items-center gap-2">
            {generating && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isFr ? 'Génération…' : 'Generating…'} {job?.progress ?? 0}%
              </Badge>
            )}
            <div className="flex items-center gap-1.5 mr-1">
              <Switch id="publish-now" checked={publishNow} onCheckedChange={setPublishNow} disabled={incomplete} />
              <Label htmlFor="publish-now" className="text-[11px] text-muted-foreground">
                {incomplete
                  ? (isFr ? 'Reste en brouillon' : 'Stays a draft')
                  : (isFr ? 'Publier tout de suite' : 'Publish immediately')}
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBuyerPreview(true)}
              disabled={totals.slides === 0}
            >
              <Eye className="h-3.5 w-3.5" />
              {isFr ? 'Vue acheteur' : 'Preview as buyer'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!dirty || updateDraft.isPending}>
              {updateDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isFr ? 'Enregistrer' : 'Save')}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handlePublish} disabled={publishDraft.isPending || generating || totals.lessons === 0 || !priceValid}>
              {publishDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              {incomplete
                ? (isFr ? 'Enregistrer comme brouillon' : 'Save as draft')
                : (isFr ? 'Publier comme cours' : 'Publish as course')}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{totals.lessons} {isFr ? 'leçons' : 'lessons'}</Badge>
          <Badge variant="outline" className="text-[10px]">{totals.slides} slides</Badge>
          <Badge variant="outline" className="text-[10px]">{totals.quizzes} quiz</Badge>
          <Badge variant="outline" className="text-[10px]">{totals.approved}/{totals.lessons} {isFr ? 'validées' : 'checked'}</Badge>
          {project?.data_json?.source?.file_name && (
            <Badge variant="outline" className="text-[10px] gap-1"><FileText className="h-3 w-3" />{project.data_json.source.file_name}</Badge>
          )}
        </div>

        {incomplete && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
            {generating
              ? (isFr
                  ? 'La génération est encore en cours — le cours reste en brouillon jusqu’à la fin.'
                  : 'Generation is still running — the course stays a draft until it finishes.')
              : emptyLessons > 0
                ? (isFr
                    ? `${emptyLessons} chapitre(s) sans contenu (génération interrompue). Le cours reste en brouillon : complétez ou supprimez ces chapitres avant de publier.`
                    : `${emptyLessons} chapter(s) have no content (generation was interrupted). The course stays a draft: complete or delete them before publishing.`)
                : (isFr
                    ? 'Génération incomplète — le cours reste en brouillon.'
                    : 'Incomplete generation — the course stays a draft.')}
          </div>
        )}


        {/* Pricing step — AI-generated courses are always paid */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{isFr ? 'Prix du cours' : 'Course price'}</p>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-[11px] text-muted-foreground">
              {isFr
                ? `Les cours générés par l’IA ne peuvent pas être gratuits. Prix minimum : ${minPrice} ${currency}.`
                : `AI-generated courses cannot be free. Minimum price: ${minPrice} ${currency}.`}
            </p>
          </div>

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
              <span className="text-[11px] text-destructive">
                {isFr ? `Minimum ${minPrice} ${currency}` : `Minimum ${minPrice} ${currency}`}
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Un cours payant utilise exactement le même paiement que vos produits numériques (Mobile Money, carte, codes promo, affiliation).'
              : 'A paid course uses the exact same checkout as your digital products (Mobile Money, card, promo codes, affiliates).'}
          </p>
        </div>


        <p className="text-[11px] text-muted-foreground">
          {isFr
            ? 'Les quiz générés ici sont des entraînements : ils ne comptent pas pour le certificat, qui dépend uniquement de l’évaluation finale du cours.'
            : 'Quizzes generated here are practice only: they do not count towards the certificate, which depends solely on the course-level assessment.'}
        </p>

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
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-medium leading-tight line-clamp-2">{i + 1}. {l.title}</p>
                  {l.approved && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {l.slides?.length || 0} slides
                  {l.source_page ? ` · p.${l.source_page}` : ''}
                </p>
              </button>
            ))}
            <Button
              variant="outline" size="sm" className="w-full gap-1.5 mt-1"
              onClick={() => {
                mutate((d) => {
                  d.lessons.push({ title: isFr ? 'Nouvelle leçon' : 'New lesson', slides: [], summary: '' });
                  return d;
                });
                setSelected((draft?.lessons.length || 0));
              }}
            >
              <Plus className="h-3.5 w-3.5" /> {isFr ? 'Ajouter une leçon' : 'Add lesson'}
            </Button>
          </div>

          {/* Lesson editor */}
          {lesson ? (
            <div className="space-y-4 min-w-0">
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={lesson.title}
                    onChange={(e) => patchLesson(selected, { title: e.target.value })}
                    className="h-9 font-medium"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveLesson(selected, -1)} disabled={selected === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveLesson(selected, 1)} disabled={selected === (draft?.lessons.length || 1) - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => {
                      mutate((d) => { d.lessons.splice(selected, 1); return d; });
                      setSelected((s) => Math.max(0, s - 1));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant={lesson.approved ? 'default' : 'outline'} size="sm" className="gap-1.5"
                    onClick={() => patchLesson(selected, { approved: !lesson.approved })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lesson.approved ? (isFr ? 'Validée' : 'Looks good') : (isFr ? 'Marquer comme validée' : 'Mark as looks good')}
                  </Button>
                </div>

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

              {/* Slides */}
              <div className="space-y-2.5">
                {(lesson.slides || []).map((s, si) => (
                  <div key={si} className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {s.slide_type === 'quiz' ? <HelpCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {s.slide_type === 'quiz' ? 'Quiz' : (isFr ? 'Texte' : 'Text')} · {si + 1}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(selected, si, -1)} disabled={si === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSlide(selected, si, 1)} disabled={si === lesson.slides.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => mutate((d) => { d.lessons[selected].slides.splice(si, 1); return d; })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {s.slide_type === 'quiz' ? (
                      <div className="space-y-2">
                        <Input
                          value={s.data?.question || s.title || ''}
                          onChange={(e) => patchSlide(selected, si, { title: e.target.value, data: { ...s.data, question: e.target.value } })}
                          placeholder={isFr ? 'Question' : 'Question'}
                          className="h-9"
                        />
                        <div className="space-y-1.5">
                          {(s.data?.options || []).map((opt: string, oi: number) => (
                            <div key={oi} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => patchSlide(selected, si, { data: { ...s.data, correctIndex: oi } })}
                                className={cn(
                                  'h-5 w-5 rounded-full border shrink-0 flex items-center justify-center',
                                  s.data?.correctIndex === oi ? 'bg-primary border-primary' : 'border-border',
                                )}
                                title={isFr ? 'Bonne réponse' : 'Correct answer'}
                              >
                                {s.data?.correctIndex === oi && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                              </button>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const options = [...(s.data?.options || [])];
                                  options[oi] = e.target.value;
                                  patchSlide(selected, si, { data: { ...s.data, options } });
                                }}
                                className="h-8 text-[12px]"
                              />
                            </div>
                          ))}
                        </div>
                        <Textarea
                          value={s.data?.explanation || ''}
                          onChange={(e) => patchSlide(selected, si, { data: { ...s.data, explanation: e.target.value } })}
                          placeholder={isFr ? 'Explication' : 'Explanation'}
                          rows={2}
                          className="text-[12px]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={s.title || ''}
                          onChange={(e) => patchSlide(selected, si, { title: e.target.value })}
                          placeholder={isFr ? 'Titre de la slide' : 'Slide title'}
                          className="h-9"
                        />
                        <Textarea
                          value={s.body || ''}
                          onChange={(e) => patchSlide(selected, si, { body: e.target.value })}
                          rows={4}
                          className="text-[12px]"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    onClick={() => mutate((d) => {
                      d.lessons[selected].slides.push({
                        slide_type: 'text', title: null, body: '', data: { source: 'manual' }, duration_seconds: 30,
                      });
                      return d;
                    })}
                  >
                    <Plus className="h-3.5 w-3.5" /> {isFr ? 'Slide texte' : 'Text slide'}
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    onClick={() => mutate((d) => {
                      d.lessons[selected].slides.push({
                        slide_type: 'quiz', title: '', body: null,
                        data: { kind: 'mcq', question: '', options: ['', '', '', ''], correctIndex: 0, scored: false, source: 'manual' },
                        duration_seconds: 45,
                      });
                      return d;
                    })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Quiz
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-[12px] text-muted-foreground">
              {isFr ? 'Aucune leçon dans ce brouillon.' : 'No lesson in this draft.'}
            </div>
          )}
        </div>
      </div>

      {buyerPreview && draft && (
        <DraftBuyerPreview
          draft={draft}
          price={priceValue}
          currency={currency}
          isFree={false}
          onClose={() => setBuyerPreview(false)}
        />
      )}
    </AdminPageShell>
  );
}
