import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Image, Megaphone, ShoppingBag, Heart, Link2, HandHeart, ArrowRight, ArrowLeft, CheckCircle, Zap, X, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface QuickStartWizardProps {
  open: boolean;
  onClose: () => void;
}

export function QuickStartWizard({ open, onClose }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { t } = useI18n();

  const STEPS = [
    { id: 'branding', icon: Image, title: t('quickstart.branding_title'), desc: t('quickstart.branding_desc'), route: '/admin/settings', cta: t('quickstart.branding_cta') },
    { id: 'announcement', icon: Megaphone, title: t('quickstart.announcement_title'), desc: t('quickstart.announcement_desc'), route: '/admin/announcements/new', cta: t('quickstart.announcement_cta') },
    { id: 'product', icon: ShoppingBag, title: t('quickstart.product_title'), desc: t('quickstart.product_desc'), route: '/admin/products/new', cta: t('quickstart.product_cta') },
    { id: 'campaign', icon: Heart, title: t('quickstart.campaign_title'), desc: t('quickstart.campaign_desc'), route: '/admin/campaigns/new', cta: t('quickstart.campaign_cta') },
    { id: 'offerings', icon: HandHeart, title: t('quickstart.offerings_title'), desc: t('quickstart.offerings_desc'), route: '/admin/offerings', cta: t('quickstart.offerings_cta') },
    { id: 'affiliate', icon: Link2, title: t('quickstart.affiliate_title'), desc: t('quickstart.affiliate_desc'), route: '/admin/affiliation', cta: t('quickstart.affiliate_cta') },
  ];

  if (!open) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleAction = () => {
    setCompletedSteps(prev => new Set([...prev, step.id]));
    onClose();
    navigate(step.route);
  };

  const handleSkip = () => {
    setCompletedSteps(prev => new Set([...prev, step.id]));
    if (isLast) { onClose(); return; }
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border shadow-elevated max-w-md w-full p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm">{t('quickstart.title')}</h2>
            <p className="text-[10px] text-muted-foreground">
              {t('quickstart.step_of').replace('{step}', String(currentStep + 1)).replace('{total}', String(STEPS.length))}
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className={cn(
              'h-1.5 flex-1 rounded-full transition-all',
              i <= currentStep ? 'bg-primary' : 'bg-muted',
              completedSteps.has(s.id) && i !== currentStep && 'bg-emerald-500'
            )} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-4"
          >
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <step.icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 mt-6">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> {t('quickstart.back')}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleSkip}>
            {isLast ? t('quickstart.done') : t('quickstart.skip')}
          </Button>
          <Button size="sm" onClick={handleAction} className="gap-1.5 text-xs">
            <span className="truncate max-w-[120px] sm:max-w-none">{step.cta}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
