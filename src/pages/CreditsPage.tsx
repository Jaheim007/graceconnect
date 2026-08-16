import { useState, useCallback, useEffect } from 'react';
import { Coins, Zap, Gift, ShoppingBag, Clock, TrendingUp, TrendingDown, ArrowRight, History, BookOpen, Image, HelpCircle, CheckCircle, Loader2, Shield, Infinity, RefreshCw } from 'lucide-react';
import { useCreditsBalance, useCreditPacks, useCreditHistory, useGrantDailyCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGateway, PaymentMethod } from '@/hooks/usePaymentGateway';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { isMoMoAvailable } from '@/lib/paymentRouting';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n/I18nContext';

/** Free credits granted every day (matches grant_daily_credits default). */
const DAILY_GRANT = 20;

function formatCredits(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

function timeUntil(dateStr: string | null, isFr: boolean): string {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return isFr ? 'expiré' : 'expired';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
  return `${mins}m`;
}


export default function CreditsPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const numLoc = isFr ? 'fr-FR' : 'en-US';
  const dateLoc = isFr ? fr : enUS;
  const { data: summary, isLoading: loadingSummary } = useCreditsBalance();
  
  const { data: packs } = useCreditPacks();
  const { data: history } = useCreditHistory(50);
  const grantDaily = useGrantDailyCredits();
  const { openPayment, hasPaystackKey } = usePaymentGateway();
  const qc = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('packs');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Credit packs are priced in XOF
  const creditCurrency = 'XOF';
  const defaultMethod: PaymentMethod = isMoMoAvailable(creditCurrency) ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);

  useEffect(() => {
    setPaymentMethod(defaultMethod);
  }, [defaultMethod]);

  // Handle Stripe redirect back (after credit checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const creditPurchaseId = params.get('credit_purchase_id');
    const stripeSessionId = params.get('stripe_session_id');

    if (creditPurchaseId && stripeSessionId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('credit_purchase_id');
      url.searchParams.delete('stripe_session_id');
      window.history.replaceState({}, '', url.toString());

      (async () => {
        try {
          const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-credit-purchase', {
            body: { reference: stripeSessionId, purchase_id: creditPurchaseId, gateway: 'stripe' },
          });

          if (verifyErr || !verifyData?.ok) {
            toast.error(verifyData?.error || (isFr ? 'Erreur de vérification Stripe. Contactez le support.' : 'Stripe verification error. Contact support.'));
            return;
          }

          toast.success(isFr ? `🎉 ${verifyData.credits} crédits ajoutés à votre compte !` : `🎉 ${verifyData.credits} credits added to your account!`);
          qc.invalidateQueries({ queryKey: ['credits'] });
        } catch {
          toast.error(isFr ? 'Erreur lors de la vérification. Vos crédits seront ajoutés sous peu.' : 'Verification error. Your credits will be added shortly.');
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePurchase = useCallback(async (packKey: string) => {
    if (!user?.email) {
      toast.error(isFr ? 'Veuillez vous connecter pour acheter des crédits.' : 'Please log in to purchase credits.');
      return;
    }

    setPurchasing(packKey);
    try {
      // Apple Pay → Stripe Checkout. Mobile Money → GeniusPay (legacy "paystack" label kept for DB enum).
      // Card → Stripe.
      const gateway = paymentMethod === 'mobile_money' ? 'paystack' : 'stripe';
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { pack_key: packKey, payment_gateway: gateway },
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || (isFr ? 'Erreur lors de la création de l\'achat' : 'Error creating purchase'));
      }

      if (gateway === 'stripe') {
        const currentUrl = window.location.origin + '/credits';
        const { data: stripeData, error: stripeErr } = await supabase.functions.invoke('stripe-credit-checkout', {
          body: {
            purchase_id: data.purchase_id,
            success_url: currentUrl,
            cancel_url: currentUrl,
          },
        });

        if (stripeErr || !stripeData?.checkout_url) {
          throw new Error(stripeData?.error || (isFr ? 'Erreur lors de la création du paiement Stripe' : 'Error creating Stripe payment'));
        }

        window.location.href = stripeData.checkout_url;
        return;
      }

      await openPayment({
        method: paymentMethod,
        email: data.email,
        amount: data.amount,
        currency: data.currency || creditCurrency,
        type: 'donation' as const,
        organization_id: 'platform',
        metadata: data.metadata,
        onSuccess: async (reference: string, gw) => {
          try {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-credit-purchase', {
              body: { reference, purchase_id: data.purchase_id, gateway: gw },
            });

            if (verifyErr || !verifyData?.ok) {
              toast.error(verifyData?.error || (isFr ? 'Erreur de vérification. Contactez le support.' : 'Verification error. Contact support.'));
              return;
            }

            toast.success(isFr ? `🎉 ${verifyData.credits} crédits ajoutés à votre compte !` : `🎉 ${verifyData.credits} credits added to your account!`);
            qc.invalidateQueries({ queryKey: ['credits'] });
          } catch (e) {
            toast.error(isFr ? 'Erreur lors de la vérification. Vos crédits seront ajoutés sous peu.' : 'Verification error. Your credits will be added shortly.');
          }
        },
        onClose: () => {
          toast.info(isFr ? 'Paiement annulé.' : 'Payment cancelled.');
        },
      });
    } catch (e: any) {
      toast.error(e.message || (isFr ? 'Erreur inattendue.' : 'Unexpected error.'));
    } finally {
      setPurchasing(null);
    }
  }, [user, openPayment, qc, paymentMethod, creditCurrency, isFr]);

  if (!user) return null;

  const dailyPercent = summary ? Math.min((summary.daily_remaining / DAILY_GRANT) * 100, 100) : 0;

  const txTypeLabel = (type: string): string => {
    const labels: Record<string, string> = isFr ? {
      consumption: 'Consommation',
      daily_grant: 'Crédits quotidiens',
      bonus_grant: 'Crédits bonus',
      purchase: 'Achat de crédits',
      expiration: 'Expiration',
      refund: 'Remboursement',
    } : {
      consumption: 'Consumption',
      daily_grant: 'Daily credits',
      bonus_grant: 'Bonus credits',
      purchase: 'Credit purchase',
      expiration: 'Expiration',
      refund: 'Refund',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-3 sm:px-4">
      {/* Header — soft aurora banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-primary/10 p-5 sm:p-7">
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Coins className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{isFr ? 'Mes Crédits IA' : 'My AI Credits'}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isFr
                ? `${DAILY_GRANT} crédits offerts chaque jour pour créer avec l'IA`
                : `${DAILY_GRANT} free credits every day to create with AI`}
            </p>
          </div>
        </div>
      </div>


      {/* Balance Cards */}
      {loadingSummary || !summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-24" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">{isFr ? 'Solde total' : 'Total balance'}</span>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {formatCredits(summary.balance)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatCredits(summary.lifetime_earned)} {isFr ? 'gagnés au total' : 'earned total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">{isFr ? 'Quotidiens' : 'Daily'}</span>
              </div>
              <p className="text-2xl font-bold">{formatCredits(summary.daily_remaining)}</p>
              <div className="mt-1.5 space-y-1">
                <Progress value={dailyPercent} className="h-1.5" />
                {summary.daily_expires_at && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {isFr ? 'Expire dans' : 'Expires in'} {timeUntil(summary.daily_expires_at, isFr)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Bonus</span>
              </div>
              <p className="text-2xl font-bold">{formatCredits(summary.bonus_remaining)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Cashback & récompenses' : 'Cashback & rewards'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">{isFr ? 'Achetés' : 'Purchased'}</span>
              </div>
              <p className="text-2xl font-bold">{formatCredits(summary.purchased_remaining)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                <Infinity className="h-2.5 w-2.5" /> {isFr ? "N'expire jamais" : 'Never expires'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How it works — mini banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              {isFr ? 'Comment ça marche ?' : 'How it works?'}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> {isFr ? `${DAILY_GRANT} crédits gratuits/jour` : `${DAILY_GRANT} free credits/day`}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> {isFr ? 'Quotidiens consommés en premier' : 'Daily credits consumed first'}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> {isFr ? 'Crédits achetés sans expiration' : 'Purchased credits never expire'}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> {isFr ? '1,5% cashback sur vos ventes' : '1.5% cashback on your sales'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What can you do with daily free credits */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            {isFr ? `Que pouvez-vous faire avec ${DAILY_GRANT} crédits gratuits/jour ?` : `What can you do with ${DAILY_GRANT} free credits/day?`}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {isFr ? 'Générer un livre complet (18 crédits)' : 'Generate a full book (18 credits)'}</div>
            <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {isFr ? 'Créer 2 couvertures de produit' : 'Create 2 product covers'}</div>
            <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {isFr ? 'Rédiger 15 descriptions de produit' : 'Write 15 product descriptions'}</div>
            <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {isFr ? 'Transcrire 4 fichiers audio/vidéo' : 'Transcribe 4 audio/video files'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packs" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> {isFr ? 'Acheter' : 'Buy'}</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> {isFr ? 'Historique' : 'History'}</TabsTrigger>
        </TabsList>

        {/* Packs Tab */}
        <TabsContent value="packs" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {isFr
              ? <>Besoin de plus de crédits ? Achetez un pack et créez sans limites. Les crédits achetés <strong>n'expirent jamais</strong>.</>
              : <>Need more credits? Buy a pack and create without limits. Purchased credits <strong>never expire</strong>.</>}
          </p>

          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            currency={creditCurrency}
            paystackEnabled={hasPaystackKey}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs?.map(pack => {
              const bonusCredits = Math.round(pack.credits * (pack.bonus_percent || 0) / 100);
              const totalCredits = pack.credits + bonusCredits;
              const isPurchasing = purchasing === pack.pack_key;

              return (
                <Card
                  key={pack.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    pack.is_popular ? 'border-primary ring-2 ring-primary/20 shadow-primary/10 shadow-md' : ''
                  }`}
                >
                  {pack.is_popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      {isFr ? 'POPULAIRE' : 'POPULAR'}
                    </div>
                  )}
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{pack.name}</h3>
                      <p className="text-3xl font-black mt-1">
                        {pack.price_xof.toLocaleString(numLoc)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">FCFA</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-lg">{totalCredits}</span>
                        <span className="text-sm text-muted-foreground">{isFr ? 'crédits' : 'credits'}</span>
                      </div>
                      {bonusCredits > 0 && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          🎁 +{bonusCredits} {isFr ? 'bonus inclus' : 'bonus included'} ({pack.bonus_percent}%)
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>≈ {Math.floor(totalCredits / 2.7)} {isFr ? 'chapitres de livre' : 'book chapters'}</p>
                      <p>≈ {Math.floor(totalCredits / 7.6)} {isFr ? 'couvertures IA' : 'AI covers'}</p>
                      <p>≈ {Math.floor(totalCredits / 5.8)} {isFr ? 'images / illustrations IA' : 'AI images / illustrations'}</p>
                      <p className="flex items-center gap-1"><Infinity className="h-3 w-3" /> {isFr ? "N'expire jamais" : 'Never expires'}</p>
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="sm"
                      disabled={isPurchasing}
                      onClick={() => handlePurchase(pack.pack_key)}
                    >
                      {isPurchasing ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {isFr ? 'Traitement...' : 'Processing...'}</>
                      ) : (
                        <>{isFr ? 'Acheter maintenant' : 'Buy now'} <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground py-2">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {isFr ? 'Paiement sécurisé' : 'Secure payment'}</span>
            <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Mobile Money & {isFr ? 'Carte' : 'Card'}</span>
            <span className="flex items-center gap-1"><Infinity className="h-3.5 w-3.5" /> {isFr ? 'Sans expiration' : 'No expiration'}</span>
            <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> {isFr ? 'Crédits instantanés' : 'Instant credits'}</span>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!history || history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">{isFr ? "Aucune transaction pour l'instant" : 'No transactions yet'}</p>
                  <p className="text-xs mt-1">{isFr ? 'Vos consommations et achats de crédits apparaîtront ici.' : 'Your credit usage and purchases will appear here.'}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((tx: any) => {
                    const isDebit = tx.tx_type === 'consumption';
                    const isExpiration = tx.tx_type === 'expiration';
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            isDebit || isExpiration ? 'bg-destructive/10' : 'bg-green-500/10'
                          }`}>
                            {isDebit || isExpiration
                              ? <TrendingDown className="h-4 w-4 text-destructive" />
                              : <TrendingUp className="h-4 w-4 text-green-500" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {tx.action_label || tx.action_key || txTypeLabel(tx.tx_type)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(tx.created_at), isFr ? 'dd MMM yyyy à HH:mm' : 'MMM dd, yyyy HH:mm', { locale: dateLoc })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className={`text-sm font-bold ${
                            isDebit || isExpiration ? 'text-destructive' : 'text-green-500'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {isFr ? 'Solde' : 'Balance'}: {formatCredits(tx.balance_after)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            {isFr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm">{isFr ? "C'est quoi les crédits IA ?" : 'What are AI credits?'}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {isFr
                  ? "Les crédits IA sont une monnaie interne qui vous permet d'utiliser nos fonctionnalités d'intelligence artificielle : génération de livres, création de couvertures, rédaction de descriptions, transcription audio/vidéo, et plus encore. Chaque action a un coût en crédits proportionnel à sa complexité."
                  : 'AI credits are an internal currency that lets you use our artificial intelligence features: book generation, cover creation, description writing, audio/video transcription, and more. Each action has a credit cost proportional to its complexity.'}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm">{isFr ? 'Comment obtenir des crédits gratuits ?' : 'How to get free credits?'}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {isFr
                  ? <>Vous recevez automatiquement <strong>{DAILY_GRANT} crédits gratuits chaque jour</strong> à votre première connexion. Ces crédits quotidiens expirent après 24h et sont consommés en priorité. Vous gagnez aussi des crédits bonus via le cashback de 1,5% sur vos ventes de produits.</>
                  : <>You automatically receive <strong>{DAILY_GRANT} free credits every day</strong> on your first login. These daily credits expire after 24h and are consumed first. You also earn bonus credits via 1.5% cashback on your product sales.</>}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm">{isFr ? 'Les crédits achetés expirent-ils ?' : 'Do purchased credits expire?'}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {isFr
                  ? <><strong>Non, jamais.</strong> Les crédits achetés n'ont pas de date d'expiration. Seuls les crédits quotidiens (24h) et les crédits bonus (7 jours) ont une durée limitée. L'ordre de consommation est : quotidiens → bonus → achetés.</>
                  : <><strong>No, never.</strong> Purchased credits have no expiration date. Only daily credits (24h) and bonus credits (7 days) have limited duration. Consumption order: daily → bonus → purchased.</>}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-sm">{isFr ? 'Quelle est la différence Standard / Premium ?' : 'What\'s the difference between Standard / Premium?'}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {isFr
                  ? <>Le mode <strong>Standard</strong> est rapide et économique, parfait pour la plupart des usages. Le mode <strong>Premium</strong> offre des résultats de meilleure qualité, idéal pour les contenus exigeants. Le mode Premium consomme environ 50-80% de crédits en plus.</>
                  : <>The <strong>Standard</strong> mode is fast and economical, perfect for most uses. The <strong>Premium</strong> mode offers higher quality results, ideal for demanding content. Premium mode consumes about 50-80% more credits.</>}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-sm">{isFr ? 'Comment payer pour des crédits ?' : 'How to pay for credits?'}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {isFr
                  ? <>Le paiement se fait via <strong>Mobile Money</strong> (Orange Money, MTN, Wave, etc.) ou <strong>carte bancaire</strong>. Les crédits sont ajoutés instantanément à votre solde après confirmation du paiement.</>
                  : <>Payment is made via <strong>Mobile Money</strong> (Orange Money, MTN, Wave, etc.) or <strong>bank card</strong>. Credits are instantly added to your balance after payment confirmation.</>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Low credits CTA */}
      {summary && summary.balance < 10 && (
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{isFr ? `Solde bas — ${formatCredits(summary.balance)} crédits restants` : `Low balance — ${formatCredits(summary.balance)} credits remaining`}</p>
                <p className="text-xs text-muted-foreground">{isFr ? 'Rechargez pour continuer à créer du contenu IA.' : 'Top up to continue creating AI content.'}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setSelectedTab('packs')} className="gap-1.5 shrink-0">
              {isFr ? 'Recharger' : 'Top up'} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
