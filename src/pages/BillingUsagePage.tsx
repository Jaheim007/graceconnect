/**
 * BillingUsagePage — Sprint 9
 *
 * Shows the authenticated user their monthly consumption: AI credits used,
 * products sold, net revenue, commission saved by being on Pro/Org, and
 * platform-wide stats. Designed to make the value of the paid plan tangible
 * and to encourage retention.
 *
 * Route: /billing/usage
 */
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  TrendingUp,
  PiggyBank,
  Package,
  Building2,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingUsage } from '@/hooks/useBillingUsage';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';

const T = {
  fr: {
    title: 'Mon usage du mois',
    subtitle: 'Visualise la valeur que SiteViral te génère ce mois-ci.',
    back: 'Retour à la facturation',
    aiCredits: 'Crédits IA utilisés',
    aiCreditsHint: 'Génération de contenu, visuels, traductions',
    productsSold: 'Produits vendus',
    productsSoldHint: 'Achats complétés ce mois-ci',
    revenue: 'Revenu net',
    revenueHint: 'Après commission plateforme',
    saved: 'Commission économisée',
    savedHint: 'Grâce à ton plan Pro/Org',
    activeProducts: 'Produits actifs',
    activeProductsHint: 'Publiés et en vente',
    orgs: 'Organisations',
    orgsHint: 'Espaces que tu administres',
    upsellTitle: 'Passe à Pro pour réduire les commissions',
    upsellDesc: "Garde plus de tes revenus chaque mois et débloque l'IA illimitée.",
    upsellCta: 'Voir les plans',
    proValue: 'Tu es sur le plan Pro — bravo !',
  },
  en: {
    title: 'My monthly usage',
    subtitle: 'See the value SiteViral is generating for you this month.',
    back: 'Back to billing',
    aiCredits: 'AI credits used',
    aiCreditsHint: 'Content, visuals, translations',
    productsSold: 'Products sold',
    productsSoldHint: 'Completed purchases this month',
    revenue: 'Net revenue',
    revenueHint: 'After platform commission',
    saved: 'Commission saved',
    savedHint: 'Thanks to your Pro/Org plan',
    activeProducts: 'Active products',
    activeProductsHint: 'Published and on sale',
    orgs: 'Organizations',
    orgsHint: 'Spaces you administer',
    upsellTitle: 'Upgrade to Pro to slash commissions',
    upsellDesc: 'Keep more of your revenue and unlock unlimited AI.',
    upsellCta: 'See plans',
    proValue: "You're on the Pro plan — nice!",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`p-5 space-y-3 transition-all hover:shadow-md ${
        highlight ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-background to-emerald-500/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${highlight ? 'bg-primary/15' : 'bg-muted'}`}>
          <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </div>
      <div className="text-3xl font-bold tabular-nums tracking-tight">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export default function BillingUsagePage() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const t = T[isEn ? 'en' : 'fr'];
  const { data, isLoading } = useBillingUsage();
  const { tier, isTrialing } = usePlatformPlan();

  const isPaid = tier === 'pro' || tier === 'org';
  const fmt = (n: number) => new Intl.NumberFormat(isEn ? 'en-US' : 'fr-FR').format(n);
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(isEn ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${t.title} · SiteViral`}
        description={t.subtitle}
        noindex
      />
      <LandingNav />

      <main className="container max-w-5xl mx-auto pt-24 pb-24 px-4 space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/billing">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </Button>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-8">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3 w-3" />
              {isEn ? 'This month' : 'Ce mois-ci'}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">{t.subtitle}</p>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Sparkles}
              label={t.aiCredits}
              value={fmt(data.ai_credits_used_month)}
              hint={t.aiCreditsHint}
            />
            <StatCard
              icon={ShoppingBag}
              label={t.productsSold}
              value={fmt(data.products_sold_month)}
              hint={t.productsSoldHint}
            />
            <StatCard
              icon={TrendingUp}
              label={t.revenue}
              value={fmtMoney(data.revenue_net_month)}
              hint={t.revenueHint}
            />
            <StatCard
              icon={PiggyBank}
              label={t.saved}
              value={fmtMoney(data.commission_saved_month)}
              hint={t.savedHint}
              highlight={isPaid && data.commission_saved_month > 0}
            />
            <StatCard
              icon={Package}
              label={t.activeProducts}
              value={fmt(data.active_products)}
              hint={t.activeProductsHint}
            />
            <StatCard
              icon={Building2}
              label={t.orgs}
              value={fmt(data.total_organizations)}
              hint={t.orgsHint}
            />
          </div>
        )}

        {isPaid ? (
          <Card className="p-5 border-primary/30 bg-gradient-to-r from-primary/5 to-emerald-500/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">
              {t.proValue}
              {isTrialing && (isEn ? ' (trial active)' : ' (essai en cours)')}
            </p>
          </Card>
        ) : (
          <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-500/10 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {t.upsellTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.upsellDesc}</p>
            <Button asChild className="gap-1.5">
              <Link to="/pricing">
                <Crown className="h-4 w-4" />
                {t.upsellCta}
              </Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
