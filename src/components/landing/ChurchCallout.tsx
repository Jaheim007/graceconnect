import { Link } from 'react-router-dom';
import { Church, ArrowRight, Users, HandCoins, Radio, CalendarDays, Bell, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Dedicated homepage callout for SiteViral for Churches.
 * Church remains separate from marketplace categories.
 */
export function ChurchCallout() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const chips = fr ? [
    { icon: Users, label: 'Membres' },
    { icon: HandCoins, label: 'Dons' },
    { icon: Radio, label: 'Sermons' },
    { icon: CalendarDays, label: 'Événements' },
    { icon: Bell, label: 'Communication' },
    { icon: Settings2, label: 'Paiements' },
  ] : [
    { icon: Users, label: 'Members' },
    { icon: HandCoins, label: 'Giving' },
    { icon: Radio, label: 'Sermons' },
    { icon: CalendarDays, label: 'Events' },
    { icon: Bell, label: 'Communication' },
    { icon: Settings2, label: 'Payments' },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-3xl bg-sidebar text-sidebar-foreground border border-white/10 p-8 sm:p-12">
        <div className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 15%, hsl(var(--accent)/0.28), transparent 55%), radial-gradient(circle at 10% 90%, hsl(var(--primary)/0.28), transparent 55%)',
          }}
        />
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-5">
              <Church className="h-3.5 w-3.5 text-accent" />
              {fr ? 'SiteViral pour les églises' : 'SiteViral for churches'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1]">
              {fr ? 'Un espace complet pour votre église.' : 'One complete space for your church.'}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-sidebar-foreground/70 max-w-xl leading-relaxed">
              {fr
                ? 'Gérez les membres, les dons, les sermons, les événements, les rendez-vous, la communication et les paiements depuis un seul espace église.'
                : 'Manage members, giving, sermons, events, appointments, communication and payments from one church space.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {chips.map(c => (
                <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-xs font-semibold">
                  <c.icon className="h-3.5 w-3.5 text-accent" /> {c.label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 px-5 rounded-xl font-semibold gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/churches">
                  {fr ? 'Découvrir SiteViral pour les églises' : 'Explore SiteViral for churches'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-5 rounded-xl font-semibold border-white/25 bg-white/5 text-sidebar-foreground hover:bg-white/10">
                <Link to="/church/pro/onboarding">
                  {fr ? 'Créer un espace église' : 'Create a church space'}
                </Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative aspect-square max-w-sm mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xs" />
              <div className="absolute inset-6 grid grid-cols-2 gap-3">
                {chips.map((c, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 flex flex-col justify-between">
                    <c.icon className="h-5 w-5 text-accent" />
                    <div className="text-sm font-bold">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
