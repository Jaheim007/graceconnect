import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { sendEmailNotification } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, Building2, Check, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrgOnboardingWizard } from '@/components/onboarding/OrgOnboardingWizard';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';

const TYPES = [
  { value: 'leader', emoji: '👤', label: 'Créateur / Auteur', desc: 'Tu vends tes propres créations' },
  { value: 'church', emoji: '🏢', label: 'Organisation', desc: 'Église, association, entreprise' },
  { value: 'ngo', emoji: '🌍', label: 'ONG / Association', desc: 'Collecte de fonds et ressources' },
  { value: 'community', emoji: '🏘️', label: 'Communauté', desc: 'Groupe, club, mouvement' },
] as const;

const GOALS = [
  { value: 'sell', emoji: '💰', label: 'Vendre', desc: 'Produits numériques, ebooks, formations' },
  { value: 'donate', emoji: '❤️', label: 'Collecter des dons', desc: 'Campagnes de financement' },
  { value: 'both', emoji: '🚀', label: 'Les deux', desc: 'Ventes + collecte de dons' },
] as const;

const schema = z.object({
  name: z.string().min(3, 'Au moins 3 caractères').max(80),
  category: z.enum(['church', 'ministry', 'leader', 'ngo', 'community', 'other']),
});

type FormData = z.infer<typeof schema>;

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const PARTNER_STORAGE_KEY = 'sv_partner_code';

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refetchOrgs, setCurrentOrg } = useOrg();
  const { toast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState(0); // 0=type, 1=name, 2=goal (just visual, not stored)
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('both');

  const urlPartnerCode = searchParams.get('partner');
  const [partnerCode] = useState<string | null>(() => {
    if (urlPartnerCode) {
      try { sessionStorage.setItem(PARTNER_STORAGE_KEY, urlPartnerCode); } catch {}
      return urlPartnerCode;
    }
    try { return sessionStorage.getItem(PARTNER_STORAGE_KEY); } catch { return null; }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'leader', name: '' },
  });

  const { watch, setValue, formState: { errors } } = form;
  const selectedCategory = watch('category');
  const nameVal = watch('name');

  const onSubmit = async () => {
    const valid = await form.trigger();
    if (!valid || !user) return;

    setLoading(true);
    const data = form.getValues();
    const slug = slugify(data.name);
    const currency = detectCurrencyFromTimezone();

    try {
      const { data: orgId, error } = await db.rpc('create_organization_with_owner', {
        _name: data.name,
        _slug: slug,
        _category: data.category,
        _description: null,
        _currency: currency,
      });
      if (error) throw error;

      const { data: newOrg } = await db
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (newOrg) setCurrentOrg(newOrg as any);
      refetchOrgs();

      // Partner attribution
      if (partnerCode) {
        try {
          await db.rpc('attribute_org_to_partner', { _org_id: orgId, _partner_code: partnerCode });
          try { sessionStorage.removeItem(PARTNER_STORAGE_KEY); } catch {}
        } catch {}
      }

      if (user.email) {
        sendEmailNotification('org_created', user.email, { org_name: data.name }, orgId);
      }

      toast({ title: '🎉 Espace créé !', description: data.name });
      setShowOnboarding(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug')) {
        toast({ title: 'Ce nom est déjà pris', description: 'Essaie un nom légèrement différent.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SEOHead title="Créer mon espace — Siteviral" description="Crée ton espace en 30 secondes. Vends, collecte des dons, et active tes ambassadeurs." noindex />
      <OrgOnboardingWizard open={showOnboarding} onClose={() => { setShowOnboarding(false); navigate('/admin'); }} />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Crée ton espace</h1>
            <p className="text-xs text-muted-foreground">Étape {step + 1}/{totalSteps} — 30 secondes</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2 }}>

              {/* Step 0: Type */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Quel type d'espace ?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setValue('category', type.value);
                          setStep(1);
                        }}
                        className={cn(
                          'p-4 rounded-2xl border-2 text-left transition-all',
                          selectedCategory === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-muted-foreground/40'
                        )}
                      >
                        <span className="text-2xl block mb-1">{type.emoji}</span>
                        <span className="text-sm font-bold block">{type.label}</span>
                        <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Name only */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Comment s'appelle ton espace ?</h2>
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      placeholder={selectedCategory === 'leader' ? 'Ex. Jean Dupont' : 'Ex. Mon Espace Digital'}
                      {...form.register('name')}
                      autoFocus
                      className={cn('h-12 text-base', errors.name ? 'border-destructive' : '')}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      URL auto-générée : siteviral.com/org/{nameVal ? slugify(nameVal) : '...'}
                    </p>
                  </div>
                  <Button className="w-full h-11 gap-2" onClick={() => {
                    form.trigger('name').then(ok => ok && setStep(2));
                  }}>
                    Continuer <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Goal + Create */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Que veux-tu faire en premier ?</h2>
                  <div className="space-y-2">
                    {GOALS.map(goal => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setSelectedGoal(goal.value)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                          selectedGoal === goal.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40'
                        )}
                      >
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <p className="text-sm font-bold">{goal.label}</p>
                          <p className="text-[10px] text-muted-foreground">{goal.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-12 gap-2 text-base font-bold"
                    onClick={onSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="animate-pulse">Création en cours…</span>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5" /> Créer mon espace
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground text-center">
                    Devise auto-détectée • Slug auto-généré • Modifiable plus tard
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour
          </button>
        )}
      </div>
    </div>
  );
}
