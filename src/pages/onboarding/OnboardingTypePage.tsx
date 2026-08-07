import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { AVAILABLE_SITEVIRAL_TYPES, SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import { confirmSiteviralType } from '@/lib/siteviral/activation';
import type { SiteviralType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Loader2, Zap } from 'lucide-react';

/**
 * New-org onboarding: pick a SiteViral type.
 * Only shown for freshly created orgs; existing orgs use the migration modal.
 */
export default function OnboardingTypePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrg, setCurrentOrg, userOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const orgId = params.get('org') || currentOrg?.id;
  const [selected, setSelected] = useState<SiteviralType>('digital_products');
  const [saving, setSaving] = useState(false);

  // Focus the requested org if a param was passed
  useEffect(() => {
    const target = params.get('org');
    if (target && target !== currentOrg?.id) {
      const match = userOrgs.find((o) => o.id === target);
      if (match) setCurrentOrg(match);
    }
  }, [params, currentOrg?.id, userOrgs, setCurrentOrg]);

  async function handleConfirm() {
    if (!orgId) {
      toast.error(isFr ? 'Aucune organisation sélectionnée' : 'No organization selected');
      return;
    }
    setSaving(true);
    try {
      await confirmSiteviralType(orgId, selected, [], 'onboarding');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      navigate(`/onboarding/goals?type=${selected}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleLater() {
    // "Plus tard" must not create confusion: default to digital_products
    // (safe legacy behavior), then send them to Add More Functionalities.
    if (!orgId) { navigate('/admin'); return; }
    setSaving(true);
    try {
      await confirmSiteviralType(orgId, 'digital_products', [], 'onboarding');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      navigate('/admin');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  const meta = SITEVIRAL_TYPES[selected];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          {isFr ? 'Bienvenue sur SiteViral' : 'Welcome to SiteViral'}
        </div>
        <h1 className="text-2xl font-bold">
          {isFr ? 'Quel type de SiteViral voulez-vous créer ?' : 'What kind of SiteViral do you want to create?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? 'Choisissez votre activité principale. Nous activerons les fonctionnalités adaptées. Vous pourrez en ajouter d\'autres à tout moment.'
            : 'Pick your main activity. We\'ll enable matching features. You can add more anytime.'}
        </p>
      </header>

      <div className="space-y-2">
        {AVAILABLE_SITEVIRAL_TYPES.map((t) => {
          const isSel = selected === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelected(t.key)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                isSel ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-muted-foreground/30'
              }`}
            >
              <div className="text-3xl leading-none">{t.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{isFr ? t.labelFr : t.labelEn}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t.defaultFeatures.length} {isFr ? 'fonctionnalités' : 'features'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{isFr ? t.descFr : t.descEn}</p>
              </div>
              {isSel && <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
        {isFr
          ? `Type sélectionné : ${meta.emoji} ${meta.labelFr}. Vous pourrez modifier ce type et vos fonctionnalités depuis les paramètres.`
          : `Selected: ${meta.emoji} ${meta.labelEn}. You can change this type and features anytime in settings.`}
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleLater} disabled={saving}>
            {isFr ? 'Plus tard' : 'Later'}
          </Button>
          <Button onClick={handleConfirm} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFr ? 'Créer mon SiteViral' : 'Create my SiteViral'}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isFr
            ? 'Vous pourrez ajouter plus de fonctionnalités à cet espace plus tard.'
            : 'You can add more features to this workspace later.'}
        </p>
      </div>
    </div>
  );
}
