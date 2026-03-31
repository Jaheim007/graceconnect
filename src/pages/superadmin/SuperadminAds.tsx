import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Gift, Star, BarChart3, Globe, MousePointerClick, DollarSign, Eye } from 'lucide-react';

// ─── Ad Selections Tab ───
function AdSelectionsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['ad-selections'],
    queryFn: async () => {
      const [stars, gratuits, catalogue] = await Promise.all([
        db.from('digital_products')
          .select('id, title, price, currency, sales_count, cover_image_url, organizations(name, slug)')
          .eq('is_published', true).eq('is_express_demo', false).eq('is_free', false)
          .gt('sales_count', 0)
          .order('sales_count', { ascending: false }).limit(10),
        db.from('digital_products')
          .select('id, title, sales_count, cover_image_url, organizations(name, slug)')
          .eq('is_published', true).eq('is_express_demo', false).eq('is_free', true)
          .order('sales_count', { ascending: false }).limit(10),
        db.from('digital_products')
          .select('id, title, product_type, cover_image_url, organizations(name)')
          .eq('is_published', true).eq('is_express_demo', false)
          .order('featured_score', { ascending: false }).limit(20),
      ]);
      return { stars: stars.data || [], gratuits: gratuits.data || [], catalogue: catalogue.data || [] };
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const sections = [
    { title: '⭐ Produits Stars (Pub Conversion)', items: data?.stars, color: 'text-yellow-500', link: '/promo/stars' },
    { title: '🎁 Produits Gratuits (Pub Leads)', items: data?.gratuits, color: 'text-green-500', link: '/promo/gratuits' },
    { title: '📚 Catalogue (Pub Trafic)', items: data?.catalogue?.slice(0, 10), color: 'text-blue-500', link: '/promo/catalogue' },
    { title: '⚡ Créations Viral AI Studio', items: data?.catalogue?.filter((p: any) => p.ai_generated)?.slice(0, 10), color: 'text-purple-500', link: '/promo/ai-creations' },
  ];

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{section.title}</span>
              <Badge variant="outline" className="text-xs">{section.items?.length || 0} produits</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {section.items?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{(p as any).organizations?.name || '—'}</p>
                  </div>
                  {p.sales_count > 0 && (
                    <Badge variant="secondary" className="text-xs">{p.sales_count} ventes</Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Landing page: <code className="bg-muted px-1 rounded">{section.link}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-sm">📋 Textes Pub Suggérés</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Pub 1 — Catalogue Thématique</p>
            <p className="text-muted-foreground">
              "📚 Des centaines de ressources numériques classées par thème. Tech, Business, Spiritualité, Famille...
              Trouve exactement ce qu'il te faut → siteviral.com/promo/catalogue"
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Pub 2 — Gratuits</p>
            <p className="text-muted-foreground">
              "🎁 {data?.gratuits?.length || '+'} ressources GRATUITES à télécharger maintenant.
              Ebooks, guides, templates... Zéro CFA → siteviral.com/promo/gratuits"
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Pub 3 — Stars</p>
            <p className="text-muted-foreground">
              "⭐ Les produits les plus achetés sur SiteViral.
              {data?.stars?.[0] && ` "${data.stars[0].title}"`} et plus encore → siteviral.com/promo/stars"
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Pub 4 — Viral AI Studio</p>
            <p className="text-muted-foreground">
              "⚡ Tous ces livres ont été créés en quelques minutes avec notre IA.
              Toi aussi, crée le tien → siteviral.com/promo/ai-creations"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── UTM/ROI Dashboard Tab ───
function RoiDashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['utm-roi'],
    queryFn: async () => {
      const { data: events } = await db.from('client_events')
        .select('event_data, created_at')
        .eq('event_name', 'utm_landing')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!events || events.length === 0) return { campaigns: [], total: 0 };

      // Group by campaign
      const campaigns: Record<string, { source: string; medium: string; campaign: string; visits: number; firstSeen: string; lastSeen: string }> = {};
      for (const ev of events) {
        const d = ev.event_data as any;
        const key = `${d?.utm_source || '?'}|${d?.utm_medium || '?'}|${d?.utm_campaign || '?'}`;
        if (!campaigns[key]) {
          campaigns[key] = {
            source: d?.utm_source || '?',
            medium: d?.utm_medium || '?',
            campaign: d?.utm_campaign || '?',
            visits: 0,
            firstSeen: ev.created_at,
            lastSeen: ev.created_at,
          };
        }
        campaigns[key].visits++;
        if (ev.created_at < campaigns[key].firstSeen) campaigns[key].firstSeen = ev.created_at;
        if (ev.created_at > campaigns[key].lastSeen) campaigns[key].lastSeen = ev.created_at;
      }

      return {
        campaigns: Object.values(campaigns).sort((a, b) => b.visits - a.visits),
        total: events.length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <MousePointerClick className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{data?.total || 0}</p>
          <p className="text-xs text-muted-foreground">Total UTM Visits</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Globe className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{data?.campaigns?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Campaigns</p>
        </CardContent></Card>
      </div>

      {/* Campaign table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Campaigns UTM</CardTitle></CardHeader>
        <CardContent>
          {data?.campaigns && data.campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">Medium</th>
                    <th className="py-2 pr-3">Campaign</th>
                    <th className="py-2 pr-3 text-right">Visits</th>
                    <th className="py-2 text-right">Last</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{c.source}</Badge></td>
                      <td className="py-2 pr-3 text-muted-foreground">{c.medium}</td>
                      <td className="py-2 pr-3 font-medium">{c.campaign}</td>
                      <td className="py-2 pr-3 text-right font-mono">{c.visits}</td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {new Date(c.lastSeen).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune visite UTM enregistrée. Les visits seront trackées quand tes pubs amèneront du trafic avec des paramètres UTM
              (ex: ?utm_source=meta&utm_medium=paid&utm_campaign=stars_w1)
            </p>
          )}
        </CardContent>
      </Card>

      {/* UTM Guide */}
      <Card>
        <CardHeader><CardTitle className="text-sm">🔗 Générateur de liens UTM</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-muted-foreground">Ajoute ces paramètres à tes liens pub :</p>
          <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
            <p>Pub Catalogue: <span className="text-primary">siteviral.com/promo/catalogue?utm_source=meta&utm_medium=paid&utm_campaign=catalogue_w{'{N}'}</span></p>
            <p>Pub Gratuits: <span className="text-primary">siteviral.com/promo/gratuits?utm_source=meta&utm_medium=paid&utm_campaign=gratuits_w{'{N}'}</span></p>
            <p>Pub Stars: <span className="text-primary">siteviral.com/promo/stars?utm_source=meta&utm_medium=paid&utm_campaign=stars_w{'{N}'}</span></p>
            <p>Pub AI Studio: <span className="text-primary">siteviral.com/promo/ai-creations?utm_source=meta&utm_medium=paid&utm_campaign=ai_studio_w{'{N}'}</span></p>
            <p>Pub Créateurs: <span className="text-primary">siteviral.com/auth?utm_source=tiktok&utm_medium=paid&utm_campaign=creators_w{'{N}'}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">Remplace {'{N}'} par le numéro de semaine (ex: w1, w2…)</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───
export default function SuperadminAds() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Centre Publicité
        </h1>
        <p className="text-sm text-muted-foreground">Sélection automatique des produits, visuels et suivi ROI</p>
      </div>

      <Tabs defaultValue="selections">
        <TabsList>
          <TabsTrigger value="selections">📦 Sélections Pub</TabsTrigger>
          <TabsTrigger value="roi">📊 UTM & ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="selections" className="mt-4">
          <AdSelectionsTab />
        </TabsContent>
        <TabsContent value="roi" className="mt-4">
          <RoiDashboardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
