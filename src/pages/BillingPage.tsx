import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy, ArrowLeft, AlertTriangle, Sparkles, Calendar, CreditCard, Smartphone, Ticket, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformPlan } from '@/hooks/usePlatformPlan';
import { usePlatformCheckout } from '@/hooks/usePlatformCheckout';
import { useWaitlistCoupon } from '@/hooks/useWaitlistCoupon';
import { toast } from 'sonner';

export default function BillingPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = usePlatformPlan();
  const { cancelSubscription, loading } = usePlatformCheckout();
  const { coupon } = useWaitlistCoupon();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!coupon?.code) return;
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(isFr ? 'Code copié' : 'Code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    navigate('/auth?next=/billing');
    return null;
  }

  const handleCancel = async () => {
    await cancelSubscription(false);
    setCancelOpen(false);
    plan.refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Mon abonnement — SiteViral' : 'My subscription — SiteViral'} description="" canonicalUrl="https://siteviral.com/billing" />
      <LandingNav />

      <main className="container max-w-3xl px-4 pt-24 pb-24">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {isFr ? 'Retour' : 'Back'}
        </Button>

        <h1 className="text-3xl font-extrabold mb-2">
          {isFr ? 'Mon abonnement' : 'My subscription'}
        </h1>
        <p className="text-muted-foreground mb-4">
          {isFr ? 'Gère ton plan SiteViral et ton mode de paiement.' : 'Manage your SiteViral plan and payment method.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/billing/usage')} className="mb-8 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {isFr ? 'Voir mon usage du mois' : 'View my monthly usage'}
        </Button>

        {/* Current plan card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                {plan.isFounder ? <Trophy className="h-5 w-5 text-amber-500" /> : <Crown className="h-5 w-5 text-primary" />}
                {plan.isFounder
                  ? (isFr ? `Founder #${plan.founderSlot}` : `Founder #${plan.founderSlot}`)
                  : `Plan ${plan.tier.toUpperCase()}`}
              </CardTitle>
              <Badge variant={plan.isFree ? 'outline' : 'default'}>
                {plan.isTrialing
                  ? (isFr ? 'Essai actif' : 'Trial active')
                  : plan.isFree
                    ? (isFr ? 'Gratuit' : 'Free')
                    : plan.isFounder
                      ? (isFr ? 'À vie' : 'Lifetime')
                      : (isFr ? 'Actif' : 'Active')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {plan.isGrandfather && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p>
                  {isFr ? 'Cadeau Grandfather : Pro gratuit jusqu\'au ' : 'Grandfather gift: Pro free until '}
                  <strong>{plan.grandfatherEndsAt?.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</strong>
                </p>
              </div>
            )}

            {plan.isTrialing && plan.trialEndsAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {isFr ? 'Fin de l\'essai : ' : 'Trial ends: '}
                <strong className="text-foreground">{plan.trialEndsAt.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</strong>
              </div>
            )}

            {plan.periodEndsAt && !plan.isFounder && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {plan.isCanceled
                  ? (isFr ? 'Annulation prévue le : ' : 'Cancels on: ')
                  : (isFr ? 'Prochaine facturation : ' : 'Next billing: ')}
                <strong className="text-foreground">{plan.periodEndsAt.toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</strong>
              </div>
            )}

            {plan.provider && plan.provider !== 'founder' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                {plan.provider === 'paystack' ? <Smartphone className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {isFr ? 'Mode de paiement : ' : 'Payment method: '}
                <strong className="text-foreground capitalize">{plan.provider}</strong>
              </div>
            )}

            {plan.isCanceled && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-destructive">
                  {isFr
                    ? 'Ton abonnement est annulé. Tu gardes l\'accès Pro jusqu\'à la fin de la période en cours.'
                    : 'Your subscription is canceled. You keep Pro access until the end of the current period.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waitlist coupon (-20% à vie) */}
        {coupon && plan.isFree && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-amber-600" />
                {isFr ? `Ton code early-adopter — ${coupon.discount_percent}% à vie` : `Your early-adopter code — ${coupon.discount_percent}% forever`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {isFr
                  ? 'En tant qu\'inscrit·e à la waitlist, tu bénéficies d\'une remise permanente sur ton abonnement Pro. Le code est appliqué automatiquement au checkout.'
                  : 'As a waitlist member, you get a permanent discount on your Pro subscription. The code is auto-applied at checkout.'}
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                <code className="flex-1 font-mono text-base font-semibold tracking-wider">{coupon.code}</code>
                <Button size="sm" variant="ghost" onClick={copyCode} className="gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
                </Button>
              </div>
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate(`/pricing?coupon=${coupon.code}`)}
              >
                <Crown className="h-4 w-4" />
                {isFr ? `Activer Pro avec ${coupon.discount_percent}% de remise` : `Activate Pro with ${coupon.discount_percent}% off`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {plan.isFree && (
            <Button onClick={() => navigate('/pricing')} className="gap-2">
              <Crown className="h-4 w-4" />
              {isFr ? 'Voir les plans' : 'View plans'}
            </Button>
          )}

          {!plan.isFree && !plan.isFounder && !plan.isCanceled && (
            <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  {isFr ? 'Annuler l\'abonnement' : 'Cancel subscription'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{isFr ? 'Annuler ton abonnement Pro ?' : 'Cancel your Pro subscription?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isFr
                      ? 'Ton accès Pro reste actif jusqu\'à la fin de la période en cours. Tu basculeras ensuite sur le plan Gratuit (commission 10% réactivée). Tu peux réactiver à tout moment.'
                      : 'Your Pro access stays active until the end of the current period. You\'ll then switch to Free (10% commission re-enabled). You can reactivate anytime.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isFr ? 'Garder Pro' : 'Keep Pro'}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={loading}>
                    {isFr ? 'Confirmer l\'annulation' : 'Confirm cancel'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {plan.isCanceled && (
            <Button onClick={() => navigate('/pricing')} className="gap-2">
              {isFr ? 'Réactiver Pro' : 'Reactivate Pro'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
