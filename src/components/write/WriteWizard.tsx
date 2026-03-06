import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StepSource } from './steps/StepSource';
import { StepParams } from './steps/StepParams';
import { StepGenerating } from './steps/StepGenerating';
import { StepPreview } from './steps/StepPreview';
import { StepCover } from './steps/StepCover';
import { StepPricing } from './steps/StepPricing';
import { StepCelebration } from './steps/StepCelebration';
import { StepPublishing } from './steps/StepPublishing';
import { StepPdfPreview } from './steps/StepPdfPreview';
import { WriteProgress } from './WriteProgress';
import { WritingMotivation } from './WritingMotivation';
import { trackEvent } from '@/hooks/useClientAnalytics';

export type SourceType = 'idea' | 'document';
export type BookStyle = 'ebook' | 'guide' | 'prayers';
export type WritingTone = 'professional' | 'conversational' | 'humorous' | 'spiritual' | 'poetic' | 'academic';
export type LanguageLevel = 'simple' | 'intermediate' | 'advanced';
export type TargetAudience = 'general' | 'children' | 'teens' | 'adults' | 'seniors' | 'professionals';
export type BookLanguage = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'sw';

export interface WriteChapter {
  id: string;
  title: string;
  content: string;
}

export interface WriteState {
  source: SourceType;
  topic: string;
  uploadedFile: File | null;
  title: string;
  style: BookStyle;
  tone: WritingTone;
  languageLevel: LanguageLevel;
  targetAudience: TargetAudience;
  language: BookLanguage;
  styleReference: string;
  pageCount: number;
  chapters: WriteChapter[];
  coverTemplate: number;
  coverFile: File | null;
  coverUrl?: string;
  price: number;
  isFree: boolean;
  commissionRate: number;
  productId?: string;
  projectId?: string;
  orgSlug?: string;
  previewPdfUrl?: string;
}

export interface SavedWriteDraftSummary {
  id: string;
  name: string;
  updatedAt: number;
  step: number;
  isActive: boolean;
}

interface StoredWriteDraft {
  id: string;
  state: Partial<WriteState>;
  step: number;
  updatedAt: number;
}

interface WriteDraftStore {
  activeDraftId: string | null;
  drafts: Record<string, StoredWriteDraft>;
}

interface LoadedWriteDraft {
  id: string;
  state: WriteState;
  step: number;
  updatedAt: number | null;
}

const STORAGE_KEY = 'write_wizard_drafts_v2';
const LEGACY_STORAGE_KEY = 'write_wizard_draft';

const PDF_PREVIEW_STEP = 6;
const PUBLISHING_STEP = 7;
const CELEBRATION_STEP = 8;
const STEP_LABELS = ['Source', 'Détails', 'Création', 'Aperçu', 'Couverture', 'Prix', 'Aperçu PDF', 'Sauvegarde', '🎉'];

type PublishingStage = 'preparing' | 'org' | 'book' | 'pdf' | 'finalizing';

const initialState: WriteState = {
  source: 'idea',
  topic: '',
  uploadedFile: null,
  title: '',
  style: 'ebook',
  tone: 'professional',
  languageLevel: 'intermediate',
  targetAudience: 'general',
  language: 'fr',
  styleReference: '',
  pageCount: 20,
  chapters: [],
  coverTemplate: 0,
  coverFile: null,
  coverUrl: '',
  price: 2000,
  isFree: false,
  commissionRate: 20,
};

function createDraftId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampDraftStep(step: number) {
  if (!Number.isFinite(step)) return 0;
  // Never restore the transient publishing splash step (it can look "stuck" on return)
  return Math.max(0, Math.min(Math.floor(step), PDF_PREVIEW_STEP));
}

function toSerializableState(state: WriteState): Partial<WriteState> {
  const { uploadedFile, coverFile, previewPdfUrl, ...serializable } = state;
  return serializable;
}

function toHydratedState(rawState?: Partial<WriteState>): WriteState {
  return {
    ...initialState,
    ...(rawState ?? {}),
    uploadedFile: null,
    coverFile: null,
    previewPdfUrl: undefined,
  };
}

function resolveDraftName(rawState?: Partial<WriteState>) {
  const name = (rawState?.title || rawState?.topic || '').trim();
  return name.length > 0 ? name : 'Brouillon sans titre';
}

function emptyDraftStore(): WriteDraftStore {
  return { activeDraftId: null, drafts: {} };
}

function persistDraftStore(store: WriteDraftStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota/storage errors
  }
}

function migrateLegacyDraft(): WriteDraftStore | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: Partial<WriteState>; step?: number };
    const draftId = createDraftId();
    const updatedAt = Date.now();

    const migrated: WriteDraftStore = {
      activeDraftId: draftId,
      drafts: {
        [draftId]: {
          id: draftId,
          state: toSerializableState(toHydratedState(parsed.state)),
          step: clampDraftStep(typeof parsed.step === 'number' ? parsed.step : 0),
          updatedAt,
        },
      },
    };

    localStorage.removeItem(LEGACY_STORAGE_KEY);
    persistDraftStore(migrated);
    return migrated;
  } catch {
    return null;
  }
}

function loadDraftStore(): WriteDraftStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return migrateLegacyDraft() ?? emptyDraftStore();
    }

    const parsed = JSON.parse(raw) as Partial<WriteDraftStore>;
    const draftsObj = parsed?.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {};

    const drafts = Object.values(draftsObj)
      .filter((draft): draft is StoredWriteDraft => !!draft && typeof draft === 'object' && typeof (draft as StoredWriteDraft).id === 'string')
      .reduce<Record<string, StoredWriteDraft>>((acc, draft) => {
        acc[draft.id] = {
          id: draft.id,
          state: toSerializableState(toHydratedState(draft.state)),
          step: clampDraftStep(draft.step),
          updatedAt: typeof draft.updatedAt === 'number' ? draft.updatedAt : Date.now(),
        };
        return acc;
      }, {});

    const activeDraftId = typeof parsed?.activeDraftId === 'string' && drafts[parsed.activeDraftId]
      ? parsed.activeDraftId
      : null;

    return { activeDraftId, drafts };
  } catch {
    return migrateLegacyDraft() ?? emptyDraftStore();
  }
}

function listSavedDrafts(store: WriteDraftStore, activeDraftId: string | null): SavedWriteDraftSummary[] {
  return Object.values(store.drafts)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((draft) => ({
      id: draft.id,
      name: resolveDraftName(draft.state),
      updatedAt: draft.updatedAt,
      step: draft.step,
      isActive: draft.id === activeDraftId,
    }));
}

function resolveActiveDraft(store: WriteDraftStore): StoredWriteDraft | null {
  if (store.activeDraftId && store.drafts[store.activeDraftId]) {
    return store.drafts[store.activeDraftId];
  }

  return Object.values(store.drafts).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

function loadInitialDraft(): LoadedWriteDraft {
  const store = loadDraftStore();
  const activeDraft = resolveActiveDraft(store);

  if (!activeDraft) {
    return {
      id: createDraftId(),
      state: toHydratedState(),
      step: 0,
      updatedAt: null,
    };
  }

  return {
    id: activeDraft.id,
    state: toHydratedState(activeDraft.state),
    step: clampDraftStep(activeDraft.step),
    updatedAt: activeDraft.updatedAt,
  };
}

function saveDraftSnapshot(draftId: string, state: WriteState, step: number): { store: WriteDraftStore; updatedAt: number } {
  const store = loadDraftStore();
  const updatedAt = Date.now();

  store.drafts[draftId] = {
    id: draftId,
    state: toSerializableState(state),
    step: clampDraftStep(step),
    updatedAt,
  };
  store.activeDraftId = draftId;

  persistDraftStore(store);

  return { store, updatedAt };
}

function removeDraftSnapshot(draftId: string): WriteDraftStore {
  const store = loadDraftStore();
  delete store.drafts[draftId];

  if (store.activeDraftId === draftId) {
    store.activeDraftId = null;
  }

  persistDraftStore(store);
  return store;
}

export default function WriteWizard() {
  const bootstrapRef = useRef<LoadedWriteDraft | null>(null);
  if (!bootstrapRef.current) {
    bootstrapRef.current = loadInitialDraft();
  }

  const bootstrap = bootstrapRef.current;

  const [draftId, setDraftId] = useState(bootstrap.id);
  const [step, setStep] = useState(bootstrap.step);
  const [state, setState] = useState<WriteState>(bootstrap.state);
  const [savedDrafts, setSavedDrafts] = useState<SavedWriteDraftSummary[]>(() => {
    const store = loadDraftStore();
    return listSavedDrafts(store, bootstrap.id);
  });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(bootstrap.updatedAt);
  const [publishing, setPublishing] = useState(false);
  const [publishingStage, setPublishingStage] = useState<PublishingStage>('preparing');
  const [willCreateOrg, setWillCreateOrg] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const syncDraftList = useCallback((store: WriteDraftStore, activeId: string | null) => {
    setSavedDrafts(listSavedDrafts(store, activeId));
  }, []);

  const update = useCallback((patch: Partial<WriteState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveCurrentDraftNow = useCallback(() => {
    if (step >= CELEBRATION_STEP) return;

    const { store, updatedAt } = saveDraftSnapshot(draftId, state, step);
    setLastSavedAt(updatedAt);
    syncDraftList(store, draftId);
  }, [draftId, state, step, syncDraftList]);

  const handleCreateNewDraft = useCallback(() => {
    if (step < CELEBRATION_STEP) saveCurrentDraftNow();

    const newDraftId = createDraftId();
    const freshState = toHydratedState();
    const { store, updatedAt } = saveDraftSnapshot(newDraftId, freshState, 0);

    setDraftId(newDraftId);
    setState(freshState);
    setStep(0);
    setLastSavedAt(updatedAt);
    syncDraftList(store, newDraftId);

    toast({ title: `📝 ${t('write.new_draft_ready')}` });
  }, [saveCurrentDraftNow, step, syncDraftList, toast, t]);

  const handleLoadDraft = useCallback((targetDraftId: string) => {
    if (targetDraftId === draftId) return;

    if (step < CELEBRATION_STEP) saveCurrentDraftNow();

    const store = loadDraftStore();
    const target = store.drafts[targetDraftId];

    if (!target) {
      toast({ title: `⚠️ ${t('write.draft_not_found')}`, variant: 'destructive' });
      syncDraftList(store, draftId);
      return;
    }

    store.activeDraftId = targetDraftId;
    persistDraftStore(store);

    setDraftId(targetDraftId);
    setState(toHydratedState(target.state));
    setStep(clampDraftStep(target.step));
    setLastSavedAt(target.updatedAt);
    syncDraftList(store, targetDraftId);

    toast({ title: `✅ ${t('write.draft_loaded')}` });
  }, [draftId, saveCurrentDraftNow, step, syncDraftList, toast, t]);

  // Auto-save to localStorage on state/step change
  useEffect(() => {
    if (step >= CELEBRATION_STEP) {
      const store = removeDraftSnapshot(draftId);
      syncDraftList(store, store.activeDraftId);
      setLastSavedAt(null);
      return;
    }

    // Publishing step is transient: keep the last editable snapshot (PDF preview)
    // to avoid restoring a stuck spinner when users come back later.
    if (step >= PUBLISHING_STEP) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const { store, updatedAt } = saveDraftSnapshot(draftId, state, step);
      setLastSavedAt(updatedAt);
      syncDraftList(store, draftId);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [draftId, state, step, syncDraftList]);

  // Flush save immediately before page unload (e.g. Canva OAuth redirect)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step < CELEBRATION_STEP) {
        saveDraftSnapshot(draftId, state, step);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [draftId, state, step]);

  // Sync draft to database when user is authenticated and has meaningful content
  const dbSyncRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id || step < 2 || step >= CELEBRATION_STEP) return;
    if (!state.title && !state.topic) return;

    const syncTimeout = window.setTimeout(async () => {
      try {
        // Check if user has an org
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .limit(1)
          .single();

        if (!membership?.organization_id) return;

        const dataJson = JSON.parse(JSON.stringify(toSerializableState(state)));
        const structJson = JSON.parse(JSON.stringify({ step, chapters: state.chapters, draftId }));

        const projectData = {
          title: state.title || state.topic || 'Brouillon',
          data_json: dataJson,
          structure_json: structJson,
          status: 'draft' as const,
          project_type: 'ebook' as const,
          language: state.language || 'fr',
          description: state.topic || null,
          organization_id: membership.organization_id,
          created_by: user.id,
        };

        if (dbSyncRef.current) {
          // Update existing project
          await supabase
            .from('ai_content_projects')
            .update({
              title: projectData.title,
              data_json: projectData.data_json,
              structure_json: projectData.structure_json,
              description: projectData.description,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbSyncRef.current);
        } else {
          // Check if a draft already exists for this draftId
          const { data: existing } = await supabase
            .from('ai_content_projects')
            .select('id')
            .eq('organization_id', membership.organization_id)
            .eq('created_by', user.id)
            .eq('status', 'draft')
            .contains('structure_json', { draftId })
            .limit(1)
            .maybeSingle();

          if (existing?.id) {
            dbSyncRef.current = existing.id;
            await supabase
              .from('ai_content_projects')
              .update({
                title: projectData.title,
                data_json: projectData.data_json,
                structure_json: projectData.structure_json,
                description: projectData.description,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
          } else {
            const { data: created } = await supabase
              .from('ai_content_projects')
              .insert(projectData)
              .select('id')
              .single();
            if (created) dbSyncRef.current = created.id;
          }
        }
      } catch (err) {
        console.warn('Draft DB sync failed (non-blocking):', err);
      }
    }, 3000);

    return () => window.clearTimeout(syncTimeout);
  }, [user?.id, state, step, draftId]);

  const next = useCallback(() => setStep((s) => {
    const newStep = Math.min(s + 1, CELEBRATION_STEP);
    trackEvent('wizard_step', { step: newStep, label: STEP_LABELS[newStep] }, user?.id);
    return newStep;
  }), [user?.id]);

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // Auth wall: after source selection (step 0), require login
  const handleSourceNext = useCallback(() => {
    if (!user) {
      const intent = 'writer';
      navigate(`/auth?mode=signup&intent=${intent}&redirect=/ecrire`);
      return;
    }
    next();
  }, [user, navigate, next]);

  const handlePublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);

    try {
      let shouldCreateOrg = false;

      if (user?.id) {
        setPublishingStage('org');
        const { count, error: ownerCountError } = await supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('role', 'owner');

        if (!ownerCountError) {
          shouldCreateOrg = (count ?? 0) === 0;
        }
      }

      setWillCreateOrg(shouldCreateOrg);

      const normalizedChapters = state.chapters
        .map((chapter, index) => ({
          id: chapter.id || `ch-${index + 1}`,
          title: chapter.title.trim(),
          content: chapter.content.trim(),
          order: index,
        }))
        .filter((chapter) => chapter.title.length > 0);

      setPublishingStage('book');

      // Build a rich HTML description with styled title + table of contents
      const bookTitle = state.title || t('write.my_book');
      let richDescription: string | null = null;
      if (normalizedChapters.length > 0) {
        const tocItems = normalizedChapters.map((c, i) => `<li>${c.title}</li>`).join('');
        richDescription = `<h2 style="margin-bottom:0.25em;">📚 ${bookTitle}</h2>` +
          `<p style="color:#666;margin-bottom:1em;">${state.topic || ''}</p>` +
          `<h3>📖 Sommaire</h3><ol>${tocItems}</ol>`;
      }

      const { data, error } = await supabase.rpc('create_book_quick', {
        _title: bookTitle,
        _style: state.style,
        _page_count: state.pageCount,
        _price: state.price,
        _is_free: false,
        _commission_rate: state.commissionRate,
        _chapters: JSON.parse(JSON.stringify(normalizedChapters)),
        _topic: state.topic || null,
        _cover_url: state.coverUrl || null,
        _description: richDescription,
        _file_url: null,
      });

      if (error) throw error;
      const result = data as any;

      const projectPayload = {
        style: state.style,
        chapters: normalizedChapters,
        page_count: state.pageCount,
        topic: state.topic || null,
        cover_url: state.coverUrl || null,
      };

      if (result.project_id) {
        await supabase
          .from('ai_content_projects')
          .update({
            data_json: projectPayload,
            structure_json: projectPayload,
          })
          .eq('id', result.project_id);
      }

      if (state.coverUrl && result.project_id && result.organization_id) {
        await supabase
          .from('ai_project_assets')
          .insert({
            project_id: result.project_id,
            organization_id: result.organization_id,
            asset_type: 'image',
            file_url: state.coverUrl,
            label: 'Couverture',
            mime_type: 'image/jpeg',
            is_cover: true,
            display_order: 0,
          });
      }

      setPublishingStage('pdf');
      let generatedPdfUrl: string | null = null;

      if (result.project_id && result.organization_id) {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('ai-generate-pdf', {
          body: {
            org_id: result.organization_id,
            project_id: result.project_id,
            format: 'ebook',
            page_size: 'A4',
            cover_url: state.coverUrl || null,
          },
        });

        if (pdfError) throw pdfError;
        if (pdfData?.error) throw new Error(pdfData.error);
        generatedPdfUrl = pdfData?.download_url ?? null;
      }

      setPublishingStage('finalizing');
      const productPatch: Record<string, any> = {};

      if (generatedPdfUrl) productPatch.file_url = generatedPdfUrl;
      if (state.coverUrl) productPatch.cover_image_url = state.coverUrl;
      // Always mark as AI-generated
      productPatch.ai_generated = true;

      if (Object.keys(productPatch).length > 0 && result.product_id) {
        const { error: updateErr } = await supabase
          .from('digital_products')
          .update(productPatch)
          .eq('id', result.product_id);

        if (updateErr) {
          console.error('Product patch error (non-blocking):', updateErr);
        }

        // Double-check: if PDF was not set, log a warning
        if (!generatedPdfUrl) {
          console.warn('⚠️ PDF generation did not return a URL - product may be missing its file');
        }
      }

      update({
        productId: result.product_id,
        projectId: result.project_id,
        orgSlug: result.org_slug,
      });

      trackEvent(
        'book_published',
        {
          product_id: result.product_id,
          project_id: result.project_id,
          has_pdf: !!generatedPdfUrl,
          org_created: shouldCreateOrg,
        },
        user?.id,
      );

      // Clean up draft from localStorage since the book is now a product
      const store = removeDraftSnapshot(draftId);
      syncDraftList(store, store.activeDraftId);
      setLastSavedAt(null);

      // Navigate to product edit page
      const productId = result.product_id;
      if (productId) {
        navigate(`/admin/products/${productId}/edit`);
      } else {
        navigate('/admin/products');
      }
      toast({ title: '✅ Ton livre est prêt ! Finalise la publication.' });
    } catch (err: any) {
      console.error('Publish error:', err);
      toast({
        title: '❌ ' + (t('write.publish') || 'Error'),
        description: err.message,
        variant: 'destructive',
      });
      setStep(5);
    } finally {
      setPublishing(false);
    }
  }, [publishing, state, user, update, toast, t]);

  const startPublishing = useCallback(() => {
    if (publishing) return;
    setPublishingStage('preparing');
    setStep(PUBLISHING_STEP);
    void handlePublish();
  }, [publishing, handlePublish]);

  return (
    <div className="pt-16 pb-20 min-h-screen">
      {step < CELEBRATION_STEP && (
        <>
          <WriteProgress currentStep={step} labels={STEP_LABELS} />
          <WritingMotivation step={step} />
        </>
      )}

      <div className={`container px-4 ${step === 3 ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${draftId}-${step}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <StepSource
                state={state}
                update={update}
                onNext={handleSourceNext}
                savedDrafts={savedDrafts}
                activeDraftId={draftId}
                onCreateDraft={handleCreateNewDraft}
                onLoadDraft={handleLoadDraft}
                lastSavedAt={lastSavedAt}
              />
            )}
            {step === 1 && <StepParams state={state} update={update} onNext={next} onBack={back} />}
            {step === 2 && <StepGenerating state={state} update={update} onNext={next} />}
            {step === 3 && <StepPreview state={state} update={update} onNext={next} onBack={back} />}
            {step === 4 && <StepCover state={state} update={update} onNext={next} onBack={back} />}
            {step === 5 && <StepPricing state={state} update={update} onNext={next} onBack={back} />}
            {step === PDF_PREVIEW_STEP && <StepPdfPreview state={state} update={update} onNext={startPublishing} onBack={back} onSaveDraft={saveCurrentDraftNow} saving={publishing} />}
            {step === PUBLISHING_STEP && <StepPublishing stage={publishingStage} willCreateOrg={willCreateOrg} />}
            {step === CELEBRATION_STEP && <StepCelebration state={state} onWriteAnother={handleCreateNewDraft} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
