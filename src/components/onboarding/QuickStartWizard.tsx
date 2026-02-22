import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import {
  Image, Megaphone, ShoppingBag, Heart, Link2,
  ArrowRight, ArrowLeft, CheckCircle, Sparkles, X, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'branding', icon: Image, title: 'Add Logo & Banner', desc: 'Upload your logo, banner, and add your WhatsApp number.', route: '/admin/settings', cta: 'Go to Settings' },
  { id: 'announcement', icon: Megaphone, title: 'Create First Announcement', desc: 'Post your first announcement to welcome your community.', route: '/admin/announcements/new', cta: 'Create Announcement' },
  { id: 'product', icon: ShoppingBag, title: 'Add a Digital Product', desc: 'List your first ebook, course, or digital resource.', route: '/admin/products/new', cta: 'Add Product' },
  { id: 'campaign', icon: Heart, title: 'Launch a Campaign', desc: 'Set up a donation campaign for your community.', route: '/admin/campaigns/new', cta: 'Create Campaign' },
  { id: 'affiliate', icon: Link2, title: 'Enable Affiliation', desc: 'Let your members promote and earn commissions.', route: '/admin/affiliation', cta: 'Setup Affiliation' },
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
          <div className="h-8 w-8 rounded-xl gold-gradient flex items-center justify-center">
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
              i <= currentStep ? 'gold-gradient' : 'bg-muted',
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
        <div className="flex gap-2 mt-6">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleSkip}>
            {isLast ? 'Done' : 'Skip'}
          </Button>
          <Button size="sm" onClick={handleAction} className="gap-1.5 gold-gradient text-primary-foreground border-0 shadow-gold">
            {step.cta} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
