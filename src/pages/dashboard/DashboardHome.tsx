import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, ALL_MODULE_IDS } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { ArrowRight, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { modules, accountMode, isLoading } = useEnabledModules();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const name = profile?.display_name || user?.email?.split('@')[0] || '';
  const active = modules.map((id) => MODULES[id]).filter(Boolean);
  const inactive = ALL_MODULE_IDS.filter((id) => !modules.includes(id)).map((id) => MODULES[id]);

  return (
    <div className="container max-w-6xl px-4 py-8 space-y-10">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fr ? 'Bienvenue' : 'Welcome'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
          {fr ? `Salut ${name} 👋` : `Hi ${name} 👋`}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          {accountMode === 'client'
            ? fr ? 'Ton espace client. Active des modules pour proposer aussi tes services.'
                 : 'Your client space. Turn on modules to offer services too.'
            : fr ? 'Voici tes modules actifs. Tu peux en activer d’autres à tout moment.'
                 : 'Here are your active modules. Turn more on any time.'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border h-32 bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {fr ? 'Modules actifs' : 'Active modules'}
              </h2>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/admin/settings">
                  <Sliders className="h-3.5 w-3.5" /> {fr ? 'Gérer' : 'Manage'}
                </Link>
              </Button>
            </div>
            {active.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {fr ? 'Aucun module actif pour l’instant.' : 'No modules active yet.'}
                </p>
                <Button asChild>
                  <Link to="/admin/settings">
                    {fr ? 'Activer mes premiers modules' : 'Turn on my first modules'}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((m) => (
                  <Link
                    key={m.id}
                    to={m.route}
                    className="group rounded-2xl border bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition"
                  >
                    <div className={`h-11 w-11 rounded-xl grid place-items-center mb-3 ${m.color}`}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div className="font-bold text-base">{fr ? m.labelFr : m.labelEn}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {fr ? m.descFr : m.descEn}
                    </p>
                    <div className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      {fr ? 'Ouvrir' : 'Open'} <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                {fr ? 'Modules disponibles' : 'Available modules'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactive.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-dashed bg-muted/20 p-4 flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${m.color} opacity-70`}>
                      <m.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{fr ? m.labelFr : m.labelEn}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {fr ? m.descFr : m.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/settings">
                    {fr ? 'Activer un module' : 'Turn on a module'}
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
