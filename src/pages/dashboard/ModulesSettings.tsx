import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, OPTIONAL_MODULE_IDS, ModuleId } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ShieldCheck, CreditCard, Star, MessageSquare, Receipt } from 'lucide-react';

/**
 * Settings → Modules.
 *
 * Shows ONLY toggleable add-on modules (booking, digital products, AI, etc.).
 * Baked-in functionalities of every service (KYC, payments, reviews on the
 * provider, comments on products, orders/quotes) are listed for reference at
 * the top but never toggleable — they come with the service.
 */
export default function ModulesSettings() {
  const { optionalModules, toggle, isLoading, isSaving } = useEnabledModules();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const handleToggle = async (id: ModuleId, on: boolean) => {
    try {
      await toggle(id);
      toast.success(
        on
          ? (fr ? `${MODULES[id].labelFr} désactivé` : `${MODULES[id].labelEn} turned off`)
          : (fr ? `${MODULES[id].labelFr} activé` : `${MODULES[id].labelEn} turned on`)
      );
    } catch (e) {
      toast.error(fr ? 'Erreur, réessaie' : 'Failed, try again');
    }
  };

  const bakedIn = [
    { icon: ShieldCheck, labelFr: 'Vérification KYC', labelEn: 'KYC verification',
      descFr: 'Obligatoire pour tout prestataire.', descEn: 'Required for every provider.' },
    { icon: CreditCard, labelFr: 'Paiements', labelEn: 'Payments',
      descFr: 'Encaissement intégré à ton service.', descEn: 'Built into your service.' },
    { icon: Star, labelFr: 'Avis clients', labelEn: 'Client reviews',
      descFr: 'Les clients notent ton service.', descEn: 'Clients rate your service.' },
    { icon: MessageSquare, labelFr: 'Commentaires', labelEn: 'Comments',
      descFr: 'Sur tes produits et publications.', descEn: 'On your products and posts.' },
    { icon: Receipt, labelFr: 'Commandes & devis', labelEn: 'Orders & quotes',
      descFr: 'Suivi de tes ventes.', descEn: 'Tracks your sales.' },
  ];

  return (
    <div className="container max-w-3xl px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        {fr ? 'Mes modules' : 'My modules'}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-xl">
        {fr
          ? 'Active ou désactive les modules complémentaires à ton service (vente de produits, contenus IA, événements, dons…).'
          : 'Turn add-on modules on or off (selling products, AI content, events, giving…).'}
      </p>

      {/* Baked-in — for reference only */}
      <div className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Inclus avec ton service' : 'Included with your service'}
        </div>
        <div className="divide-y rounded-2xl border bg-muted/20">
          {bakedIn.map((m) => (
            <div key={m.labelEn} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fr ? m.labelFr : m.labelEn}</div>
                <div className="text-xs text-muted-foreground">{fr ? m.descFr : m.descEn}</div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {fr ? 'Inclus' : 'Included'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional — toggleable */}
      <div className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Modules à activer' : 'Modules to activate'}
        </div>
        <div className="divide-y rounded-2xl border bg-card">
          {OPTIONAL_MODULE_IDS.map((id) => {
            const m = MODULES[id];
            const on = optionalModules.includes(id);
            return (
              <div key={id} className="flex items-center gap-4 p-4">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{fr ? m.labelFr : m.labelEn}</div>
                  <div className="text-xs text-muted-foreground">{fr ? m.descFr : m.descEn}</div>
                </div>
                <Switch
                  checked={on}
                  disabled={isLoading || isSaving}
                  onCheckedChange={() => handleToggle(id, on)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
