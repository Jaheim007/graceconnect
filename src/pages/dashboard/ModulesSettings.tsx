import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, ALL_MODULE_IDS, ModuleId } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function ModulesSettings() {
  const { modules, toggle, isLoading, isSaving } = useEnabledModules();
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
          ? 'Active uniquement les modules dont tu as besoin. Tu peux les activer ou désactiver à tout moment.'
          : 'Turn on only the modules you need. You can enable or disable them any time.'}
      </p>

      <div className="mt-8 divide-y rounded-2xl border bg-card">
        {ALL_MODULE_IDS.map((id) => {
          const m = MODULES[id];
          const on = modules.includes(id);
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
  );
}
