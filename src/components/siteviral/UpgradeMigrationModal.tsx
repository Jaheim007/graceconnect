import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { AVAILABLE_SITEVIRAL_TYPES, SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import { confirmSiteviralType } from '@/lib/siteviral/activation';
import { supabase } from '@/integrations/supabase/client';
import type { SiteviralType } from '@/types/database';
import { toast } from 'sonner';
import { Check, Loader2, Zap, ArrowLeft } from 'lucide-react';

/**
 * NON-blocking welcome modal for existing orgs after the July 2026 upgrade.
 *
 * Two clear paths — never force a reset:
 *  - "Garder ma configuration actuelle" → keep detected type + features, just mark confirmed.
 *  - "Personnaliser mon type SiteViral"  → show picker, MERGE (never remove) selected type's defaults.
 *
 * Dismissible: user can close (Escape/backdrop/X). We only mark confirmed when they explicitly choose.
 */
export function UpgradeMigrationModal() {
  const { currentOrg } = useOrg();
  const { needsMigration, isLoading, typeMeta } = useOrgFeatures();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();

  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<'welcome' | 'picker'>('welcome');
  const [selected, setSelected] = useState<SiteviralType>(
    (currentOrg?.siteviral_type as SiteviralType) || 'digital_products'
  );
  const [saving, setSaving] = useState<'keep' | 'customize' | null>(null);

  const open = !isLoading && !!currentOrg && needsMigration && !dismissed;

  async function handleKeep() {
    if (!currentOrg) return;
    setSaving('keep');
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('organizations')
        .update({
          type_confirmed_at: now,
          features_confirmed_at: now,
          // siteviral_type + enabled_features already backfilled — do NOT touch them.
        })
        .eq('id', currentOrg.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'Configuration conservée' : 'Configuration kept');
      setDismissed(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(null);
    }
  }

  async function handleCustomize() {
    if (!currentOrg) return;
    setSaving('customize');
    try {
      // confirmSiteviralType MERGES defaults into existing features — never removes.
      await confirmSiteviralType(currentOrg.id, selected, [], 'migration');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'Type SiteViral mis à jour' : 'SiteViral type updated');
      setDismissed(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setDismissed(true); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
            
            {isFr ? 'Nouvelle version de SiteViral' : 'New version of SiteViral'}
          </div>

          {step === 'welcome' ? (
            <>
              <DialogTitle>
                {isFr ? 'Votre espace SiteViral évolue' : 'Your SiteViral workspace is evolving'}
              </DialogTitle>
              <DialogDescription className="pt-2 leading-relaxed">
                {isFr
                  ? 'Votre compte reste inchangé. Vos produits, ventes, paiements et informations sont conservés. Vous pouvez continuer comme avant, ou personnaliser votre type SiteViral pour activer plus tard de nouvelles fonctionnalités adaptées à votre activité.'
                  : 'Your account is unchanged. Your products, sales, payments and information are preserved. You can continue as before, or customize your SiteViral type to activate more features tailored to your activity later.'}
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>
                {isFr ? 'Choisissez votre type SiteViral' : 'Choose your SiteViral type'}
              </DialogTitle>
              <DialogDescription className="pt-2 leading-relaxed">
                {isFr
                  ? 'Nous ajouterons les fonctionnalités recommandées pour ce type. Aucune fonctionnalité existante ne sera retirée.'
                  : 'We\'ll add the recommended features for this type. No existing feature will be removed.'}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {step === 'welcome' && typeMeta && (
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Configuration actuelle détectée' : 'Current detected setup'}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {typeMeta.emoji} {isFr ? typeMeta.labelFr : typeMeta.labelEn}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {(currentOrg?.enabled_features?.length ?? 0)} {isFr ? 'fonctionnalités actives' : 'active features'}
            </div>
          </div>
        )}

        {step === 'picker' && (
          <div className="max-h-[45vh] space-y-1.5 overflow-y-auto py-1">
            {AVAILABLE_SITEVIRAL_TYPES.map((t) => {
              const isSel = selected === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelected(t.key)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${isSel ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}
                >
                  <div className="text-2xl leading-none">{t.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{isFr ? t.labelFr : t.labelEn}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{isFr ? t.descFr : t.descEn}</div>
                  </div>
                  {isSel && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {step === 'welcome' ? (
            <div className="flex w-full flex-col gap-2">
              <Button onClick={handleKeep} disabled={!!saving} className="w-full gap-2">
                {saving === 'keep' && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFr ? 'Garder ma configuration actuelle' : 'Keep my current setup'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('picker')}
                disabled={!!saving}
                className="w-full"
              >
                {isFr ? 'Personnaliser mon type SiteViral' : 'Customize my SiteViral type'}
              </Button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="mt-1 text-center text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {isFr ? 'Plus tard' : 'Later'}
              </button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                variant="ghost"
                onClick={() => setStep('welcome')}
                disabled={!!saving}
                className="gap-1 sm:mr-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                {isFr ? 'Retour' : 'Back'}
              </Button>
              <Button onClick={handleCustomize} disabled={!!saving} className="gap-2">
                {saving === 'customize' && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFr ? 'Confirmer ce type' : 'Confirm this type'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
