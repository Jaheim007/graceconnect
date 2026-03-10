import { useState, useCallback, useEffect } from 'react';
import {
  Coins, Zap, Gift, ShoppingBag, Clock, TrendingUp, TrendingDown,
  ArrowRight, Sparkles, Star, History, BookOpen, Image, Mic, FileText,
  HelpCircle, CheckCircle, Loader2, Shield, Infinity, RefreshCw
} from 'lucide-react';
import { useCreditsBalance, useActionPricing, useCreditPacks, useCreditHistory, useGrantDailyCredits } from '@/hooks/useCredits';
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
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function formatCredits(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

function timeUntil(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'expiré';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
  return `${mins}m`;
}

const categoryLabels: Record<string, { label: string; icon: typeof Coins }> = {
  studio: { label: 'Studio IA — Création de livres', icon: BookOpen },
  product: { label: 'Produits — Marketing & vente', icon: ShoppingBag },
  media: { label: 'Média — Transcription & audio', icon: Mic },
  content: { label: 'Contenu — Rédaction IA', icon: FileText },
};

const categoryIcons: Record<string, typeof Coins> = {
  studio: BookOpen,
  product: ShoppingBag,
  media: Mic,
  content: FileText,
};

export default function CreditsPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useCreditsBalance();
  const { data: pricing } = useActionPricing();
  const { data: packs } = useCreditPacks();
  const { data: history } = useCreditHistory(50);
  const grantDaily = useGrantDailyCredits();
  const { openPayment, hasPaystackKey } = usePaymentGateway();
  const qc = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Credit packs are priced in XOF
  const creditCurrency = 'XOF';
  const defaultMethod: PaymentMethod = isMoMoAvailable(creditCurrency) ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);

  useEffect(() => {
    setPaymentMethod(defaultMethod);
  }, [defaultMethod]);

  const handlePurchase = useCallback(async (packKey: string) => {
    if (!user?.email) {
      toast.error('Veuillez vous connecter pour acheter des crédits.');
      return;
    }

    setPurchasing(packKey);
    try {
      // 1. Create pending purchase on backend
      const gateway = paymentMethod === 'mobile_money' || paymentMethod === 'apple_pay' ? 'paystack' : 'stripe';
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { pack_key: packKey, payment_gateway: gateway },
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Erreur lors de la création de l\'achat');
      }

      // 2. Open unified payment gateway
      await openPayment({
        method: paymentMethod,
        email: data.email,
        amount: data.amount,
        currency: data.currency || creditCurrency,
        type: 'donation' as const, // credit purchase uses simple flow
        organization_id: 'platform', // platform-level purchase
        metadata: data.metadata,
        onSuccess: async (reference: string, gw) => {
          // 3. Verify payment and grant credits
          try {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-credit-purchase', {
              body: { reference, purchase_id: data.purchase_id, gateway: gw },
            });

            if (verifyErr || !verifyData?.ok) {
              toast.error(verifyData?.error || 'Erreur de vérification. Contactez le support.');
              return;
            }

            toast.success(`🎉 ${verifyData.credits} crédits ajoutés à votre compte !`);
            qc.invalidateQueries({ queryKey: ['credits'] });
          } catch (e) {
            toast.error('Erreur lors de la vérification. Vos crédits seront ajoutés sous peu.');
          }
        },
        onClose: () => {
          toast.info('Paiement annulé.');
        },
      });
    } catch (e: any) {
      toast.error(e.message || 'Erreur inattendue.');
    } finally {
      setPurchasing(null);
    }
  }, [user, openPayment, qc, paymentMethod, creditCurrency]);

  if (!user) return null;

  const dailyPercent = summary ? Math.min((summary.daily_remaining / 38.5) * 100, 100) : 0;

  // Group pricing by category
  const pricingByCategory = pricing?.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof pricing>) || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mes Crédits IA</h1>
            <p className="text-sm text-muted-foreground">Utilisez l'IA pour créer du contenu exceptionnel</p>
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
                <span className="text-xs font-medium text-muted-foreground">Solde total</span>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {formatCredits(summary.balance)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatCredits(summary.lifetime_earned)} gagnés au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Quotidiens</span>
              </div>
              <p className="text-2xl font-bold">{formatCredits(summary.daily_remaining)}</p>
              <div className="mt-1.5 space-y-1">
                <Progress value={dailyPercent} className="h-1.5" />
                {summary.daily_expires_at && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> Expire dans {timeUntil(summary.daily_expires_at)}
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
              <p className="text-[10px] text-muted-foreground mt-1">Cashback & récompenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Achetés</span>
              </div>
              <p className="text-2xl font-bold">{formatCredits(summary.purchased_remaining)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                <Infinity className="h-2.5 w-2.5" /> N'expire jamais
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
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              Comment ça marche ?
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> 38,5 crédits gratuits/jour</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Quotidiens consommés en premier</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Crédits achetés sans expiration</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> 1,5% cashback sur vos ventes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Tarifs</TabsTrigger>
          <TabsTrigger value="packs" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Acheter</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Historique</TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Chaque action IA consomme un nombre de crédits dépendant de sa complexité. 
            Le mode <strong>Standard</strong> utilise Gemini (rapide et économique), 
            le mode <Star className="h-3 w-3 inline text-purple-500 mx-0.5" /><strong>Premium</strong> utilise OpenAI (meilleure qualité).
          </p>

          {Object.entries(pricingByCategory).map(([cat, actions]) => {
            const catInfo = categoryLabels[cat];
            const CatIcon = categoryIcons[cat] || Coins;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CatIcon className="h-4 w-4 text-primary" />
                    {catInfo?.label || cat}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/30">
                      <span>Action</span>
                      <div className="flex items-center gap-6">
                        <span>Standard</span>
                        <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> Premium</span>
                      </div>
                    </div>
                    {actions!.map(a => (
                      <div key={a.action_key} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/20 transition-colors">
                        <div className="min-w-0 mr-4">
                          <span className="font-medium">{a.action_label}</span>
                          {a.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>}
                        </div>
                        <div className="flex items-center gap-6 text-xs shrink-0">
                          <span className="font-mono font-semibold w-8 text-right">{a.cost_standard}</span>
                          <span className="font-mono text-purple-500 font-semibold w-8 text-right">{a.cost_premium}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* What can you do with daily credits */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Que pouvez-vous faire avec 38,5 crédits gratuits/jour ?
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> Générer un livre complet (8 chapitres)</div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> Créer 5 couvertures de produit</div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> Rédiger 21 descriptions de produit</div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> Transcrire 8 fichiers audio/vidéo</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packs Tab */}
        <TabsContent value="packs" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Besoin de plus de crédits ? Achetez un pack et créez sans limites. 
            Les crédits achetés <strong>n'expirent jamais</strong>.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs?.map(pack => {
              const bonusCredits = Math.round(pack.credits * (pack.bonus_percent || 0) / 100);
              const totalCredits = pack.credits + bonusCredits;
              const pricePerCredit = (pack.price_xof / totalCredits).toFixed(0);
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
                      ⭐ POPULAIRE
                    </div>
                  )}
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{pack.name}</h3>
                      <p className="text-3xl font-black mt-1">
                        {pack.price_xof.toLocaleString('fr-FR')}
                        <span className="text-sm font-normal text-muted-foreground ml-1">FCFA</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-lg">{totalCredits}</span>
                        <span className="text-sm text-muted-foreground">crédits</span>
                      </div>
                      {bonusCredits > 0 && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          🎁 +{bonusCredits} bonus inclus ({pack.bonus_percent}%)
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>≈ {Math.floor(totalCredits / 2.7)} chapitres de livre</p>
                      <p>≈ {Math.floor(totalCredits / 7.5)} couvertures IA</p>
                      <p className="flex items-center gap-1"><Infinity className="h-3 w-3" /> N'expire jamais</p>
                      <p className="text-[10px]">{pricePerCredit} FCFA / crédit</p>
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="sm"
                      disabled={isPurchasing}
                      onClick={() => handlePurchase(pack.pack_key)}
                    >
                      {isPurchasing ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Traitement...</>
                      ) : (
                        <>Acheter maintenant <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground py-2">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Paiement sécurisé</span>
            <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Mobile Money & Carte</span>
            <span className="flex items-center gap-1"><Infinity className="h-3.5 w-3.5" /> Sans expiration</span>
            <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Crédits instantanés</span>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!history || history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Aucune transaction pour l'instant</p>
                  <p className="text-xs mt-1">Vos consommations et achats de crédits apparaîtront ici.</p>
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
                              {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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
                            Solde: {formatCredits(tx.balance_after)}
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
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm">C'est quoi les crédits IA ?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Les crédits IA sont une monnaie interne qui vous permet d'utiliser nos fonctionnalités d'intelligence artificielle : 
                génération de livres, création de couvertures, rédaction de descriptions, transcription audio/vidéo, et plus encore. 
                Chaque action a un coût en crédits proportionnel à sa complexité.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm">Comment obtenir des crédits gratuits ?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Vous recevez automatiquement <strong>38,5 crédits gratuits chaque jour</strong> à votre première connexion. 
                Ces crédits quotidiens expirent après 24h et sont consommés en priorité. 
                Vous gagnez aussi des crédits bonus via le cashback de 1,5% sur vos ventes de produits.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm">Les crédits achetés expirent-ils ?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <strong>Non, jamais.</strong> Les crédits achetés n'ont pas de date d'expiration. Seuls les crédits 
                quotidiens (24h) et les crédits bonus (7 jours) ont une durée limitée. L'ordre de consommation est : 
                quotidiens → bonus → achetés.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-sm">Quelle est la différence Standard / Premium ?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Le mode <strong>Standard</strong> utilise Google Gemini : rapide et économique, parfait pour la plupart des usages. 
                Le mode <strong>Premium</strong> utilise OpenAI : résultats de meilleure qualité, idéal pour les contenus exigeants. 
                Le mode Premium coûte environ 50-80% de crédits en plus.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-sm">Comment payer pour des crédits ?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Le paiement se fait via <strong>Mobile Money</strong> (Orange Money, MTN, Wave, etc.) ou <strong>carte bancaire</strong>. 
                Les crédits sont ajoutés instantanément à votre solde après confirmation du paiement.
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
                <p className="text-sm font-medium">Solde bas — {formatCredits(summary.balance)} crédits restants</p>
                <p className="text-xs text-muted-foreground">Rechargez pour continuer à créer du contenu IA.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setSelectedTab('packs')} className="gap-1.5 shrink-0">
              Recharger <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function txTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    consumption: 'Consommation',
    daily_grant: 'Crédits quotidiens',
    bonus_grant: 'Crédits bonus',
    purchase: 'Achat de crédits',
    expiration: 'Expiration',
    refund: 'Remboursement',
  };
  return labels[type] || type;
}
