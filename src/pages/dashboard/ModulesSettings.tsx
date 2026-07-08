import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, MANDATORY_MODULES, OPTIONAL_MODULE_IDS, ModuleId } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

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

  return (
    <div className="container max-w-3xl px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        {fr ? 'Mes modules' : 'My modules'}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-xl">
        {fr
          ? 'Ton compte inclut déjà tout l’essentiel. Active en plus les modules d’autres familles si tu veux étendre ce que tu proposes.'
          : 'Your account already includes all the essentials. Turn on extra modules from other families to expand what you offer.'}
      </p>

      {/* Essentials — always on */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {fr ? 'Essentiels (toujours actifs)' : 'Essentials (always on)'}
        </div>
        <div className="divide-y rounded-2xl border bg-muted/30">
          {MANDATORY_MODULES.map((id) => {
            const m = MODULES[id];
            return (
              <div key={id} className="flex items-center gap-4 p-4">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${m.color}`}>
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
            );
          })}
        </div>
      </div>

      {/* Optional — toggleable */}
      <div className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Modules optionnels' : 'Optional modules'}
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
