import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { toast } from 'sonner';
import { ArrowRight, Check } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StartShell } from '@/components/start/StartShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { WORKSPACE_TYPES, getWorkspaceType } from '@/lib/siteviral/serviceTaxonomy';

const CONFIG_KEY = 'sv_start_config';

export default function StartOfferingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const preselect = params.get('activity');
  const [picked, setPicked] = useState<string | null>(() => {
    const t = getWorkspaceType(preselect);
    return t ? t.key : null;
  });

  useEffect(() => {
    const t = getWorkspaceType(preselect);
    if (t) setPicked(t.key);
  }, [preselect]);

  const options = useMemo(() => WORKSPACE_TYPES, []);

  const submit = () => {
    if (!picked) {
      toast.error(fr ? 'Choisissez une catégorie' : 'Pick one category');
      return;
    }
    const type = getWorkspaceType(picked)!;
    try {
      const existing = JSON.parse(sessionStorage.getItem(CONFIG_KEY) || '{}');
      sessionStorage.setItem(CONFIG_KEY, JSON.stringify({
        ...existing,
        workspace_type: type.key,
        activity: type.key, // legacy field kept for downstream compat
        siteviral_type: type.siteviral_type,
      }));
    } catch { /* ignore */ }

    if (type.key === 'digital') {
      navigate('/create-org');
      return;
    }
    navigate(`/start/details?activity=${type.key}`);
  };

  return (
    <StartShell step={1} onBack={() => navigate('/')}>
      <SEOHead
        title={fr ? 'Que proposez-vous ? — Siteviral' : 'What do you offer? — Siteviral'}
        description={fr ? 'Choisissez votre catégorie en un clic.' : 'Pick your category in one tap.'}
        noindex
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Que proposez-vous ?' : 'What do you offer?'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr
              ? 'Une seule catégorie pour commencer. Vous pourrez en ajouter une autre plus tard.'
              : 'One category to start. You can add another later.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {options.map((o) => {
            const isSel = picked === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setPicked(o.key)}
                className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-start justify-between text-left transition-all overflow-hidden ${
                  isSel ? 'border-primary ring-2 ring-primary/30 shadow-lg' : 'hover:border-muted-foreground/40'
                }`}
              >
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${o.gradient}`} />
                <div className="relative text-2xl">{o.emoji}</div>
                <div className="relative text-[13px] font-bold leading-tight">
                  {fr ? o.label.fr : o.label.en}
                </div>
                {isSel && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          {fr
            ? 'Vous créez un espace d’église ? Utilisez la page dédiée « Créer un espace d’église ».'
            : 'Creating a church space? Use the dedicated “Create a church space” page.'}
        </p>

        <Button onClick={submit} disabled={!picked} className="w-full h-12 gap-2 text-base font-bold">
          {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </StartShell>
  );
}
