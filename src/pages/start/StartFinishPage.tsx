import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Rocket, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StartShell } from '@/components/start/StartShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';
import { confirmSiteviralType } from '@/lib/siteviral/activation';
import { resolveActivity } from '@/lib/siteviral/moduleToFeatures';
import { setIntent } from '@/lib/intent';
import { toast } from 'sonner';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

const CONFIG_KEY = 'sv_start_config';
const DONE_KEY = 'sv_start_done_orgid';

const slugify = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) ||
    'space-' + Math.random().toString(36).slice(2, 7);

interface StoredConfig {
  activity: string;
  workspace_type?: string;
  siteviral_type: SiteviralType;
  enabled_features: SiteviralFeatureKey[];
  name: string;
  city?: string;
  denomination?: string | null;
  currency?: string;
  specialties?: string[];
  custom_profession?: string;
  starter_services?: string[];
  custom_services?: string[];
  service_mode?: string | null;
  name_mode?: 'business' | 'personal';
}

export default function StartFinishPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchOrgs, setCurrentOrg } = useOrg();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const ran = useRef(false);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cfg: StoredConfig | null = (() => {
    try {
      const raw = sessionStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const resolved = cfg ? resolveActivity(cfg.activity) : resolveActivity('general');
  const label = fr ? resolved.labelFr : resolved.labelEn;

  const checklist = [
    { label: fr ? 'Espace créé' : 'Space created' },
    { label: fr ? 'Paiement & KYC préparés' : 'Payment & KYC ready' },
    { label: fr ? `Outils ${label} activés` : `${label} tools enabled` },
    { label: fr ? 'Tableau de bord prêt' : 'Dashboard ready' },
  ];

  useEffect(() => {
    if (!user) {
      setIntent('provider', '/start/finish');
      navigate('/auth?mode=signup&returnTo=/start/finish', { replace: true });
      return;
    }
    if (!cfg?.name) {
      navigate('/start', { replace: true });
      return;
    }
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        // Idempotency
        const done = sessionStorage.getItem(DONE_KEY);
        let orgId = done;

        if (!orgId) {
          setStep(1);
          const { data, error } = await db.rpc('create_organization_with_owner', {
            _name: cfg.name,
            _slug: slugify(cfg.name),
            _category: cfg.activity === 'church' ? 'church' : 'leader',
            _description: cfg.city ? (fr ? `Basé à ${cfg.city}` : `Based in ${cfg.city}`) : null,
            _currency: cfg.currency || 'XOF',
          });
          if (error) throw error;
          orgId = data as string;
          sessionStorage.setItem(DONE_KEY, orgId);
        }

        setStep(2);
        await new Promise((r) => setTimeout(r, 350));

        setStep(3);
        await confirmSiteviralType(
          orgId!,
          cfg.siteviral_type,
          cfg.enabled_features as SiteviralFeatureKey[],
          'onboarding',
        );

        // Persist the provider profile snapshot from the new onboarding wizard.
        // Safe additive write — old orgs keep provider_profile = {}.
        const providerProfile = {
          workspace_type: cfg.workspace_type ?? cfg.activity ?? null,
          specialties: cfg.specialties ?? [],
          starter_services: cfg.starter_services ?? [],
          custom_services: cfg.custom_services ?? [],
          custom_profession: cfg.custom_profession ?? null,
          service_mode: cfg.service_mode ?? null,
          name_mode: cfg.name_mode ?? 'business',
        };
        try {
          await db.from('organizations')
            .update({ provider_profile: providerProfile } as any)
            .eq('id', orgId!);
        } catch { /* non-fatal — dashboard still works */ }

        // Fetch and set current
        const { data: org } = await db.from('organizations').select('*').eq('id', orgId!).maybeSingle();
        if (org) setCurrentOrg(org as any);
        await refetchOrgs();

        setStep(4);
        sessionStorage.removeItem(CONFIG_KEY);
        sessionStorage.removeItem(DONE_KEY);

        await new Promise((r) => setTimeout(r, 700));
        toast.success(fr ? '🎉 Votre espace est prêt' : '🎉 Your space is ready');
        navigate('/dashboard', { replace: true });
      } catch (e: any) {
        const msg = e?.message || String(e);
        setError(msg);
        toast.error(msg);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <StartShell step={3} onBack={() => navigate('/start/details')}>
      <SEOHead title={fr ? 'Création de votre espace…' : 'Setting up your space…'} description="" noindex />

      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            {step >= 4 ? <Rocket className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {step >= 4
              ? (fr ? 'Votre espace est prêt !' : 'Your space is ready!')
              : (fr ? 'Nous préparons votre espace' : 'Setting up your space')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cfg?.name ? `${cfg.name} · ${label}` : label}
          </p>
        </div>

        <ul className="space-y-2">
          {checklist.map((item, i) => {
            const done = step > i;
            const active = step === i + 1;
            return (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  done ? 'border-primary/40 bg-primary/5' : active ? 'border-primary/60 bg-primary/10' : 'border-border'
                }`}
              >
                <span className={`h-8 w-8 grid place-items-center rounded-lg ${
                  done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </motion.li>
            );
          })}
        </ul>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-3">
            <p className="font-semibold text-destructive">
              {fr ? 'Une erreur est survenue' : 'An error occurred'}
            </p>
            <p className="text-xs text-muted-foreground break-words">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem(DONE_KEY); location.reload(); }}>
                {fr ? 'Réessayer' : 'Retry'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/start/details')}>
                {fr ? 'Modifier' : 'Edit details'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </StartShell>
  );
}
