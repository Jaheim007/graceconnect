import { useEffect, useState } from 'react';
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
import { WORLDS, type SiteviralWorld } from '@/lib/siteviral/worlds';
import { createWorkspace } from '@/lib/siteviral/createWorkspace';
import { PLATFORM_PROFILES, getPlatformProfile, profileForWorld, type PlatformProfileId } from '@/lib/siteviral/platformProfiles';


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
  // Preselected world from any entry point: /create-org?world=digital|church|…
  // (also accepts the legacy ?activity= param used by the old /start flow)
  const worldParam = (searchParams.get('world') || searchParams.get('activity') || '') as SiteviralWorld;
  const presetWorld: SiteviralWorld | null = worldParam && worldParam in WORLDS ? worldParam : null;

  const presetProfile = profileForWorld(presetWorld);
  const [step, setStep] = useState(presetProfile ? 1 : 0); // 0=platform profile, 1=name, 2=currency, 3=first objective
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileId, setProfileId] = useState<PlatformProfileId>(presetProfile ?? 'creator');
  const profile = getPlatformProfile(profileId);
  const [selectedGoal, setSelectedGoal] = useState<string>(profile.objectives[0].id);
  const selectedWorld: SiteviralWorld = profile.world;

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

  // Auto-resume after auth: if we stashed values before login, restore + submit
  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem('sv_create_org_pending');
      if (!raw) return;
      const pending = JSON.parse(raw) as { values: FormData; currency: string; goal: string };
      sessionStorage.removeItem('sv_create_org_pending');
      if (pending.values?.name) setValue('name', pending.values.name);
      if (pending.values?.category) setValue('category', pending.values.category);
      if (pending.currency) setSelectedCurrency(pending.currency);
      if (pending.goal) setSelectedGoal(pending.goal);
      setStep(3);
      setResuming(true);
      setTimeout(() => { void onSubmit(); }, 50);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);



  const onSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    // Not authenticated yet — stash and send to auth, then auto-resume
    if (!user) {
      try {
        sessionStorage.setItem('sv_create_org_pending', JSON.stringify({
          values: form.getValues(),
          currency: selectedCurrency,
          goal: selectedGoal,
        }));
      } catch {}
      navigate('/auth?mode=signup&returnTo=/create-org');
      return;
    }


    setLoading(true);
    const data = form.getValues();

    try {
      // Single workspace-creation engine — shared by every entry point.
      let extraFeatures: any[] = [];
      let hadStartConfig = false;
      let providerProfile: Record<string, unknown> | null = null;
      try {
        const raw = sessionStorage.getItem('sv_start_config');
        if (raw) {
          const cfg = JSON.parse(raw) as { enabled_features?: string[]; specialties?: string[]; starter_services?: string[] };
          extraFeatures = (cfg?.enabled_features ?? []) as any[];
          providerProfile = {
            specialties: cfg?.specialties ?? [],
            starter_services: cfg?.starter_services ?? [],
          };
          hadStartConfig = true;
          sessionStorage.removeItem('sv_start_config');
        }
      } catch { /* ignore */ }

      const objective = profile.objectives.find((o) => o.id === selectedGoal) ?? profile.objectives[0];

      const { orgId, org: newOrg } = await createWorkspace({
        name: data.name,
        world: selectedWorld,
        currency: selectedCurrency,
        extraFeatures: [...extraFeatures, ...objective.features],
        providerProfile,
        partnerCode,
      });

      if (newOrg) setCurrentOrg(newOrg as any);
      refetchOrgs();

      if (user.email) {
        sendEmailNotification('org_created', user.email, { org_name: data.name }, orgId);
      }

      toast({ title: isFr ? '🎉 Votre espace est prêt !' : '🎉 Your workspace is ready!', description: data.name });
      if (hadStartConfig) {
        navigate('/dashboard');
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
    <div className="relative min-h-screen bg-background flex flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_40%_at_15%_0%,hsl(var(--primary)/0.14),transparent_70%),radial-gradient(50%_40%_at_90%_10%,hsl(var(--accent)/0.14),transparent_70%)]" />

      <SEOHead title="Créer ma plateforme — Siteviral" description="Crée ta plateforme en 30 secondes. Vends, collecte des dons, et active tes ambassadeurs." noindex />
      <OrgOnboardingWizard open={showOnboarding} onClose={() => { setShowOnboarding(false); navigate('/onboarding/type'); }} />

      {/* Top bar with brand */}
      <header className="w-full border-b border-border/40 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src="/logo-s.png" alt="Siteviral" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-bold tracking-tight">Siteviral</span>
          </button>
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            {isFr ? 'Étape' : 'Step'} {step + 1} / {totalSteps}
          </span>
        </div>
      </header>

      {resuming && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm px-6">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{isFr ? 'Création de ta plateforme…' : 'Creating your platform…'}</h2>
              <p className="text-xs text-muted-foreground">{isFr ? 'Encore quelques secondes.' : 'A few more seconds.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{isFr ? 'Crée ta plateforme' : 'Create your platform'}</h1>
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

              {/* Step 0: Platform profile */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">{isFr ? 'Quel type de plateforme veux-tu bâtir ?' : 'What kind of platform do you want to build?'}</h2>
                    <p className="text-sm text-muted-foreground">{isFr ? 'Choisis ton profil. Tu pourras activer d\'autres outils plus tard depuis les paramètres.' : 'Pick your profile. You can activate more tools later from settings.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORM_PROFILES.map((p) => {
                      const active = profileId === p.id;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProfileId(p.id);
                            setSelectedGoal(p.objectives[0].id);
                            setValue('category', p.category as any);
                            setStep(1);
                          }}
                          className={cn(
                            'group relative overflow-hidden p-5 rounded-2xl border text-left backdrop-blur-xl transition-all duration-300',
                            'hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15',
                            active
                              ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/20'
                              : 'border-border/60 bg-card/70 hover:border-primary/40'
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl transition-opacity duration-300',
                              active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                          />
                          <div className={cn(
                            'relative h-11 w-11 rounded-xl flex items-center justify-center mb-3 ring-1 transition-colors',
                            active
                              ? 'bg-primary/15 text-primary ring-primary/30'
                              : 'bg-muted/60 text-muted-foreground ring-border/60 group-hover:bg-primary/10 group-hover:text-primary group-hover:ring-primary/30'
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="relative text-sm font-bold block mb-1">{isFr ? p.labelFr : p.labelEn}</span>
                          <span className="relative text-[11px] text-muted-foreground leading-snug block">{isFr ? p.descFr : p.descEn}</span>
                        </button>
                      );
                    })}
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

              {/* Step 3: First objective + Create */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{isFr ? 'Que veux-tu faire en premier ?' : 'What do you want to do first?'}</h2>
                  <div className="space-y-2">
                    {profile.objectives.map(goal => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                          selectedGoal === goal.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40'
                        )}
                      >
                        <span className="text-2xl">{goal.emoji}</span>
                        <p className="text-sm font-bold">{isFr ? goal.labelFr : goal.labelEn}</p>
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
    </div>
  );
}
