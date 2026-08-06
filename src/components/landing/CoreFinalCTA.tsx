import { Link } from 'react-router-dom';
import { Rocket, Compass, Church, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Restored final CTA — platform creation first, discovery second,
 * church platform third. No service-marketplace path.
 */
export function CoreFinalCTA() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const paths = [
    {
      icon: Rocket,
      titleFr: 'Créer ma plateforme', titleEn: 'Create my platform',
      textFr: 'Créateur, organisation, ONG, communauté ou église.',
      textEn: 'Creator, organization, NGO, community or church.',
      ctaFr: 'Commencer', ctaEn: 'Get started',
      to: '/create-org',
      primary: true,
    },
    {
      icon: Compass,
      titleFr: 'Découvrir des produits', titleEn: 'Discover products',
      textFr: 'Livres, formations et ressources digitales.',
      textEn: 'Books, formations and digital resources.',
      ctaFr: 'Explorer', ctaEn: 'Explore',
      to: '/discover',
    },
    {
      icon: Church,
      titleFr: 'SiteViral pour les églises', titleEn: 'SiteViral for churches',
      textFr: 'Prédications, ressources, offrandes et événements.',
      textEn: 'Sermons, resources, offerings and events.',
      ctaFr: 'Découvrir', ctaEn: 'Learn more',
      to: '/churches',
    },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="grid gap-4 sm:grid-cols-3">
        {paths.map((p, i) => (
          <Reveal key={p.titleEn} delay={i * 0.05}>
            <div className="flex h-full flex-col rounded-2xl border bg-card p-6">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <div className="text-base font-bold">{fr ? p.titleFr : p.titleEn}</div>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{fr ? p.textFr : p.textEn}</p>
              <Button
                asChild
                variant={p.primary ? 'default' : 'outline'}
                className="mt-5 h-11 rounded-xl font-semibold gap-1.5"
              >
                <Link to={p.to}>
                  {fr ? p.ctaFr : p.ctaEn} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
