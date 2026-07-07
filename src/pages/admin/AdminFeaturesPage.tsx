import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { FEATURE_META, SITEVIRAL_FEATURE_KEYS, SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import { activateFeature, deactivateFeature } from '@/lib/siteviral/activation';
import type { SiteviralFeatureKey } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { Sparkles, Check, Plus, Loader2 } from 'lucide-react';

export default function AdminFeaturesPage() {
  const { currentOrg } = useOrg();
  const { type, typeMeta, features } = useOrgFeatures();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const recommended = useMemo(
    () => new Set(typeMeta?.defaultFeatures ?? []),
    [typeMeta]
  );

  const ordered = useMemo(() => {
    // Active first, then recommended, then rest.
    return [...SITEVIRAL_FEATURE_KEYS].sort((a, b) => {
      const av = (features.has(a) ? 0 : recommended.has(a) ? 1 : 2);
      const bv = (features.has(b) ? 0 : recommended.has(b) ? 1 : 2);
      return av - bv;
    });
  }, [features, recommended]);

  async function toggle(key: SiteviralFeatureKey, on: boolean) {
    if (!currentOrg) return;
    setPending((p) => new Set(p).add(key));
    try {
      if (on) await activateFeature(currentOrg.id, key, 'user');
      else await deactivateFeature(currentOrg.id, key, 'user');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(
        on
          ? isFr ? 'Fonctionnalité activée' : 'Feature activated'
          : isFr ? 'Fonctionnalité désactivée' : 'Feature deactivated'
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setPending((p) => { const n = new Set(p); n.delete(key); return n; });
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {isFr ? 'Ajouter plus de fonctionnalités' : 'Add More Functionalities'}
        </div>
        <h1 className="text-2xl font-bold">
          {isFr ? 'Activez les outils dont vous avez besoin' : 'Activate the tools you need'}
        </h1>
        {typeMeta && (
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Type actuel' : 'Current type'}:{' '}
            <span className="font-medium text-foreground">
              {typeMeta.emoji} {isFr ? typeMeta.labelFr : typeMeta.labelEn}
            </span>
          </p>
        )}
      </header>

      <div className="space-y-2">
        {ordered.map((key) => {
          const meta = FEATURE_META[key];
          const on = features.has(key);
          const isRecommended = recommended.has(key);
          const isPending = pending.has(key);
          const Icon = (Icons as any)[meta.icon] ?? Icons.Sparkles;

          return (
            <div
              key={key}
              className="flex items-start gap-3 rounded-2xl border bg-card p-4"
            >
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {isFr ? meta.labelFr : meta.labelEn}
                  </span>
                  {on && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Check className="h-3 w-3" />
                      {isFr ? 'Activé' : 'Active'}
                    </Badge>
                  )}
                  {!on && isRecommended && (
                    <Badge className="text-[10px]">
                      {isFr ? 'Recommandé' : 'Recommended'}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isFr ? meta.descFr : meta.descEn}
                </p>
              </div>
              <div className="shrink-0">
                {on ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || key === 'kyc' || key === 'affiliation'}
                    onClick={() => toggle(key, false)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? 'Désactiver' : 'Disable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => toggle(key, true)}
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
    </div>
  );
}
