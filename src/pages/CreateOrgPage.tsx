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
import { ChevronRight, Building2, Check, Rocket, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
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
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [step, setStep] = useState(0); // 0=type, 1=name, 2=currency, 3=goal
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('both');
  const [selectedCurrency, setSelectedCurrency] = useState(() => detectCurrencyFromTimezone());

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
    const currency = selectedCurrency;

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

      // Apply intent-first goal config, if the user came from /start
      let hadStartConfig = false;
      try {
        const raw = sessionStorage.getItem('sv_start_config');
        if (raw) {
          const cfg = JSON.parse(raw) as { siteviral_type?: string; enabled_features?: string[] };
          if (cfg?.siteviral_type) {
            const { confirmSiteviralType } = await import('@/lib/siteviral/activation');
            await confirmSiteviralType(orgId as string, cfg.siteviral_type as any, (cfg.enabled_features ?? []) as any, 'onboarding');
            hadStartConfig = true;
          }
          sessionStorage.removeItem('sv_start_config');
        }
      } catch {}

      toast({ title: isFr ? '🎉 Votre espace est prêt !' : '🎉 Your workspace is ready!', description: data.name });
      if (hadStartConfig) {
        navigate('/admin');
        return;
      }
      setShowOnboarding(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug')) {
        toast({ title: isFr ? 'Ce nom est déjà pris' : 'This name is already taken', description: isFr ? 'Essaie un nom légèrement différent.' : 'Try a slightly different name.', variant: 'destructive' });
      } else {
        toast({ title: isFr ? 'Erreur' : 'Error', description: msg, variant: 'destructive' });
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

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SEOHead title="Créer ma plateforme — Siteviral" description="Crée ta plateforme en 30 secondes. Vends, collecte des dons, et active tes ambassadeurs." noindex />
      <OrgOnboardingWizard open={showOnboarding} onClose={() => { setShowOnboarding(false); navigate('/onboarding/type'); }} />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isFr ? 'Crée ta plateforme' : 'Create your platform'}</h1>
            <p className="text-xs text-muted-foreground">{isFr ? 'Étape' : 'Step'} {step + 1}/{totalSteps} — 30 {isFr ? 'secondes' : 'seconds'}</p>
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
                  <h2 className="text-lg font-semibold">{isFr ? 'Quel type de plateforme ?' : 'What type of platform?'}</h2>
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
                  <h2 className="text-lg font-semibold">{isFr ? 'Comment s\'appelle ta plateforme ?' : 'What is your platform called?'}</h2>
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
                    {isFr ? 'Continuer' : 'Continue'} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Currency */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{isFr ? 'Quelle devise utilises-tu ?' : 'What currency do you use?'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isFr
                      ? 'C\'est la devise dans laquelle tu fixeras tes prix et recevras tes paiements.'
                      : 'This is the currency you\'ll use to set prices and receive payments.'}
                  </p>
                  <div className="space-y-2">
                    <Label>{isFr ? 'Devise' : 'Currency'}</Label>
                    <CurrencySelector
                      value={selectedCurrency}
                      onChange={(c) => setSelectedCurrency(c)}
                      className="h-12 text-base"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isFr ? '💡 Détectée automatiquement, mais tu peux la changer.' : '💡 Auto-detected, but you can change it.'}
                    </p>
                  </div>
                  <Button className="w-full h-11 gap-2" onClick={() => setStep(3)}>
                    {isFr ? 'Continuer' : 'Continue'} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 3: Goal + Create */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{isFr ? 'Que veux-tu faire en premier ?' : 'What do you want to do first?'}</h2>
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
                      <span className="animate-pulse">{isFr ? 'Création en cours…' : 'Creating…'}</span>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5" /> {isFr ? 'Créer ma plateforme' : 'Create my platform'}
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {isFr ? `Devise : ${selectedCurrency} • Slug auto-généré • Modifiable plus tard` : `Currency: ${selectedCurrency} • Auto-generated slug • Editable later`}
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
