import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { FEATURE_META, SITEVIRAL_FEATURE_KEYS } from '@/lib/siteviral/config';
import { FEATURE_ROUTES } from '@/lib/siteviral/featureRoutes';
import { activateFeature, deactivateFeature } from '@/lib/siteviral/activation';
import type { SiteviralFeatureKey } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { Sparkles, Check, Plus, Loader2, ArrowRight, Star } from 'lucide-react';

export default function AdminFeaturesPage() {
  const { currentOrg } = useOrg();
  const { type, typeMeta, features } = useOrgFeatures();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const recommended = useMemo(
    () => new Set(typeMeta?.defaultFeatures ?? []),
    [typeMeta]
  );

  const ordered = useMemo(() => {
    return [...SITEVIRAL_FEATURE_KEYS].sort((a, b) => {
      const av = (features.has(a) ? 0 : recommended.has(a) ? 1 : 2);
      const bv = (features.has(b) ? 0 : recommended.has(b) ? 1 : 2);
      return av - bv;
    });
  }, [features, recommended]);

  async function activate(key: SiteviralFeatureKey) {
    if (!currentOrg) return;
    setPending((p) => new Set(p).add(key));
    try {
      await activateFeature(currentOrg.id, key, 'user');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'Fonctionnalité activée' : 'Feature activated');
      // Redirect to setup route straight after activation.
      const route = FEATURE_ROUTES[key];
      if (route) navigate(route.setupRoute);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setPending((p) => { const n = new Set(p); n.delete(key); return n; });
    }
  }

  async function deactivate(key: SiteviralFeatureKey) {
    if (!currentOrg) return;
    setPending((p) => new Set(p).add(key));
    try {
      await deactivateFeature(currentOrg.id, key, 'user');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'Fonctionnalité désactivée' : 'Feature deactivated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setPending((p) => { const n = new Set(p); n.delete(key); return n; });
    }
  }

  if (!currentOrg) return null;

  const activeCount = features.size;
  const recommendedInactive = ordered.filter((k) => !features.has(k) && recommended.has(k)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {isFr ? 'Fonctionnalités SiteViral' : 'SiteViral features'}
        </div>
        <h1 className="text-2xl font-bold">
          {isFr ? 'Ajoutez plus de fonctionnalités' : 'Add more functionalities'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? 'Activez, configurez et étendez ce que votre espace SiteViral peut faire. Vous pouvez toujours changer votre type SiteViral et activer d\'autres fonctionnalités plus tard.'
            : 'Activate, set up and extend what your SiteViral workspace can do. You can always change your SiteViral type and activate more features later.'}
        </p>
        {typeMeta && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">
              {typeMeta.emoji} {isFr ? typeMeta.labelFr : typeMeta.labelEn}
            </Badge>
            <Badge variant="outline">
              {activeCount} {isFr ? 'active(s)' : 'active'}
            </Badge>
            {recommendedInactive > 0 && (
              <Badge className="gap-1">
                <Star className="h-3 w-3" />
                {recommendedInactive} {isFr ? 'recommandée(s)' : 'recommended'}
              </Badge>
            )}
          </div>
        )}
      </header>

      <div className="space-y-2.5">
        {ordered.map((key) => {
          const meta = FEATURE_META[key];
          const route = FEATURE_ROUTES[key];
          const on = features.has(key);
          const isRecommended = recommended.has(key);
          const isPending = pending.has(key);
          const Icon = (Icons as any)[meta.icon] ?? Icons.Sparkles;
          // KYC + affiliation are platform-mandatory: cannot be turned off.
          const locked = key === 'kyc' || key === 'affiliation';

          return (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-start"
            >
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">
                    {isFr ? meta.labelFr : meta.labelEn}
                  </span>
                  {on && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Check className="h-3 w-3" />
                      {isFr ? 'Activée' : 'Active'}
                    </Badge>
                  )}
                  {isRecommended && (
                    <Badge className="gap-1 text-[10px]" variant={on ? 'outline' : 'default'}>
                      <Star className="h-3 w-3" />
                      {isFr ? 'Recommandée' : 'Recommended'}
                    </Badge>
                  )}
                  {locked && (
                    <Badge variant="outline" className="text-[10px]">
                      {isFr ? 'Obligatoire' : 'Required'}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isFr ? meta.descFr : meta.descEn}
                </p>
                {on && route && (
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    {isFr ? 'Route de configuration' : 'Setup route'}:{' '}
                    <code className="rounded bg-muted px-1 py-0.5">{route.setupRoute}</code>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
                {on ? (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(route.setupRoute)}
                      className="gap-1"
                    >
                      {isFr ? route.setupVerbFr : route.setupVerbEn}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    {!locked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => deactivate(key)}
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? 'Désactiver' : 'Disable')}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => activate(key)}
                    className="gap-1"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isFr ? 'Activer' : 'Activate'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        {isFr
          ? 'Astuce : vous pouvez changer votre type SiteViral à tout moment depuis les paramètres.'
          : 'Tip: you can change your SiteViral type any time from settings.'}
      </p>
    </div>
  );
}
