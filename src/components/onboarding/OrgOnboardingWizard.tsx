import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Heart, BookOpen, Users, Check, ArrowRight, ArrowLeft, X, Image, FileText, Megaphone, Zap, Rocket, Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useExpressSetup } from '@/hooks/useExpressSetup';

const GOALS = [
  { id: 'sell', icon: ShoppingBag, title: 'Vendre des ressources', desc: 'Ebooks, fichiers digitaux', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  { id: 'donate', icon: Heart, title: 'Recevoir des dons', desc: 'Campagnes de collecte de fonds', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
  { id: 'ambassador', icon: Users, title: 'Programme Ambassadeur', desc: 'Permettre à vos membres de promouvoir', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' },
];

// Replace with actual YouTube video ID for onboarding demo
const ONBOARDING_VIDEO_ID = '';

interface OrgOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OrgOnboardingWizard({ open, onClose }: OrgOnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [videoSkipped, setVideoSkipped] = useState(!ONBOARDING_VIDEO_ID);
  const navigate = useNavigate();
  const { currentOrg, refetchOrgs } = useOrg();
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const expressSetup = useExpressSetup();

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // If video is available, we have 4 steps; otherwise 3
  const hasVideo = !!ONBOARDING_VIDEO_ID && !videoSkipped;
  const totalSteps = hasVideo ? 4 : 3;
  const adjustedStep = hasVideo ? step : (step === 0 ? 0 : step); // step mapping stays the same

  const handleSaveAndContinue = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (description) updates.description = description;
      if (logoUrl) updates.logo_url = logoUrl;
      if (Object.keys(updates).length > 0) {
        await db.from('organizations').update(updates).eq('id', currentOrg.id);
        refetchOrgs();
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
    setStep(hasVideo ? 3 : 2);
  };

  const handleFinish = () => {
    onClose();
    if (selected.includes('sell')) navigate('/admin/products/new');
    else if (selected.includes('donate')) navigate('/admin/campaigns/new');
    else navigate('/admin');
  };

  const stepContent: React.ReactNode[] = [];

  // Step 0: Demo video (only if video ID is set)
  if (hasVideo) {
    stepContent.push(
      <motion.div key="video" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold">{t('onboarding.video_title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('onboarding.video_desc')}</p>
        </div>
        <div className="rounded-2xl overflow-hidden aspect-video bg-muted border border-border">
          <iframe
            src={`https://www.youtube.com/embed/${ONBOARDING_VIDEO_ID}?rel=0`}
            title="Siteviral Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <button
          onClick={() => { setVideoSkipped(true); setStep(0); }}
          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors mx-auto block"
        >
          {t('onboarding.video_skip')}
        </button>
      </motion.div>
    );
  }

  // Goals step
  stepContent.push(
    <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-3">
          <Rocket className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold">Que souhaitez-vous faire ?</h2>
        <p className="text-sm text-muted-foreground mt-1">Sélectionnez un ou plusieurs objectifs</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => toggle(g.id)}
            className={cn(
              'p-4 rounded-2xl border-2 text-left transition-all space-y-2',
              selected.includes(g.id)
                ? `bg-gradient-to-br ${g.color} border-primary shadow-card`
                : 'border-border bg-card hover:border-muted-foreground/40'
            )}
          >
            <g.icon className={cn('h-5 w-5', selected.includes(g.id) ? 'text-primary' : 'text-muted-foreground')} />
            <p className="font-semibold text-sm">{g.title}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{g.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );

  // Branding step
  stepContent.push(
    <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Image className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Personnalisez votre plateforme</h2>
        <p className="text-sm text-muted-foreground mt-1">Logo et description (modifiable plus tard)</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Logo</label>
          <ImageUploader
            value={logoUrl}
            onChange={setLogoUrl}
            folder={currentOrg?.id || 'temp'}
            aspectRatio="square"
            label="Logo"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Description courte</label>
          <Input
            placeholder="En une phrase, décrivez votre plateforme…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    </motion.div>
  );

  // Ready step
  stepContent.push(
    <motion.div key="ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 text-center px-2">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Zap className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold">🎉 Votre plateforme est prête !</h2>
      <p className="text-sm text-muted-foreground">
        {selected.length > 0
          ? `Commencez par ${selected.includes('sell') ? 'créer votre premier produit' : selected.includes('donate') ? 'lancer votre première campagne' : 'explorer votre espace admin'}.`
          : 'Explorez votre espace admin pour commencer.'}
      </p>

      {/* Express Setup CTA */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Démarrage Express</p>
            <p className="text-[11px] text-muted-foreground">Crée automatiquement un produit gratuit + une campagne de dons pour démarrer en 1 clic.</p>
          </div>
        </div>
        <Button
          onClick={async () => { await expressSetup.run(); }}
          disabled={expressSetup.loading}
          size="sm"
          className="w-full gap-2 bg-primary text-primary-foreground"
        >
          {expressSetup.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {expressSetup.loading ? 'Création…' : 'Lancer le Démarrage Express'}
        </Button>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prochaines étapes</p>
        <div className="space-y-1.5 text-sm">
          {selected.includes('sell') && (
            <div className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5 text-primary" /> Créer votre premier produit</div>
          )}
          {selected.includes('donate') && (
            <div className="flex items-center gap-2"><Heart className="h-3.5 w-3.5 text-rose-500" /> Lancer une campagne de dons</div>
          )}
          {selected.includes('ambassador') && (
            <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-amber-500" /> Activer le Programme Ambassadeur</div>
          )}
          <div className="flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-muted-foreground" /> Publier votre première annonce</div>
        </div>
      </div>
      {/* KYC reassurance */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-left mt-3">
        <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 shrink-0" />
          Vérification KYC non requise pour démarrer
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Vous pouvez publier et recevoir des paiements immédiatement. Les fonds sont retenus en sécurité jusqu'à la vérification de votre compte (72h après chaque transaction). Complétez votre KYC à tout moment dans les paramètres.
        </p>
      </div>
    </motion.div>
  );

  const lastStepIndex = stepContent.length - 1;
  const secondToLastIndex = stepContent.length - 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-elevated max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {stepContent[step]}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && step < lastStepIndex && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          )}
          <div className="flex-1" />
          {step < secondToLastIndex && (
            <Button onClick={() => setStep(s => s + 1)} className="bg-primary text-primary-foreground gap-1.5">
              Continuer <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === secondToLastIndex && (
            <Button onClick={handleSaveAndContinue} disabled={saving} className="bg-primary text-primary-foreground gap-1.5">
              {saving ? 'Enregistrement…' : 'Continuer'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === lastStepIndex && (
            <Button onClick={handleFinish} className="bg-primary text-primary-foreground gap-1.5">
              C'est parti ! <Rocket className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Étape {step + 1} sur {totalSteps} · <button onClick={onClose} className="underline hover:text-foreground">Passer</button>
        </p>
      </motion.div>
    </div>
  );
}
