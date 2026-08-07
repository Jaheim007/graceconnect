import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { getGoalsForType } from '@/lib/siteviral/goals';
import { activateFeature } from '@/lib/siteviral/activation';
import { SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Loader2, Zap, ArrowLeft } from 'lucide-react';

/**
 * Step 2 of new-user onboarding: pick what you want to do first.
 * On confirm: activate the union of features from selected goals, then
 * redirect to the primary goal's first-action route.
 */
export default function OnboardingGoalsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { type, typeMeta, features: existingFeatures } = useOrgFeatures();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const activeType: SiteviralType | null =
    (params.get('type') as SiteviralType) || type || 'digital_products';
  const goals = useMemo(() => getGoalsForType(activeType), [activeType]);
  const meta = SITEVIRAL_TYPES[activeType];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    if (!currentOrg) {
      toast.error(isFr ? 'Aucune organisation' : 'No organization');
      return;
    }
    const picked = goals.filter((g) => selected.has(g.id));
    if (picked.length === 0) {
      // No selection → go to Add More Functionalities so user can browse
      navigate('/admin');
      return;
    }
    setSaving(true);
    try {
      // Union of features across all picked goals, minus what's already on.
      const toActivate = new Set<SiteviralFeatureKey>();
      picked.forEach((g) => g.features.forEach((f) => {
        if (!existingFeatures.has(f)) toActivate.add(f);
      }));
      for (const f of toActivate) {
        await activateFeature(currentOrg.id, f, 'onboarding');
      }
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'Fonctionnalités activées' : 'Features activated');
      navigate(picked[0].firstAction);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    navigate('/admin');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate('/onboarding/type')}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isFr ? 'Changer de type' : 'Change type'}
      </button>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          {meta.emoji} {isFr ? meta.labelFr : meta.labelEn}
        </div>
        <h1 className="text-2xl font-bold">
          {isFr ? 'Que voulez-vous faire en premier ?' : 'What do you want to do first?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? 'Choisissez une ou plusieurs actions. Nous activerons les fonctionnalités nécessaires et vous emmènerons directement à la bonne page.'
            : 'Pick one or more actions. We\'ll turn on the needed features and take you straight to the right page.'}
        </p>
      </header>

      {goals.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {isFr
            ? 'Aucun objectif prédéfini pour ce type. Vous pouvez configurer vos fonctionnalités manuellement.'
            : 'No preset goals for this type. You can configure features manually.'}
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => {
            const isSel = selected.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isSel ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-muted-foreground/30'
                }`}
              >
                <div className="text-2xl leading-none">{g.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{isFr ? g.labelFr : g.labelEn}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {g.features.length} {isFr ? 'fonctionnalités' : 'features'}
                    </Badge>
                  </div>
                </div>
                {isSel && <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={handleSkip} disabled={saving}>
          {isFr ? 'Configurer plus tard' : 'Configure later'}
        </Button>
        <Button onClick={handleContinue} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {selected.size === 0
            ? (isFr ? 'Voir toutes les fonctionnalités' : 'See all features')
            : (isFr ? 'Continuer' : 'Continue')}
        </Button>
      </div>
    </div>
  );
}
