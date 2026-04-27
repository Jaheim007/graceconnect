import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Package } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";

interface TopCreator {
  organization_id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  sales_this_month: number;
  active_products: number;
}

export default function ShowcasePage() {
  const { locale } = useI18n();
  const lang = locale;
  const [creators, setCreators] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const isFr = lang === "fr";

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("showcase_top_creators" as any).select("*").limit(24);
      setCreators((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isFr ? "Top créateurs SiteViral du mois" : "Top SiteViral creators of the month",
    itemListElement: creators.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://siteviral.com/org/${c.slug}`,
      name: c.name,
    })),
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <SEOHead
        title={isFr ? "Top créateurs du mois — SiteViral" : "Top creators of the month — SiteViral"}
        description={isFr ? "Découvrez les créateurs SiteViral les plus performants ce mois-ci." : "Discover SiteViral's top-performing creators this month."}
        jsonLd={jsonLd}
      />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Trophy className="h-4 w-4" />
          {isFr ? "Hall of Fame" : "Hall of Fame"}
        </div>
        <h1 className="text-4xl font-bold">{isFr ? "Top créateurs du mois" : "Top creators of the month"}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isFr
            ? "Les créateurs SiteViral qui font vibrer la communauté. Mis à jour en temps réel."
            : "SiteViral creators who are making waves. Updated in real time."}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">{isFr ? "Chargement…" : "Loading…"}</div>
      ) : creators.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isFr ? "Aucun créateur ce mois-ci. Soyez le premier !" : "No creator yet this month. Be the first!"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((c, i) => (
            <Link key={c.organization_id} to={`/org/${c.slug}`}>
              <Card className="hover:border-primary/50 transition-all hover:shadow-lg group h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-full object-cover bg-muted" loading="lazy" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      {i < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{c.name}</h3>
                      {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />{c.sales_this_month} {isFr ? "ventes" : "sales"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />{c.active_products}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
