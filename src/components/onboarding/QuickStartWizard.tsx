import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import {
  Image, Megaphone, ShoppingBag, Heart, Link2, HandHeart,
  ArrowRight, ArrowLeft, CheckCircle, Sparkles, X, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'branding', icon: Image, title: 'Logo & Bannière', desc: 'Ajoutez votre logo, bannière et numéro WhatsApp.', route: '/admin/settings', cta: 'Paramètres' },
  { id: 'announcement', icon: Megaphone, title: 'Première annonce', desc: 'Publiez une annonce pour accueillir votre communauté.', route: '/admin/announcements/new', cta: 'Créer' },
  { id: 'product', icon: ShoppingBag, title: 'Ajouter un produit numérique', desc: 'Publiez votre premier ebook, audio, vidéo ou document. Vos ambassadeurs pourront le partager et gagner des commissions.', route: '/admin/products/new', cta: 'Ajouter un produit' },
  { id: 'campaign', icon: Heart, title: 'Campagne de dons', desc: 'Lancez une collecte de dons pour votre communauté.', route: '/admin/campaigns/new', cta: 'Créer' },
  { id: 'offerings', icon: HandHeart, title: 'Module Dons & Offrandes', desc: 'Activez le module pour recevoir des dons, offrandes ou dîmes. Vous choisissez le nom et les montants.', route: '/admin/offerings', cta: 'Configurer' },
  { id: 'affiliate', icon: Link2, title: 'Programme Ambassadeur', desc: 'Activez votre armée d\'ambassadeurs. Ils partagent vos ressources et gagnent des commissions de 5% à 50% (uniquement sur les ventes, pas les dons).', route: '/admin/affiliation', cta: 'Configurer' },
];

interface QuickStartWizardProps {
  open: boolean;
  onClose: () => void;
}

export function QuickStartWizard({ open, onClose }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border shadow-elevated max-w-md w-full p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm">QuickStart</h2>
            <p className="text-[10px] text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className={cn(
              'h-1.5 flex-1 rounded-full transition-all',
              i <= currentStep ? 'bg-primary' : 'bg-muted',
              completedSteps.has(s.id) && i !== currentStep && 'bg-emerald-500'
            )} />
          ))}
        </div>

        {/* Step content */}
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

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleSkip}>
            {isLast ? 'Done' : 'Skip'}
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
