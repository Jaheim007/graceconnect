import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StepSource } from './steps/StepSource';
import { StepParams } from './steps/StepParams';
import { StepGenerating } from './steps/StepGenerating';
import { StepPreview } from './steps/StepPreview';
import { StepCover } from './steps/StepCover';
import { StepPricing } from './steps/StepPricing';
import { StepCelebration } from './steps/StepCelebration';
import { WriteProgress } from './WriteProgress';
import { WritingMotivation } from './WritingMotivation';
import { trackEvent } from '@/hooks/useClientAnalytics';

export type SourceType = 'idea' | 'document';
export type BookStyle = 'ebook' | 'guide' | 'prayers';

export interface WriteState {
  source: SourceType;
  topic: string;
  uploadedFile: File | null;
  title: string;
  style: BookStyle;
  pageCount: number;
  chapters: string[];
  coverTemplate: number;
  coverFile: File | null;
  price: number;
  isFree: boolean;
  commissionRate: number;
  productId?: string;
  orgSlug?: string;
}

const initialState: WriteState = {
  source: 'idea',
  topic: '',
  uploadedFile: null,
  title: '',
  style: 'ebook',
  pageCount: 20,
  chapters: [],
  coverTemplate: 0,
  coverFile: null,
  price: 2000,
  isFree: false,
  commissionRate: 20,
};

const STEP_LABELS = ['Source', 'Détails', 'Création', 'Aperçu', 'Couverture', 'Prix', '🎉'];

export default function WriteWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WriteState>(initialState);
  const { user } = useAuth();
  const navigate = useNavigate();

  const update = useCallback((patch: Partial<WriteState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => setStep(s => {
    const newStep = Math.min(s + 1, 6);
    trackEvent('wizard_step', { step: newStep, label: STEP_LABELS[newStep] }, user?.id);
    return newStep;
  }), [user?.id]);
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  // Auth wall: after source selection (step 0), require login
  const handleSourceNext = useCallback(() => {
    if (!user) {
      const intent = `writer`;
      navigate(`/auth?mode=signup&intent=${intent}&redirect=/ecrire`);
      return;
    }
    next();
  }, [user, navigate, next]);

  return (
    <div className="pt-16 pb-20 min-h-screen">
      {step < 6 && (
        <>
          <WriteProgress currentStep={step} labels={STEP_LABELS} />
          <WritingMotivation step={step} />
        </>
      )}

      <div className="container max-w-2xl px-4">
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
            {step === 3 && <StepPreview state={state} onNext={next} onBack={back} />}
            {step === 4 && <StepCover state={state} update={update} onNext={next} onBack={back} />}
            {step === 5 && <StepPricing state={state} update={update} onNext={next} onBack={back} />}
            {step === 6 && <StepCelebration state={state} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
