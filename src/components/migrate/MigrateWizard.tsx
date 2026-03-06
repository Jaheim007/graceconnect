import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MigrateUpload } from './steps/MigrateUpload';
import { MigrateConfig } from './steps/MigrateConfig';
import { MigrateCelebration } from './steps/MigrateCelebration';
import { WriteProgress } from '@/components/write/WriteProgress';

export interface MigrateState {
  files: File[];
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  commissionRate: number;
  coverFile: File | null;
  productId?: string;
}

const initialState: MigrateState = {
  files: [],
  title: '',
  description: '',
  price: 3000,
  isFree: false,
  commissionRate: 20,
  coverFile: null,
};

const STEP_LABELS = ['Import', 'Configuration', '🎉'];

export default function MigrateWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<MigrateState>(initialState);
  const { user } = useAuth();
  const navigate = useNavigate();

  const update = useCallback((patch: Partial<MigrateState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => setStep(s => Math.min(s + 1, 2)), []);
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  const handleUploadNext = useCallback(() => {
    if (!user) {
      navigate('/auth?mode=signup&intent=creator&redirect=/migrer');
      return;
    }
    next();
  }, [user, navigate, next]);

  return (
    <div className="pt-16 pb-20 min-h-screen">
      {step < 2 && <WriteProgress currentStep={step} labels={STEP_LABELS} />}

      <div className="container max-w-2xl px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <MigrateUpload state={state} update={update} onNext={handleUploadNext} />}
            {step === 1 && <MigrateConfig state={state} update={update} onNext={next} onBack={back} />}
            {step === 2 && <MigrateCelebration state={state} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
