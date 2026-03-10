import { useState } from 'react';
import { Coins, Zap, Gift, ShoppingBag, Clock, TrendingUp, TrendingDown, ArrowRight, Sparkles, Star, History } from 'lucide-react';
import { useCreditsBalance, useActionPricing, useCreditPacks, useCreditHistory, useGrantDailyCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


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

const categoryLabels: Record<string, string> = {
  studio: '📚 Studio IA',
  product: '🛍️ Produits',
  media: '🎬 Média',
  content: '✍️ Contenu',
};

export default function CreditsPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useCreditsBalance();
  const { data: pricing } = useActionPricing();
  const { data: packs } = useCreditPacks();
  const { data: history } = useCreditHistory(50);
  const grantDaily = useGrantDailyCredits();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user) return null;

  const dailyPercent = summary ? (summary.daily_remaining / 38.5) * 100 : 0;

  // Group pricing by category
  const pricingByCategory = pricing?.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof pricing>) || {};

  return (
    <>
      <title>Mes Crédits IA | Siteviral</title>

      <div className="max-w-5xl mx-auto space-y-6 py-4 px-2 sm:px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mes Crédits IA</h1>
            <p className="text-sm text-muted-foreground">Gérez vos crédits pour les fonctionnalités IA</p>
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">Achetés</span>
                </div>
                <p className="text-2xl font-bold">{formatCredits(summary.purchased_remaining)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Tarifs</TabsTrigger>
            <TabsTrigger value="packs" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Acheter</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Historique</TabsTrigger>
          </TabsList>

          {/* Pricing Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Chaque action IA consomme des crédits. Vous recevez <strong>38,5 crédits gratuits</strong> chaque jour.
            </div>
            {Object.entries(pricingByCategory).map(([cat, actions]) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{categoryLabels[cat] || cat}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {actions!.map(a => (
                      <div key={a.action_key} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div>
                          <span className="font-medium">{a.action_label}</span>
                          {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 text-xs shrink-0">
                          <span className="font-mono font-semibold">{a.cost_standard}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-mono text-purple-500 font-semibold flex items-center gap-0.5">
                            <Star className="h-3 w-3" />{a.cost_premium}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              Standard = Gemini (rapide) · <Star className="h-3 w-3 inline text-purple-500" /> Premium = OpenAI (meilleure qualité)
            </p>
          </TabsContent>

          {/* Packs Tab */}
          <TabsContent value="packs" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packs?.map(pack => (
                <Card
                  key={pack.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    pack.is_popular ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                >
                  {pack.is_popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                      POPULAIRE
                    </div>
                  )}
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{pack.name}</h3>
                      <p className="text-3xl font-black mt-1">
                        {pack.price_xof.toLocaleString('fr-FR')} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-lg">{pack.credits}</span>
                      <span className="text-sm text-muted-foreground">crédits</span>
                      {pack.bonus_percent > 0 && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                          +{pack.bonus_percent}% bonus
                        </Badge>
                      )}
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      ≈ {Math.floor(pack.credits / 2.7)} chapitres · {Math.floor(pack.credits / 7.5)} couvertures · N'expire jamais
                    </p>
                    <Button className="w-full gap-2" size="sm">
                      Acheter <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Paiement sécurisé via Mobile Money ou carte bancaire. Les crédits achetés n'expirent jamais.
            </p>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {!history || history.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune transaction pour l'instant</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {history.map((tx: any) => {
                      const isDebit = tx.tx_type === 'consume';
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              isDebit ? 'bg-red-500/10' : 'bg-green-500/10'
                            }`}>
                              {isDebit
                                ? <TrendingDown className="h-4 w-4 text-red-500" />
                                : <TrendingUp className="h-4 w-4 text-green-500" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.action_label || tx.action_key || tx.tx_type}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isDebit ? 'text-red-500' : 'text-green-500'}`}>
                              {isDebit ? '-' : '+'}{formatCredits(Math.abs(tx.amount))}
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

        {/* Daily credits CTA */}
        {summary && summary.daily_remaining <= 5 && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-500" />
                <p className="text-sm">Crédits quotidiens bientôt épuisés ? Achetez un pack pour continuer.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedTab('packs')}>
                Voir les packs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
