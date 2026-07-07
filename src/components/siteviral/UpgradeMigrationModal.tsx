import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { AVAILABLE_SITEVIRAL_TYPES, SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import { confirmSiteviralType } from '@/lib/siteviral/activation';
import type { SiteviralType } from '@/types/database';
import { toast } from 'sonner';
import { Check, Loader2, Sparkles } from 'lucide-react';

/**
 * Blocking modal shown once for existing orgs that haven't confirmed
 * their SiteViral type after the July 2026 modular upgrade.
 */
export function UpgradeMigrationModal() {
  const { currentOrg } = useOrg();
  const { needsMigration, isLoading } = useOrgFeatures();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const [selected, setSelected] = useState<SiteviralType>(
    (currentOrg?.siteviral_type as SiteviralType) || 'digital_products'
  );
  const [saving, setSaving] = useState(false);

  const open = !isLoading && !!currentOrg && needsMigration;

  async function handleConfirm() {
    if (!currentOrg) return;
    setSaving(true);
    try {
      await confirmSiteviralType(currentOrg.id, selected, [], 'migration');
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(isFr ? 'SiteViral mis à jour !' : 'SiteViral updated!');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { /* blocking */ }}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            {isFr ? 'Nouvelle version de SiteViral' : 'New version of SiteViral'}
          </div>
          <DialogTitle>
            {isFr ? 'Bienvenue sur la nouvelle version de SiteViral' : 'Welcome to the new version of SiteViral'}
          </DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            {isFr
              ? 'Votre compte, vos produits, vos ventes et vos informations restent disponibles. Pour mieux organiser votre espace, veuillez choisir le type de page SiteViral qui correspond à votre activité. Vous pourrez activer d\'autres fonctionnalités plus tard.'
              : 'Your account, products, sales, and information are still available. To better organize your workspace, please choose the SiteViral page type that best matches your activity. You will be able to activate more functionalities later.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto py-2">
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

        <div className="flex justify-end pt-2">
          <Button onClick={handleConfirm} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFr ? 'Confirmer' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
