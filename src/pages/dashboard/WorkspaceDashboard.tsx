import { useMemo } from 'react';
import { useNavigate } from '@/lib/router-compat';
import * as Icons from 'lucide-react';
import { ArrowRight, Building2, ExternalLink, Plus, ShieldCheck, Zap } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { FEATURE_META, SITEVIRAL_TYPES, getPrimaryFeaturesForType } from '@/lib/siteviral/config';
import { FEATURE_ROUTES } from '@/lib/siteviral/featureRoutes';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

const PLATFORM_ESSENTIALS: SiteviralFeatureKey[] = ['kyc', 'payment', 'affiliation'];

// Fallback global ordering for "additional" tools when the type has no opinion.
const FEATURE_ORDER: SiteviralFeatureKey[] = [
  'appointment',
  'order_generator',
  'digital_products',
  'donation_gifts',
  'events',
  'ai_book_creation',
  'ai_formation_creation',
  'product_comments',
  'location',
  'reviews',
];


function workspaceFocus(type: SiteviralType | null, fr: boolean) {
  switch (type) {
    case 'beauty':
      return fr
        ? 'Rendez-vous, services, paiements, localisation et avis pour ce salon.'
        : 'Appointments, services, payments, location and reviews for this salon.';
    case 'church':
      return fr
        ? 'Dons, offrandes, événements, enseignements digitaux, paiements et localisation.'
        : 'Donations, offerings, events, digital teachings, payments and location.';
    case 'artisans_home_services':
      return fr
        ? 'Demandes de service, commandes, paiements, avis et zone d’intervention.'
        : 'Service requests, orders, payments, reviews and service area.';
    case 'tutors_home_teachers':
      return fr
        ? 'Cours, supports digitaux, avis, localisation et revenus de cet espace.'
        : 'Lessons, digital materials, reviews, location and earnings for this workspace.';
    case 'sport':
    case 'instrumentists':
      return fr
        ? 'Réservations, événements, paiements, localisation et avis.'
        : 'Bookings, events, payments, location and reviews.';
    case 'influencers':
      return fr
        ? 'Collaborations, cadeaux, commandes, avis et affiliation.'
        : 'Collaborations, gifts, orders, reviews and affiliation.';
    case 'services':
      return fr
        ? 'Services, produits digitaux, commandes, paiements, avis et commentaires.'
        : 'Services, digital products, orders, payments, reviews and comments.';
    default:
      return fr
        ? 'Les outils actifs changent selon l’espace sélectionné.'
        : 'Active tools change based on the selected workspace.';
  }
}

function featureTitle(key: SiteviralFeatureKey, fr: boolean) {
  if (key === 'appointment') return fr ? 'Rendez-vous / réservations' : 'Appointments / bookings';
  if (key === 'order_generator') return fr ? 'Services & commandes' : 'Services & orders';
  if (key === 'donation_gifts') return fr ? 'Dons, offrandes & cadeaux' : 'Donations, offerings & gifts';
  if (key === 'digital_products') return fr ? 'Produits digitaux' : 'Digital products';
  if (key === 'ai_formation_creation') return fr ? 'Formations IA' : 'AI courses';
  return fr ? FEATURE_META[key].labelFr : FEATURE_META[key].labelEn;
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { type, typeMeta, featureList } = useOrgFeatures();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const { primaryFeatures, additionalFeatures } = useMemo(() => {
    const fallback = type ? SITEVIRAL_TYPES[type]?.defaultFeatures ?? [] : [];
    const list = featureList.length ? featureList : fallback;
    const unique = new Set<SiteviralFeatureKey>(list as SiteviralFeatureKey[]);
    // Never mix platform essentials into either section — they render above.
    PLATFORM_ESSENTIALS.forEach((k) => unique.delete(k));

    const primaryOrder = getPrimaryFeaturesForType(type);
    const primary = primaryOrder.filter((k) => unique.has(k));
    const primarySet = new Set(primary);
    const additional = FEATURE_ORDER.filter((k) => unique.has(k) && !primarySet.has(k));
    return { primaryFeatures: primary, additionalFeatures: additional };
  }, [featureList, type]);


  if (!currentOrg) return null;

  return (
    <div className="min-h-full bg-background">
      <SEOHead title={`${currentOrg.name} — SiteViral dashboard`} noindex />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-7">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="rounded-md gap-1">
              <Building2 className="h-3 w-3" />
              {fr ? 'Bienvenue dans votre espace' : 'Welcome to your space'}
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {currentOrg.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {workspaceFocus(type, fr)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Button onClick={() => navigate('/start?context=add-feature')} className="gap-2">
              <Plus className="h-4 w-4" />
              {fr ? 'Ajouter une activité' : 'Add an activity'}
            </Button>
            <Button variant="outline" onClick={() => window.open(`/org/${currentOrg.slug}?as=visitor`, '_blank')} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {fr ? 'Voir la page' : 'View page'}
            </Button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {PLATFORM_ESSENTIALS.map((key) => {
            const meta = FEATURE_META[key];
            const route = FEATURE_ROUTES[key];
            const Icon = (Icons as any)[meta.icon] ?? ShieldCheck;
            return (
              <button
                key={key}
                onClick={() => navigate(route.setupRoute)}
                className="group rounded-xl border bg-card p-4 text-left transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{fr ? meta.labelFr : meta.labelEn}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {key === 'kyc'
                        ? (fr ? 'Obligatoire pour retirer les fonds, pas pour créer la page.' : 'Required for payouts, not for creating the page.')
                        : (fr ? meta.descFr : meta.descEn)}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </div>
              </button>
            );
          })}
        </section>

        {primaryFeatures.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {fr ? 'Outils principaux' : 'Principal tools'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {fr
                    ? 'Les outils essentiels de cette activité, activés par défaut.'
                    : 'The essential tools for this activity, enabled by default.'}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md">
                {primaryFeatures.length} {fr ? 'outil(s)' : 'tool(s)'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {primaryFeatures.map((key) => {
                const meta = FEATURE_META[key];
                const route = FEATURE_ROUTES[key];
                const Icon = (Icons as any)[meta.icon] ?? Zap;
                return (
                  <button
                    key={key}
                    onClick={() => navigate(route.setupRoute)}
                    className="group rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-transparent p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{featureTitle(key, fr)}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {fr ? meta.descFr : meta.descEn}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {additionalFeatures.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {fr ? 'Outils supplémentaires' : 'Additional tools'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {fr
                    ? 'Modules activés en plus. Vous pouvez en ajouter d’autres depuis les paramètres.'
                    : 'Extra modules you activated. You can add more from settings.'}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md">
                {additionalFeatures.length} {fr ? 'outil(s)' : 'tool(s)'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {additionalFeatures.map((key) => {
                const meta = FEATURE_META[key];
                const route = FEATURE_ROUTES[key];
                const Icon = (Icons as any)[meta.icon] ?? Zap;
                return (
                  <button
                    key={key}
                    onClick={() => navigate(route.setupRoute)}
                    className="group rounded-xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{featureTitle(key, fr)}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {fr ? meta.descFr : meta.descEn}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}