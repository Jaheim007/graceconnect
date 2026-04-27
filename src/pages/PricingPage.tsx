import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Crown, Building2, Star, CreditCard, Smartphone, Loader2, Trophy, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';
import { usePlatformCheckout, type PlanKey } from '@/hooks/usePlatformCheckout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const PRO_PRICE_XOF = 19000;
const ORG_PRICE_XOF = 49000;
const FOUNDER_PRICE_XOF = 49000;

export default function PricingPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fmt } = useDisplayCurrency();
  const plan = usePlatformPlan();
  const { startCheckout, loading: checkoutLoading } = usePlatformCheckout();

  const [providerOpen, setProviderOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro_monthly');
  const [foundersLeft, setFoundersLeft] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc('founders_remaining');
      if (typeof data === 'number') setFoundersLeft(data);
    })();
  }, []);

  const openCheckout = (planKey: PlanKey) => {
    if (!user) {
      navigate(`/auth?mode=signup&next=${encodeURIComponent('/pricing')}`);
      return;
    }
    trackEvent('pricing_checkout_open', { plan_key: planKey }, user.id);
    setSelectedPlan(planKey);
    setProviderOpen(true);
  };

  const proCta = plan.isPro
    ? (isFr ? 'Plan actuel ✓' : 'Current plan ✓')
    : plan.isGrandfather
      ? (isFr ? 'Activer après l\'essai grandfather' : 'Activate after grandfather trial')
      : (isFr ? 'Démarrer 14 jours gratuits' : 'Start 14-day free trial');

  const orgCta = plan.isOrg
    ? (isFr ? 'Plan actuel ✓' : 'Current plan ✓')
    : (isFr ? 'Démarrer 14 jours gratuits' : 'Start 14-day free trial');

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
      cta: plan.isFree ? (isFr ? 'Plan actuel ✓' : 'Current plan ✓') : (isFr ? 'Commencer gratuitement' : 'Start for free'),
      ctaVariant: 'outline' as const,
      onClick: () => {
        trackEvent('pricing_cta_click', { plan: 'free', source: 'pricing_page' }, user?.id);
        navigate(user ? '/dashboard' : '/auth?mode=signup');
      },
      disabled: plan.isFree,
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
      badge: isFr ? '14 jours gratuits' : '14-day free trial',
      cta: proCta,
      ctaVariant: 'default' as const,
      onClick: () => openCheckout('pro_monthly'),
      disabled: plan.isPro,
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
        ? `💡 200 000 XOF de ventes/mois ? Tu économises ~20 000/mois en commission.`
        : `💡 200K/mo in sales? You save ~20K/mo in commission.`,
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
      cta: orgCta,
      ctaVariant: 'outline' as const,
      onClick: () => openCheckout('org_monthly'),
      disabled: plan.isOrg,
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
          ? 'Choisis ton plan SiteViral. 14 jours gratuits sur Pro/Org. Pro à 0% de commission. Mobile Money + carte.'
          : 'Pick your SiteViral plan. 14-day free trial on Pro/Org. Pro with 0% commission. Mobile Money + card.'}
        canonicalUrl="https://siteviral.com/pricing"
      />
      <LandingNav />

      <main className="pt-20 pb-24">
        {/* Active subscription banner */}
        {plan.subscription && (plan.isTrialing || plan.isPro || plan.isOrg) && (
          <section className="container max-w-5xl px-4 pt-8">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {plan.isFounder ? (
                  <Trophy className="h-5 w-5 text-amber-500" />
                ) : plan.isTrialing ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : (
                  <Crown className="h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-semibold text-sm">
                    {plan.isFounder
                      ? (isFr ? `Founder lifetime — slot #${plan.founderSlot}` : `Founder lifetime — slot #${plan.founderSlot}`)
                      : plan.isTrialing
                        ? (isFr ? `Essai Pro en cours` : `Pro trial active`)
                        : (isFr ? `Plan ${plan.tier.toUpperCase()} actif` : `${plan.tier.toUpperCase()} plan active`)}
                  </p>
                  {plan.isTrialing && plan.trialEndsAt && (
                    <p className="text-xs text-muted-foreground">
                      {isFr ? 'Fin de l\'essai : ' : 'Trial ends: '}
                      {plan.trialEndsAt.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                    </p>
                  )}
                  {!plan.isTrialing && plan.periodEndsAt && !plan.isFounder && (
                    <p className="text-xs text-muted-foreground">
                      {plan.isCanceled
                        ? (isFr ? 'Annulation prévue le ' : 'Cancels on ')
                        : (isFr ? 'Prochaine facturation : ' : 'Next billing: ')}
                      {plan.periodEndsAt.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/billing')}>
                {isFr ? 'Gérer' : 'Manage'}
              </Button>
            </div>
          </section>
        )}

        {/* Grandfather banner */}
        {plan.isGrandfather && plan.grandfatherEndsAt && (
          <section className="container max-w-5xl px-4 pt-8">
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/30 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    {isFr
                      ? '🎁 Cadeau Grandfather : Pro gratuit jusqu\'au '
                      : '🎁 Grandfather gift: Pro free until '}
                    {plan.grandfatherEndsAt.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFr
                      ? 'Tu fais partie des utilisateurs présents avant le lancement payant. Profite de Pro gratuitement pendant 60 jours, puis active ton abonnement quand tu veux.'
                      : 'You\'re part of our pre-launch users. Enjoy Pro free for 60 days, then activate your subscription whenever you want.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="container max-w-5xl px-4 py-12 sm:py-16 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Star className="h-3 w-3 fill-current" />
              {isFr ? '14 jours gratuits — sans CB requise' : '14-day free trial — no card required'}
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
                ? 'Démarre gratuitement. 14 jours d\'essai sur Pro & Org. Aucun engagement, annulable à tout moment.'
                : 'Start free. 14-day trial on Pro & Org. No commitment, cancel anytime.'}
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
                      disabled={tier.disabled || checkoutLoading}
                      className={cn(
                        'w-full gap-2 mb-6',
                        tier.featured && 'shadow-lg shadow-primary/20'
                      )}
                    >
                      {tier.cta}
                      {!tier.disabled && <ArrowRight className="h-4 w-4" />}
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

        {/* Founder Lifetime */}
        {foundersLeft !== null && foundersLeft > 0 && !plan.isFounder && (
          <section className="container max-w-4xl px-4 py-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-purple-500/10 border-2 border-amber-500/40 p-8 sm:p-12 overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 text-amber-50 gap-1 shadow-lg">
                  <Trophy className="h-3 w-3" />
                  {isFr ? `${foundersLeft} places restantes / 50` : `${foundersLeft} spots left / 50`}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  {isFr ? 'Founder Lifetime — Pro à vie' : 'Founder Lifetime — Pro forever'}
                </h2>
              </div>
              <p className="text-muted-foreground mb-2">
                {isFr
                  ? 'Pour les 50 premiers convertis : un seul paiement, Pro à vie. Plus tu rejoins tôt, plus ton numéro de slot est bas.'
                  : 'For the first 50 converters: one payment, Pro forever. The earlier you join, the lower your slot number.'}
              </p>
              <div className="flex flex-wrap items-baseline gap-3 my-6">
                <span className="text-5xl font-extrabold text-foreground">{fmt(FOUNDER_PRICE_XOF)}</span>
                <span className="text-sm text-muted-foreground line-through">
                  {fmt(PRO_PRICE_XOF * 24)} {isFr ? 'sur 2 ans' : 'over 2 years'}
                </span>
                <Badge variant="secondary">{isFr ? 'Économise 90%+' : 'Save 90%+'}</Badge>
              </div>
              <Button
                size="lg"
                onClick={() => openCheckout('pro_lifetime')}
                disabled={checkoutLoading}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-50 shadow-xl shadow-amber-500/30"
              >
                <Trophy className="h-4 w-4" />
                {isFr ? 'Devenir Founder' : 'Become a Founder'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                {isFr
                  ? '✨ Badge "Founder #X" affiché publiquement • Accès Pro à vie • Aucune commission • Support direct fondateur'
                  : '✨ Public "Founder #X" badge • Lifetime Pro access • Zero commission • Direct founder support'}
              </p>
            </motion.div>
          </section>
        )}

        {/* FAQ */}
        <section className="container max-w-3xl px-4 py-16">
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {[
              {
                q: isFr ? 'Pourquoi un plan payant ?' : 'Why a paid plan?',
                a: isFr
                  ? 'Pro élimine la commission de 10% et débloque les outils pro. À partir de ~190 000 de ventes/mois, Pro est moins cher que le Gratuit.'
                  : 'Pro removes the 10% commission and unlocks pro tools. Above ~190K in monthly sales, Pro is cheaper than Free.',
              },
              {
                q: isFr ? 'Que se passe-t-il pour les utilisateurs actuels ?' : 'What about current users?',
                a: isFr
                  ? 'Tous les utilisateurs présents au lancement bénéficient automatiquement de Pro gratuit pendant 60 jours. Aucune action requise.'
                  : 'All users present at launch automatically get Pro free for 60 days. No action required.',
              },
              {
                q: isFr ? 'Engagement minimum ?' : 'Minimum commitment?',
                a: isFr
                  ? 'Aucun. Mensuel, annulable à tout moment. 14 jours d\'essai sans CB requise.'
                  : 'None. Monthly, cancel anytime. 14-day trial, no card required.',
              },
              {
                q: isFr ? 'Comment payer ?' : 'How to pay?',
                a: isFr
                  ? 'Carte bancaire (Stripe, USD) ou Mobile Money + carte XOF/GHS/KES (Paystack). Tu choisis au checkout.'
                  : 'Credit card (Stripe, USD) or Mobile Money + XOF/GHS/KES card (Paystack). You choose at checkout.',
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

      {/* Provider selector dialog */}
      <Dialog open={providerOpen} onOpenChange={setProviderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isFr ? 'Choisis ton mode de paiement' : 'Choose your payment method'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan === 'pro_lifetime'
                ? (isFr ? `Paiement unique de ${fmt(FOUNDER_PRICE_XOF)} pour Pro à vie.` : `One-time ${fmt(FOUNDER_PRICE_XOF)} for lifetime Pro.`)
                : (isFr ? '14 jours gratuits, puis facturation mensuelle. Annulable à tout moment.' : '14 days free, then monthly billing. Cancel anytime.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button
              onClick={() => { setProviderOpen(false); startCheckout({ plan: selectedPlan, provider: 'paystack', currency: 'XOF' }); }}
              disabled={checkoutLoading}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{isFr ? 'Mobile Money + Carte (Afrique)' : 'Mobile Money + Card (Africa)'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFr ? 'Orange, MTN, Wave, Moov, M-Pesa, MoMo, Carte XOF/GHS/KES' : 'Orange, MTN, Wave, Moov, M-Pesa, MoMo, XOF/GHS/KES card'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">{isFr ? 'Recommandé' : 'Recommended'}</Badge>
            </button>
            <button
              onClick={() => { setProviderOpen(false); startCheckout({ plan: selectedPlan, provider: 'stripe' }); }}
              disabled={checkoutLoading}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{isFr ? 'Carte bancaire internationale' : 'International credit card'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFr ? 'Visa, Mastercard, Amex en USD via Stripe' : 'Visa, Mastercard, Amex in USD via Stripe'}
                </p>
              </div>
            </button>
            {checkoutLoading && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isFr ? 'Préparation du checkout…' : 'Preparing checkout…'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
