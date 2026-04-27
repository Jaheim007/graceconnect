import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Crown, Building2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { PlatformPlanWaitlistDialog } from '@/components/pricing/PlatformPlanWaitlistDialog';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Founder pricing reference (XOF base — converted via display currency)
const PRO_PRICE_XOF = 19000;
const ORG_PRICE_XOF = 49000;

export default function PricingPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fmt } = useDisplayCurrency();

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState<'pro' | 'org'>('pro');

  const openWaitlist = (plan: 'pro' | 'org') => {
    trackEvent('pricing_cta_click', { plan, source: 'pricing_page' }, user?.id);
    setWaitlistPlan(plan);
    setWaitlistOpen(true);
  };

  const tiers = [
    {
      id: 'free',
      name: isFr ? 'Gratuit' : 'Free',
      tagline: isFr ? 'Pour démarrer et tester' : 'To start and test',
      price: fmt(0),
      priceSuffix: isFr ? '/mois' : '/month',
      icon: Sparkles,
      iconColor: 'text-muted-foreground',
      borderColor: 'border-border',
      cta: isFr ? 'Commencer gratuitement' : 'Start for free',
      ctaVariant: 'outline' as const,
      onClick: () => {
        trackEvent('pricing_cta_click', { plan: 'free', source: 'pricing_page' }, user?.id);
        navigate(user ? '/dashboard' : '/auth?mode=signup');
      },
      features: isFr ? [
        '✏️ Éditeur de livre IA (crédits inclus)',
        '🛍️ Boutique en ligne illimitée',
        '🤝 Programme ambassadeur intégré',
        '📱 Mobile Money + Carte bancaire',
        '🔒 Protection contenu 8 couches',
        '📊 Analytique de base',
      ] : [
        '✏️ AI book editor (credits included)',
        '🛍️ Unlimited online store',
        '🤝 Built-in ambassador program',
        '📱 Mobile Money + Card payments',
        '🔒 8-layer content protection',
        '📊 Basic analytics',
      ],
      limits: isFr ? [
        '⚠️ Commission plateforme : 10%',
        '⚠️ Filigrane "Powered by SiteViral"',
        '⚠️ Crédits IA limités',
      ] : [
        '⚠️ Platform commission: 10%',
        '⚠️ "Powered by SiteViral" watermark',
        '⚠️ Limited AI credits',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: isFr ? 'Pour les créateurs sérieux' : 'For serious creators',
      price: fmt(PRO_PRICE_XOF),
      priceSuffix: isFr ? '/mois' : '/month',
      icon: Crown,
      iconColor: 'text-primary',
      borderColor: 'border-primary',
      featured: true,
      badge: isFr ? 'Le plus populaire' : 'Most popular',
      cta: isFr ? 'Rejoindre la liste Pro' : 'Join Pro waitlist',
      ctaVariant: 'default' as const,
      onClick: () => openWaitlist('pro'),
      features: isFr ? [
        '💎 Commission plateforme : 0% (vs 10%)',
        '🚀 Crédits IA illimités',
        '🏷️ Marque blanche (sans filigrane)',
        '🌐 Domaine personnalisé inclus',
        '📈 Analytique avancée + cohortes',
        '🎯 Email marketing & automations',
        '⚡ Support prioritaire',
        '✅ Tout du plan Gratuit',
      ] : [
        '💎 Platform commission: 0% (vs 10%)',
        '🚀 Unlimited AI credits',
        '🏷️ White-label (no watermark)',
        '🌐 Custom domain included',
        '📈 Advanced analytics + cohorts',
        '🎯 Email marketing & automations',
        '⚡ Priority support',
        '✅ Everything in Free',
      ],
      roi: isFr
        ? `💡 Tu fais 200 000 ${(fmt(0).replace('0', '').trim() || 'XOF')} de ventes/mois ? Tu économises ~20 000/mois en commission.`
        : `💡 Doing 200K/mo in sales? You save ~20K/mo in commission.`,
    },
    {
      id: 'org',
      name: 'Org',
      tagline: isFr ? 'Pour équipes & académies' : 'For teams & academies',
      price: fmt(ORG_PRICE_XOF),
      priceSuffix: isFr ? '/mois' : '/month',
      icon: Building2,
      iconColor: 'text-accent',
      borderColor: 'border-accent/40',
      cta: isFr ? 'Rejoindre la liste Org' : 'Join Org waitlist',
      ctaVariant: 'outline' as const,
      onClick: () => openWaitlist('org'),
      features: isFr ? [
        '👥 Multi-utilisateurs & rôles',
        '🏢 Multi-organisations',
        '🎓 LMS complet (formations + certificats)',
        '🔌 API & webhooks',
        '🛡️ SSO + audit logs',
        '📞 Support dédié + onboarding',
        '✅ Tout du plan Pro',
      ] : [
        '👥 Multi-user & roles',
        '🏢 Multi-organizations',
        '🎓 Full LMS (courses + certificates)',
        '🔌 API & webhooks',
        '🛡️ SSO + audit logs',
        '📞 Dedicated support + onboarding',
        '✅ Everything in Pro',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr
          ? 'Tarifs SiteViral — Gratuit, Pro, Org'
          : 'SiteViral Pricing — Free, Pro, Org'}
        description={isFr
          ? 'Choisis ton plan SiteViral. Gratuit pour démarrer, Pro à 0% de commission, Org pour équipes & académies.'
          : 'Pick your SiteViral plan. Free to start, Pro with 0% commission, Org for teams & academies.'}
        canonicalUrl="https://siteviral.com/pricing"
      />
      <LandingNav />

      <main className="pt-20 pb-24">
        {/* Hero */}
        <section className="container max-w-5xl px-4 py-12 sm:py-16 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Star className="h-3 w-3 fill-current" />
              {isFr ? 'Tarif fondateur — places limitées' : 'Founder pricing — limited spots'}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              {isFr ? (
                <>Choisis le plan qui <span className="text-primary">paie pour lui-même</span>.</>
              ) : (
                <>Pick the plan that <span className="text-primary">pays for itself</span>.</>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isFr
                ? 'Démarre gratuitement. Passe à Pro quand tes ventes te le permettent. Aucun engagement, annulable à tout moment.'
                : 'Start free. Upgrade to Pro when your sales justify it. No commitment, cancel anytime.'}
            </p>
          </motion.div>
        </section>

        {/* Tiers */}
        <section className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeUp}
                  className={cn(
                    'relative rounded-2xl border-2 bg-card overflow-hidden flex flex-col',
                    tier.borderColor,
                    tier.featured && 'shadow-2xl shadow-primary/10 md:scale-[1.02]'
                  )}
                >
                  {tier.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <Badge className="gap-1 bg-primary text-primary-foreground border-0 shadow-lg">
                        <Star className="h-3 w-3 fill-current" />
                        {tier.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('h-5 w-5', tier.iconColor)} />
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{tier.tagline}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">{tier.price}</span>
                        <span className="text-sm text-muted-foreground">{tier.priceSuffix}</span>
                      </div>
                    </div>

                    <Button
                      variant={tier.ctaVariant}
                      size="lg"
                      onClick={tier.onClick}
                      className={cn(
                        'w-full gap-2 mb-6',
                        tier.featured && 'shadow-lg shadow-primary/20'
                      )}
                    >
                      {tier.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <ul className="space-y-2.5 text-sm flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.limits && (
                      <ul className="space-y-1.5 text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                        {tier.limits.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    )}

                    {tier.roi && (
                      <p className="text-xs bg-primary/5 border border-primary/15 rounded-lg p-3 mt-4 text-primary font-medium">
                        {tier.roi}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* FAQ-like reassurance */}
        <section className="container max-w-3xl px-4 py-16">
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {[
              {
                q: isFr ? 'Pourquoi un plan payant ?' : 'Why a paid plan?',
                a: isFr
                  ? 'Pro élimine la commission de 10% et débloque les outils pro (domaine, analytique avancée, marque blanche). À partir de ~190 000 de ventes/mois, Pro est moins cher que le Gratuit.'
                  : 'Pro removes the 10% commission and unlocks pro tools (domain, advanced analytics, white-label). Above ~190K in monthly sales, Pro is cheaper than Free.',
              },
              {
                q: isFr ? 'Que se passe-t-il pour les utilisateurs actuels ?' : 'What happens to current users?',
                a: isFr
                  ? 'Les utilisateurs actifs aujourd\'hui gardent leurs conditions actuelles pendant 30 jours après le lancement de Pro. Pas de mauvaise surprise.'
                  : 'Active users today keep their current terms for 30 days after Pro launch. No surprises.',
              },
              {
                q: isFr ? 'Engagement minimum ?' : 'Minimum commitment?',
                a: isFr
                  ? 'Aucun. Mensuel, annulable à tout moment. Tarif annuel disponible avec -20%.'
                  : 'None. Monthly, cancel anytime. Annual pricing available at -20%.',
              },
              {
                q: isFr ? 'Comment payer ?' : 'How to pay?',
                a: isFr
                  ? 'Carte bancaire (Stripe) et Mobile Money (Paystack). Tous les pays supportés.'
                  : 'Credit card (Stripe) and Mobile Money (Paystack). All countries supported.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-border p-5 bg-card">
                <h4 className="font-semibold mb-2">{item.q}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PlatformPlanWaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        plan={waitlistPlan}
      />
    </div>
  );
}
