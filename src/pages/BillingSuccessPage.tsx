import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { CheckCircle2, Loader2, Crown, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useServerFn } from '@tanstack/react-start';
import { checkSubscription } from '@/lib/billing/billing.functions';
import { trackEvent } from '@/hooks/useClientAnalytics';

export default function BillingSuccessPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const runCheck = useServerFn(checkSubscription);
  const [verifying, setVerifying] = useState(true);
  const [tier, setTier] = useState<string>('free');
  const [founderSlot, setFounderSlot] = useState<number | null>(null);

  const planParam = params.get('plan');
  const isLifetime = planParam === 'pro_lifetime';

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      try {
        const data: any = await runCheck({});
        if (cancelled) return;
        if (data?.tier && data.tier !== 'free') {
          setTier(data.tier);
          setFounderSlot(data.founder_slot || null);
          setVerifying(false);
          if (user) {
            trackEvent('billing_success_confirmed', {
              tier: data.tier, founder_slot: data.founder_slot, plan: planParam,
            }, user.id);
          }
          return;
        }
      } catch { /* retry */ }

      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        setVerifying(false);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [user, planParam, runCheck]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Bienvenue dans Pro" description="Confirmation d'abonnement SiteViral" canonicalUrl="https://siteviral.com/billing/success" />
      <LandingNav />
      <main className="container max-w-2xl px-4 pt-32 pb-24">
        <div className="text-center">
          {verifying ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {isFr ? 'Confirmation de ton paiement…' : 'Confirming your payment…'}
              </h1>
              <p className="text-muted-foreground">
                {isFr ? 'Cela prend quelques secondes.' : 'This takes a few seconds.'}
              </p>
            </>
          ) : tier === 'free' ? (
            <>
              
              <h1 className="text-2xl font-bold mb-2">
                {isFr ? 'Paiement en cours de traitement' : 'Payment is being processed'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isFr
                  ? 'Ton paiement est en cours de validation. Tu recevras un email dès qu\'il sera confirmé. Tu peux fermer cette page.'
                  : 'Your payment is being validated. You\'ll receive an email once confirmed. You can close this page.'}
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                {isFr ? 'Aller au tableau de bord' : 'Go to dashboard'}
              </Button>
            </>
          ) : (
            <>
              {isLifetime || founderSlot ? (
                <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
              ) : (
                <CheckCircle2 className="h-16 w-16 mx-auto text-primary mb-4" />
              )}
              <h1 className="text-3xl font-extrabold mb-2">
                {founderSlot
                  ? (isFr ? `Bienvenue Founder #${founderSlot} 🎉` : `Welcome Founder #${founderSlot} 🎉`)
                  : (isFr ? `Bienvenue dans ${tier.toUpperCase()} 🎉` : `Welcome to ${tier.toUpperCase()} 🎉`)}
              </h1>
              <p className="text-muted-foreground mb-2">
                {isFr
                  ? 'Tes outils Pro sont activés immédiatement. Plus de commission, plus de filigrane, crédits IA débloqués.'
                  : 'Your Pro tools are now active. No more commission, no watermark, AI credits unlocked.'}
              </p>
              {!isLifetime && (
                <p className="text-sm text-primary font-medium mb-6">
                  {isFr ? '14 jours gratuits — aucun débit avant la fin de l\'essai.' : '14 days free — no charge before trial ends.'}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Button size="lg" onClick={() => navigate('/dashboard')} className="gap-2">
                  <Crown className="h-4 w-4" />
                  {isFr ? 'Découvrir Pro' : 'Explore Pro'}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/billing')}>
                  {isFr ? 'Gérer mon abonnement' : 'Manage subscription'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
