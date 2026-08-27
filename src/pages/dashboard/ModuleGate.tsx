import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, ModuleId } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { ComponentType, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  moduleId: ModuleId;
  component: ComponentType;
}

/**
 * Gate that renders the wrapped module page only if the user has that module
 * enabled. Otherwise shows a locked state with a one-click enable action.
 */
export function ModuleGate({ moduleId, component: Component }: Props) {
  const { modules, toggle, isLoading, isSaving } = useEnabledModules();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const m = MODULES[moduleId];

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!modules.includes(moduleId)) {
    return (
      <div className="container max-w-md px-4 py-16 text-center">
        <div className={`h-16 w-16 rounded-2xl grid place-items-center mx-auto mb-5 ${m.color}`}>
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          {fr ? `Module « ${m.labelFr} » désactivé` : `Module “${m.labelEn}” is off`}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {fr ? m.descFr : m.descEn}
        </p>
        <Button
          className="mt-6"
          disabled={isSaving}
          onClick={() => toggle(moduleId)}
        >
          {fr ? 'Activer ce module' : 'Turn on this module'}
        </Button>
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/settings">{fr ? 'Voir tous les modules' : 'See all modules'}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="container max-w-4xl px-4 py-8"><Skeleton className="h-40 w-full rounded-2xl" /></div>}>
      <Component />
    </Suspense>
  );
}
