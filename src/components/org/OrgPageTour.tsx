import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  title_fr: string;
  title_en: string;
  desc_fr: string;
  desc_en: string;
  emoji: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    emoji: '⚙️',
    title_fr: 'Barre d\'outils admin',
    title_en: 'Admin Toolbar',
    desc_fr: 'Le bouton "Gérer ma page" en bas à droite vous donne accès à toutes les actions rapides pour modifier votre page.',
    desc_en: 'The "Manage page" button at the bottom right gives you quick access to all actions to edit your page.',
  },
  {
    emoji: '✏️',
    title_fr: 'Modification en ligne',
    title_en: 'Inline Editing',
    desc_fr: 'Survolez le nom, la description ou la biographie et cliquez pour modifier directement sur la page.',
    desc_en: 'Hover over your name, description or biography and click to edit directly on the page.',
  },
  {
    emoji: '📦',
    title_fr: 'Ajouter du contenu',
    title_en: 'Add Content',
    desc_fr: 'Depuis le panneau admin, ajoutez rapidement des produits, du contenu média, des événements, des campagnes ou des photos.',
    desc_en: 'From the admin panel, quickly add products, media content, events, campaigns or photos.',
  },
  {
    emoji: '🔀',
    title_fr: 'Glisser-déposer les sections',
    title_en: 'Drag & Drop Sections',
    desc_fr: 'Glissez-déposez les sections dans le panneau pour les réorganiser. Vous pouvez aussi masquer celles que vous ne voulez pas afficher.',
    desc_en: 'Drag and drop sections in the panel to reorder them. You can also hide the ones you don\'t want to show.',
  },
  {
    emoji: '🎨',
    title_fr: 'Personnaliser les couleurs',
    title_en: 'Customize Colors',
    desc_fr: 'Choisissez votre couleur principale et votre couleur d\'accent dans le panneau pour personnaliser l\'apparence de votre page.',
    desc_en: 'Choose your primary and accent color in the panel to customize the look of your page.',
  },
  {
    emoji: '🔗',
    title_fr: 'Programme ambassadeur',
    title_en: 'Ambassador Program',
    desc_fr: 'Activez ou désactivez votre programme ambassadeur directement depuis le panneau de gestion.',
    desc_en: 'Enable or disable your ambassador program directly from the management panel.',
  },
  {
    emoji: '🖼️',
    title_fr: 'Images et bannière',
    title_en: 'Images & Banner',
    desc_fr: 'Cliquez sur la bannière ou le logo pour les modifier directement. Maximum 10 Mo par image.',
    desc_en: 'Click on the banner or logo to edit them directly. Maximum 10 MB per image.',
  },
];

interface OrgPageTourProps {
  open: boolean;
  onClose: () => void;
}

export function OrgPageTour({ open, onClose }: OrgPageTourProps) {
  const { locale } = useI18n();
  const [step, setStep] = useState(0);
  const isFr = locale === 'fr';
  const current = TOUR_STEPS[step];

  useEffect(() => { if (open) setStep(0); }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-elevated max-w-sm w-full p-6 relative"
        >
          <button onClick={onClose} className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="h-4 w-4" />
          </button>

          <div className="text-center mb-4">
            <span className="text-4xl">{current.emoji}</span>
          </div>

          <h3 className="text-lg font-bold text-center mb-2">
            {isFr ? current.title_fr : current.title_en}
          </h3>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
            {isFr ? current.desc_fr : current.desc_en}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> {isFr ? 'Précédent' : 'Previous'}
            </Button>
            {step < TOUR_STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
                {isFr ? 'Suivant' : 'Next'} <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={onClose} className="bg-primary text-primary-foreground">
                {isFr ? 'Compris !' : 'Got it!'}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
