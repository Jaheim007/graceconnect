import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Search, Plus, X } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StartShell } from '@/components/start/StartShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { setIntent } from '@/lib/intent';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import {
  getWorkspaceType,
  flattenSpecialties,
  suggestedServicesFor,
  MAX_SPECIALTIES,
  type WorkspaceTypeDef,
} from '@/lib/siteviral/serviceTaxonomy';
import { resolveActivity } from '@/lib/siteviral/moduleToFeatures';

const CONFIG_KEY = 'sv_start_config';

interface StoredConfig {
  workspace_type?: string;
  activity?: string;
  siteviral_type?: string;
  enabled_features?: string[];
  name?: string;
  city?: string;
  currency?: string;
  specialties?: string[];
  custom_profession?: string;
  starter_services?: string[];
  custom_services?: string[];
  service_mode?: string | null;
  name_mode?: 'business' | 'personal';
}

const readConfig = (): StoredConfig => {
  try { return JSON.parse(sessionStorage.getItem(CONFIG_KEY) || '{}'); }
  catch { return {}; }
};
const writeConfig = (c: StoredConfig) => {
  try { sessionStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch { /* ignore */ }
};

export default function StartDetailsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const [cfg, setCfg] = useState<StoredConfig>(() => readConfig());
  const workspaceKey = params.get('activity') || cfg.workspace_type || cfg.activity || null;
  const type = useMemo(() => getWorkspaceType(workspaceKey), [workspaceKey]);

  useEffect(() => {
    if (!workspaceKey) { navigate('/start', { replace: true }); return; }
    if (!type) { navigate('/start', { replace: true }); return; }
    if (type.key === 'digital') { navigate('/create-org', { replace: true }); return; }
  }, [workspaceKey, type, navigate]);

  const [step, setStep] = useState(0); // 0=specialties, 1=services, 2=details, 3=review

  if (!type || type.key === 'digital') return null;

  const persist = (patch: Partial<StoredConfig>) => {
    const merged = { ...cfg, ...patch };
    setCfg(merged);
    writeConfig(merged);
  };

  const stepsTotal = 4;

  return (
    <StartShell
      step={2}
      onBack={() => {
        if (step === 0) navigate('/start');
        else setStep(step - 1);
      }}
    >
      <SEOHead
        title={fr ? 'Détails de votre activité — Siteviral' : 'Your activity details — Siteviral'}
        description=""
        noindex
      />

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-2.5 py-1">
            {fr ? type.label.fr : type.label.en}
          </span>
          <span>·</span>
          <span>{fr ? `Étape ${step + 1} sur ${stepsTotal}` : `Step ${step + 1} of ${stepsTotal}`}</span>
        </div>

        <div className="flex gap-1">
          {Array.from({ length: stepsTotal }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 0 && (
          <SpecialtiesStep
            type={type} fr={fr} cfg={cfg} persist={persist}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <ServicesStep
            type={type} fr={fr} cfg={cfg} persist={persist}
            onBack={() => setStep(0)} onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DetailsStep
            type={type} fr={fr} cfg={cfg} persist={persist}
            onBack={() => setStep(1)} onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            type={type} fr={fr} cfg={cfg} user={user}
            onBack={() => setStep(2)}
            onSubmit={() => {
              const resolved = resolveActivity(type.key);
              const payload: StoredConfig = {
                ...cfg,
                workspace_type: type.key,
                activity: type.key,
                siteviral_type: type.siteviral_type,
                enabled_features: resolved.enabled_features,
                currency: cfg.currency || detectCurrencyFromTimezone(),
              };
              writeConfig(payload);
              if (!user) {
                setIntent('provider', '/start/finish');
                navigate('/auth?mode=signup&returnTo=' + encodeURIComponent('/start/finish'));
                return;
              }
              navigate('/start/finish');
            }}
          />
        )}
      </div>
    </StartShell>
  );
}

// ------------- Step 1: Specialties -------------

function SpecialtiesStep({
  type, fr, cfg, persist, onNext,
}: {
  type: WorkspaceTypeDef; fr: boolean; cfg: StoredConfig;
  persist: (p: Partial<StoredConfig>) => void; onNext: () => void;
}) {
  const [query, setQuery] = useState('');
  const [customProfession, setCustomProfession] = useState(cfg.custom_profession || '');
  const selected = new Set(cfg.specialties ?? []);

  const rows = useMemo(() => flattenSpecialties(type), [type]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.label.fr, r.label.en, r.groupLabel.fr, r.groupLabel.en, ...r.aliases,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const r of filtered) {
      if (!m.has(r.groupKey)) m.set(r.groupKey, []);
      m.get(r.groupKey)!.push(r);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else {
      if (next.size >= MAX_SPECIALTIES) {
        toast.error(fr ? `Maximum ${MAX_SPECIALTIES} spécialités` : `Maximum ${MAX_SPECIALTIES} specialties`);
        return;
      }
      next.add(key);
    }
    persist({ specialties: Array.from(next) });
  };

  const canContinue = selected.size > 0 || (type.key === 'other' && customProfession.trim().length >= 2);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">
          {fr ? type.specialtiesPrompt.fr : type.specialtiesPrompt.en}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr
            ? `Choisissez jusqu’à ${MAX_SPECIALTIES}. Sélectionnées : ${selected.size}`
            : `Choose up to ${MAX_SPECIALTIES}. Selected: ${selected.size}`}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fr ? 'Rechercher…' : 'Search…'}
          className="pl-9 h-11"
        />
      </div>

      <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
        {grouped.map(([gk, items]) => (
          <div key={gk} className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {fr ? items[0].groupLabel.fr : items[0].groupLabel.en}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => {
                const isSel = selected.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggle(s.key)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:border-muted-foreground/40'
                    }`}
                  >
                    {isSel && <Check className="h-3 w-3" />}
                    {fr ? s.label.fr : s.label.en}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {fr ? 'Aucun résultat.' : 'No results.'}
          </p>
        )}
      </div>

      {type.key === 'other' && (
        <div className="space-y-1.5 border-t pt-4">
          <Label className="text-xs font-semibold">
            {fr ? 'Mon service n’est pas dans la liste' : 'My service is not listed'}
          </Label>
          <Input
            value={customProfession}
            onChange={(e) => {
              setCustomProfession(e.target.value);
              persist({ custom_profession: e.target.value });
            }}
            placeholder={fr ? 'Décrivez votre profession' : 'Describe your profession'}
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">
            {fr ? 'Sera examiné par notre équipe.' : 'Will be reviewed by our team.'}
          </p>
        </div>
      )}

      <Button onClick={onNext} disabled={!canContinue} className="w-full h-12 gap-2 font-bold">
        {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ------------- Step 2: Services -------------

function ServicesStep({
  type, fr, cfg, persist, onBack, onNext,
}: {
  type: WorkspaceTypeDef; fr: boolean; cfg: StoredConfig;
  persist: (p: Partial<StoredConfig>) => void; onBack: () => void; onNext: () => void;
}) {
  const suggestions = useMemo(
    () => suggestedServicesFor(type, cfg.specialties ?? []),
    [type, cfg.specialties],
  );
  const selected = new Set(cfg.starter_services ?? []);
  const [custom, setCustom] = useState(cfg.custom_services ?? []);
  const [draft, setDraft] = useState('');

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    persist({ starter_services: Array.from(next) });
  };

  const addCustom = () => {
    const v = draft.trim();
    if (v.length < 2) return;
    const next = [...custom, v];
    setCustom(next); setDraft('');
    persist({ custom_services: next });
  };
  const removeCustom = (i: number) => {
    const next = custom.filter((_, idx) => idx !== i);
    setCustom(next);
    persist({ custom_services: next });
  };

  const hasAny = selected.size + custom.length > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">
          {fr ? 'Quels services proposez-vous ?' : 'Which services do you provide?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr
            ? 'Choisissez parmi les suggestions ou ajoutez le vôtre. Vous pourrez tout modifier après.'
            : 'Pick from the suggestions or add your own. You can edit everything later.'}
        </p>
      </div>

      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
        {suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {fr ? 'Ajoutez vos propres services ci-dessous.' : 'Add your own services below.'}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const isSel = selected.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                className={`px-3 py-2 rounded-full border text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:border-muted-foreground/40'
                }`}
              >
                {isSel && <Check className="h-3 w-3" />}
                {fr ? s.label.fr : s.label.en}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-semibold">
          {fr ? 'Ajouter un service qui n’est pas listé' : 'Add a service not listed'}
        </Label>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder={fr ? 'Nom du service' : 'Service name'}
            className="h-11"
          />
          <Button type="button" variant="outline" onClick={addCustom} className="h-11 gap-1">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {custom.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {custom.map((c, i) => (
              <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                {c}
                <button type="button" onClick={() => removeCustom(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} className="h-12 gap-1">
          <ArrowLeft className="h-4 w-4" /> {fr ? 'Retour' : 'Back'}
        </Button>
        <div className="flex-1" />
        <Button onClick={onNext} disabled={!hasAny} className="h-12 gap-2 font-bold">
          {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ------------- Step 3: Details -------------

function DetailsStep({
  type, fr, cfg, persist, onBack, onNext,
}: {
  type: WorkspaceTypeDef; fr: boolean; cfg: StoredConfig;
  persist: (p: Partial<StoredConfig>) => void; onBack: () => void; onNext: () => void;
}) {
  const [nameMode, setNameMode] = useState<'business' | 'personal'>(cfg.name_mode ?? 'business');
  const [name, setName] = useState(cfg.name ?? '');
  const [city, setCity] = useState(cfg.city ?? '');
  const [serviceMode, setServiceMode] = useState<string | null>(cfg.service_mode ?? null);

  const submit = () => {
    if (name.trim().length < 2) {
      toast.error(fr ? 'Entrez un nom' : 'Enter a name');
      return;
    }
    if (type.serviceModes.length > 0 && !serviceMode) {
      toast.error(fr ? 'Choisissez où vous fournissez vos services' : 'Choose where you provide your services');
      return;
    }
    if (type.needsLocation && city.trim().length < 2) {
      toast.error(fr ? 'Entrez une ville ou zone' : 'Enter a city or area');
      return;
    }
    persist({
      name: name.trim(),
      city: city.trim(),
      name_mode: nameMode,
      service_mode: serviceMode,
    });
    onNext();
  };

  const nameLabel = fr ? type.nameFieldLabel.fr : type.nameFieldLabel.en;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">
          {fr ? 'Vos informations' : 'Your details'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr ? 'Quelques infos essentielles pour créer votre espace.' : 'A few essentials to create your space.'}
        </p>
      </div>

      {type.offersPersonalNameMode && (
        <div className="grid grid-cols-2 gap-2">
          {(['business', 'personal'] as const).map((m) => {
            const active = nameMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setNameMode(m)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  active ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/40'
                }`}
              >
                <p className="text-xs font-semibold">
                  {m === 'business'
                    ? (fr ? 'Nom professionnel' : 'Business name')
                    : (fr ? 'Sous mon propre nom' : 'Under my own name')}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {m === 'business'
                    ? (fr ? 'Marque, salon ou entreprise' : 'Brand, salon or company')
                    : (fr ? 'Je travaille en indépendant' : 'I work independently')}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-semibold">{nameLabel}</Label>
        <Input
          id="name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={fr ? 'Ex. Belle & Chic' : 'e.g. Belle & Chic'}
          className="h-12 text-base" autoFocus
        />
      </div>

      {type.needsLocation && (
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-semibold">
            {fr ? 'Ville ou zone de service' : 'City or service area'}
          </Label>
          <Input
            id="city" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder={fr ? 'Ex. Abidjan, Cocody' : 'e.g. Abidjan, Cocody'}
            className="h-12 text-base"
          />
        </div>
      )}

      {type.serviceModes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            {fr ? 'Où fournissez-vous vos services ?' : 'Where do you provide your services?'}
          </Label>
          <div className="grid gap-2">
            {type.serviceModes.map((m) => {
              const active = serviceMode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setServiceMode(m.key)}
                  className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 ${
                    active ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full border-2 grid place-items-center ${active ? 'border-primary' : 'border-muted'}`}>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm font-medium">{fr ? m.label.fr : m.label.en}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} className="h-12 gap-1">
          <ArrowLeft className="h-4 w-4" /> {fr ? 'Retour' : 'Back'}
        </Button>
        <div className="flex-1" />
        <Button onClick={submit} className="h-12 gap-2 font-bold">
          {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ------------- Step 4: Review -------------

function ReviewStep({
  type, fr, cfg, user, onBack, onSubmit,
}: {
  type: WorkspaceTypeDef; fr: boolean; cfg: StoredConfig; user: unknown;
  onBack: () => void; onSubmit: () => void;
}) {
  const specialtyRows = flattenSpecialties(type);
  const specialtyLabels = (cfg.specialties ?? [])
    .map((k) => specialtyRows.find((r) => r.key === k))
    .filter(Boolean)
    .map((r) => fr ? r!.label.fr : r!.label.en);

  const serviceMap = new Map(
    type.groups.flatMap((g) => g.suggestedServices.map((s) => [`${g.key}:${s.key}`, s.label])),
  );
  const serviceLabels = [
    ...(cfg.starter_services ?? []).map((k) => {
      const l = serviceMap.get(k); return l ? (fr ? l.fr : l.en) : k;
    }),
    ...(cfg.custom_services ?? []),
  ];

  const serviceModeLabel = type.serviceModes.find((m) => m.key === cfg.service_mode);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1 py-2 border-b last:border-b-0">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <div className="text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">
          {fr ? 'Prêt ?' : 'Ready?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr ? 'Vérifiez et créez votre espace.' : 'Review and create your space.'}
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <Row label={fr ? 'Catégorie' : 'Category'} value={fr ? type.label.fr : type.label.en} />
        <Row
          label={fr ? 'Spécialités' : 'Specialties'}
          value={
            <div className="flex flex-wrap gap-1.5">
              {specialtyLabels.map((l) => (
                <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-xs">{l}</span>
              ))}
              {cfg.custom_profession && (
                <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs">
                  {cfg.custom_profession} · {fr ? 'à valider' : 'pending review'}
                </span>
              )}
            </div>
          }
        />
        <Row
          label={fr ? 'Services de départ' : 'Starter services'}
          value={
            <div className="flex flex-wrap gap-1.5">
              {serviceLabels.map((l) => (
                <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-xs">{l}</span>
              ))}
            </div>
          }
        />
        <Row
          label={fr ? 'Nom' : 'Name'}
          value={<span className="font-semibold">{cfg.name}</span>}
        />
        {type.needsLocation && (
          <Row label={fr ? 'Zone' : 'Area'} value={cfg.city} />
        )}
        {serviceModeLabel && (
          <Row
            label={fr ? 'Où' : 'Where'}
            value={fr ? serviceModeLabel.label.fr : serviceModeLabel.label.en}
          />
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} className="h-12 gap-1">
          <ArrowLeft className="h-4 w-4" /> {fr ? 'Retour' : 'Back'}
        </Button>
        <div className="flex-1" />
        <Button onClick={onSubmit} className="h-12 gap-2 font-bold">
          {user
            ? (fr ? 'Créer mon espace' : 'Create my space')
            : (fr ? 'Continuer' : 'Continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
