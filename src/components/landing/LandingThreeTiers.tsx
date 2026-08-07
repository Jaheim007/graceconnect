import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Crown, Building2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { trackEvent } from '@/hooks/useClientAnalytics';

const PRO_PRICE_XOF = 19000;
const ORG_PRICE_XOF = 49000;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * Compact 3-tier teaser for the landing page. Sends users to /pricing
 * for the full comparison + waitlist CTAs.
 */
export function LandingThreeTiers() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();
  const isFr = locale === 'fr';

  const tiers = [
    {
      id: 'free',
      icon: Zap,
      name: isFr ? 'Gratuit' : 'Free',
      price: fmt(0),
      tagline: isFr ? 'Démarre, vends, encaisse' : 'Start, sell, earn',
      bullets: isFr
        ? ['Boutique illimitée', 'Mobile Money + Carte', 'Programme ambassadeur', 'Commission 10%']
        : ['Unlimited storefront', 'Mobile Money + Card', 'Ambassador program', '10% commission'],
      cta: isFr ? 'Commencer' : 'Get started',
      onClick: () => navigate('/auth?mode=signup'),
      featured: false,
    },
    {
      id: 'pro',
      icon: Crown,
      name: 'Pro',
      price: fmt(PRO_PRICE_XOF),
      tagline: isFr ? 'Pour créateurs établis' : 'For established creators',
      bullets: isFr
        ? ['0% commission plateforme', 'IA illimitée incluse', 'Domaine personnalisé', 'Analytics avancés']
        : ['0% platform commission', 'Unlimited AI included', 'Custom domain', 'Advanced analytics'],
      cta: isFr ? 'Voir Pro' : 'See Pro',
      onClick: () => {
        trackEvent('pricing_cta_click', { plan: 'pro', source: 'landing_tiers' });
        navigate('/pricing');
      },
      featured: true,
    },
    {
      id: 'org',
      icon: Building2,
      name: isFr ? 'Organisation' : 'Organization',
      price: fmt(ORG_PRICE_XOF),
      tagline: isFr ? 'Équipes, ONG, centres' : 'Teams, NGOs, centers',
      bullets: isFr
        ? ['Membres illimités', 'Marque blanche', 'Support prioritaire', 'Onboarding dédié']
        : ['Unlimited members', 'White-label', 'Priority support', 'Dedicated onboarding'],
      cta: isFr ? 'Voir Organisation' : 'See Organization',
      onClick: () => {
        trackEvent('pricing_cta_click', { plan: 'org', source: 'landing_tiers' });
        navigate('/pricing');
      },
      featured: false,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background" id="plans">
      <div className="container px-4 max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3">
            {isFr ? '3 plans, zéro friction' : '3 plans, zero friction'}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isFr ? 'Choisis ton niveau' : 'Pick your level'}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {isFr
              ? 'Démarre gratuitement. Passe Pro quand tes ventes le justifient.'
              : 'Start free. Upgrade to Pro when your sales justify it.'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-2xl border bg-card p-6 flex flex-col ${
                  tier.featured
                    ? 'border-primary shadow-lg shadow-primary/10 md:scale-[1.02]'
                    : 'border-border'
                }`}
              >
                {tier.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {isFr ? 'Populaire' : 'Popular'}
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${tier.featured ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{tier.tagline}</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {isFr ? '/mois' : '/month'}
                  </span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={tier.onClick}
                  variant={tier.featured ? 'default' : 'outline'}
                  className="w-full"
                >
                  {tier.cta}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isFr
            ? 'Tarifs lancement fondateurs · garantis 12 mois après ton inscription Pro/Org.'
            : 'Founder pricing · locked for 12 months after Pro/Org signup.'}
        </p>
      </div>
    </section>
  );
}
