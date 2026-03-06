import { useState, useCallback, useEffect } from 'react';
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

const STORAGE_KEY = 'write_wizard_draft';

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

function loadDraft(): { state: WriteState; step: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Don't restore File objects or blob URLs (they can't be serialized)
    return {
      state: { ...initialState, ...parsed.state, uploadedFile: null, coverFile: null, previewPdfUrl: undefined },
      step: typeof parsed.step === 'number' ? parsed.step : 0,
    };
  } catch { return null; }
}

function saveDraft(state: WriteState, step: number) {
  try {
    // Exclude non-serializable fields
    const { uploadedFile, coverFile, ...serializable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: serializable, step }));
  } catch { /* quota exceeded, ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const PDF_PREVIEW_STEP = 6;
const PUBLISHING_STEP = 7;
const CELEBRATION_STEP = 8;
const STEP_LABELS = ['Source', 'Détails', 'Création', 'Aperçu', 'Couverture', 'Prix', 'Aperçu PDF', 'Sauvegarde', '🎉'];

type PublishingStage = 'preparing' | 'org' | 'book' | 'pdf' | 'finalizing';

export default function WriteWizard() {
  const draft = loadDraft();
  const [step, setStep] = useState(draft?.step ?? 0);
  const [state, setState] = useState<WriteState>(() => {
    const s = draft?.state ?? initialState;
    return { ...s, previewPdfUrl: undefined };
  });
  const [publishing, setPublishing] = useState(false);
  const [publishingStage, setPublishingStage] = useState<PublishingStage>('preparing');
  const [willCreateOrg, setWillCreateOrg] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const update = useCallback((patch: Partial<WriteState>) => {
      setState(prev => ({ ...prev, ...patch }));
  }, []);

  // Auto-save to localStorage on every state/step change
  useEffect(() => {
    if (step < CELEBRATION_STEP) {
      saveDraft(state, step);
    } else {
      clearDraft();
    }
  }, [state, step]);

  const next = useCallback(() => setStep(s => {
    const newStep = Math.min(s + 1, CELEBRATION_STEP);
    trackEvent('wizard_step', { step: newStep, label: STEP_LABELS[newStep] }, user?.id);
    return newStep;
  }), [user?.id]);

  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

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
      const { data, error } = await supabase.rpc('create_book_quick', {
        _title: state.title || t('write.my_book'),
        _style: state.style,
        _page_count: state.pageCount,
        _price: state.isFree ? 0 : state.price,
        _is_free: state.isFree,
        _commission_rate: state.commissionRate,
        _chapters: JSON.parse(JSON.stringify(normalizedChapters)),
        _topic: state.topic || null,
        _cover_url: state.coverUrl || null,
        _description: null,
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
          },
        });

        if (pdfError) throw pdfError;
        if (pdfData?.error) throw new Error(pdfData.error);
        generatedPdfUrl = pdfData?.download_url ?? null;
      }

      setPublishingStage('finalizing');
      const productPatch: Record<string, string> = {};

      if (generatedPdfUrl) productPatch.file_url = generatedPdfUrl;
      if (state.coverUrl) productPatch.cover_image_url = state.coverUrl;

      if (Object.keys(productPatch).length > 0 && result.product_id) {
        await supabase
          .from('digital_products')
          .update(productPatch)
          .eq('id', result.product_id);
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

      setStep(CELEBRATION_STEP);
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
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <StepSource state={state} update={update} onNext={handleSourceNext} />}
            {step === 1 && <StepParams state={state} update={update} onNext={next} onBack={back} />}
            {step === 2 && <StepGenerating state={state} update={update} onNext={next} />}
            {step === 3 && <StepPreview state={state} update={update} onNext={next} onBack={back} />}
            {step === 4 && <StepCover state={state} update={update} onNext={next} onBack={back} />}
            {step === 5 && <StepPricing state={state} update={update} onNext={startPublishing} onBack={back} publishing={publishing} />}
            {step === 6 && <StepPublishing stage={publishingStage} willCreateOrg={willCreateOrg} />}
            {step === 7 && <StepCelebration state={state} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

