import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag, Heart, BookOpen, Users, Check, ArrowRight, ArrowLeft,
  X, Image, FileText, Megaphone, Sparkles, Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const GOALS = [
  { id: 'sell', icon: ShoppingBag, title: 'Vendre des ressources', desc: 'Ebooks, fichiers digitaux', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  { id: 'donate', icon: Heart, title: 'Recevoir des dons', desc: 'Campagnes de collecte de fonds', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
  { id: 'ambassador', icon: Users, title: 'Programme Ambassadeur', desc: 'Permettre à vos membres de promouvoir', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' },
];

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
  const navigate = useNavigate();
  const { currentOrg, refetchOrgs } = useOrg();
  const { toast } = useToast();
  const qc = useQueryClient();

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalSteps = 3;

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
    setStep(2);
  };

  const handleFinish = () => {
    onClose();
    if (selected.includes('sell')) navigate('/admin/products/new');
    else if (selected.includes('donate')) navigate('/admin/campaigns/new');
    else navigate('/admin');
  };

  const stepContent = [
    // Step 0: Goals
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
    </motion.div>,

    // Step 1: Branding
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
    </motion.div>,

    // Step 2: Ready
    <motion.div key="ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 text-center">
      <div className="h-16 w-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold">🎉 Votre plateforme est prête !</h2>
      <p className="text-sm text-muted-foreground">
        {selected.length > 0
          ? `Commencez par ${selected.includes('sell') ? 'créer votre premier produit' : selected.includes('donate') ? 'lancer votre première campagne' : 'explorer votre espace admin'}.`
          : 'Explorez votre espace admin pour commencer.'}
      </p>
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
      {/* KYC reassurance — funds are safe even without KYC */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-left mt-3">
        <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 shrink-0" />
          Vérification KYC non requise pour démarrer
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Vous pouvez publier et recevoir des paiements immédiatement. Les fonds sont retenus en sécurité jusqu'à la vérification de votre compte (72h après chaque transaction). Complétez votre KYC à tout moment dans les paramètres.
        </p>
      </div>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-elevated max-w-lg w-full p-6 sm:p-8 relative"
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
          {step > 0 && step < 2 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          )}
          <div className="flex-1" />
          {step === 0 && (
            <Button onClick={() => setStep(1)} className="bg-primary text-primary-foreground gap-1.5">
              Continuer <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleSaveAndContinue} disabled={saving} className="bg-primary text-primary-foreground gap-1.5">
              {saving ? 'Enregistrement…' : 'Continuer'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
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
