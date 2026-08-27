import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Star, Filter, Scissors, Hand, Brush, Flower2, Zap, HeartHandshake, ShieldCheck, Home, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { BeautyHeader } from "@/components/beauty/BeautyHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "Coiffure", icon: Scissors, labelFr: "Coiffure", labelEn: "Hair" },
  { id: "Ongles", icon: Hand, labelFr: "Ongles", labelEn: "Nails" },
  { id: "Maquillage", icon: Brush, labelFr: "Maquillage", labelEn: "Makeup" },
  { id: "Soins visage", icon: Flower2, labelFr: "Soins visage", labelEn: "Facials" },
  { id: "Extensions & cils", icon: Zap, labelFr: "Extensions", labelEn: "Lashes" },
  { id: "Massage & spa", icon: HeartHandshake, labelFr: "Spa", labelEn: "Spa" },
];

type SortKey = "top" | "cheap" | "expensive" | "newest";

export default function BeautySearch() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const category = params.get("cat") ?? "";
  const city = params.get("city") ?? "";
  const q = params.get("q") ?? "";
  const location = params.get("loc") ?? ""; // home | salon | ""
  const [sort, setSort] = useState<SortKey>("top");

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    });
    setParams(p, { replace: true });
  };

  const { data: providers, isLoading } = useQuery({
    queryKey: ["beauty-search", { category, city, q, location, sort }],
    queryFn: async () => {
      // Fetch active providers with their cheapest active service
      let query = supabase
        .from("beauty_providers")
        .select(
          "id, business_name, slug, avatar_url, cover_url, city, home_service_ok, at_salon_ok, avg_rating, total_reviews, total_bookings, status",
        )
        .eq("status", "active")
        .limit(60);

      if (city) query = query.ilike("city", `%${city}%`);
      if (q) query = query.ilike("business_name", `%${q}%`);
      if (location === "home") query = query.eq("home_service_ok", true);
      if (location === "salon") query = query.eq("at_salon_ok", true);

      const { data: provRows, error } = await query;
      if (error) throw error;
      const provs = provRows ?? [];
      if (!provs.length) return [];

      const provIds = provs.map((p) => p.id);
      let svcQuery = supabase
        .from("beauty_services")
        .select("provider_id, category, title, price_amount, price_xof, currency, duration_min, active")
        .in("provider_id", provIds)
        .eq("active", true);
      if (category) svcQuery = svcQuery.eq("category", category);
      const { data: svcRows } = await svcQuery;
      const services = svcRows ?? [];

      // If a category filter is set, drop providers with no matching services
      const byProv = new Map<string, typeof services>();
      services.forEach((s) => {
        const arr = byProv.get(s.provider_id) ?? [];
        arr.push(s);
        byProv.set(s.provider_id, arr);
      });

      const merged = provs
        .filter((p) => (category ? byProv.has(p.id) : true))
        .map((p) => {
          const list = byProv.get(p.id) ?? [];
          const cheapest =
            list.length > 0
              ? list.reduce((min, s) =>
                  (s.price_amount ?? s.price_xof ?? Infinity) <
                  (min.price_amount ?? min.price_xof ?? Infinity)
                    ? s
                    : min,
                )
              : null;
          return { provider: p, cheapest, servicesCount: list.length };
        });

      // Sort
      switch (sort) {
        case "cheap":
          return [...merged].sort(
            (a, b) =>
              (a.cheapest?.price_amount ?? Infinity) - (b.cheapest?.price_amount ?? Infinity),
          );
        case "expensive":
          return [...merged].sort(
            (a, b) =>
              (b.cheapest?.price_amount ?? 0) - (a.cheapest?.price_amount ?? 0),
          );
        case "newest":
          return merged;
        case "top":
        default:
          return [...merged].sort(
            (a, b) =>
              Number(b.provider.avg_rating ?? 0) - Number(a.provider.avg_rating ?? 0),
          );
      }
    },
  });

  const activeCatLabel = useMemo(
    () => CATEGORIES.find((c) => c.id === category)?.[isFr ? "labelFr" : "labelEn"],
    [category, isFr],
  );

  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground pb-24">
      <SEOHead
        title={t("Explorer les services beauté — SiteViral", "Explore beauty services — SiteViral")}
        description={t(
          "Coiffure, ongles, maquillage, spa. Trouve un expert près de toi et réserve en quelques secondes.",
          "Hair, nails, makeup, spa. Find an expert near you and book in seconds.",
        )}
      />

      <BeautyHeader showBack />

      {/* Search bar */}
      <div className="sticky top-14 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => patch({ q: e.target.value || null })}
              placeholder={t("Nom d'un salon, artiste…", "Salon name, artist…")}
              className="h-9 pl-9"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          <button
            onClick={() => patch({ cat: null })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              !category
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {t("Toutes", "All")}
          </button>
          {CATEGORIES.map(({ id, icon: Icon, labelFr, labelEn }) => (
            <button
              key={id}
              onClick={() => patch({ cat: category === id ? null : id })}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                category === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {isFr ? labelFr : labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => patch({ city: e.target.value || null })}
            placeholder={t("Ville", "City")}
            className="h-8 w-36 pl-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant={location === "home" ? "default" : "outline"}
          onClick={() => patch({ loc: location === "home" ? null : "home" })}
          className="h-8 gap-1.5 text-xs"
        >
          <Home className="h-3.5 w-3.5" /> {t("À domicile", "At home")}
        </Button>
        <Button
          size="sm"
          variant={location === "salon" ? "default" : "outline"}
          onClick={() => patch({ loc: location === "salon" ? null : "salon" })}
          className="h-8 gap-1.5 text-xs"
        >
          <Store className="h-3.5 w-3.5" /> {t("En salon", "At salon")}
        </Button>
        <div className="flex-1" />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <Filter className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">{t("Mieux notées", "Top rated")}</SelectItem>
            <SelectItem value="cheap">{t("Prix croissant", "Cheapest")}</SelectItem>
            <SelectItem value="expensive">{t("Prix décroissant", "Most expensive")}</SelectItem>
            <SelectItem value="newest">{t("Récents", "Newest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <main className="mx-auto max-w-6xl px-4">
        {activeCatLabel && (
          <div className="mb-3 text-sm text-muted-foreground">
            {t("Catégorie", "Category")}: <span className="font-semibold text-foreground">{activeCatLabel}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : !providers?.length ? (
          <EmptyState isFr={isFr} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map(({ provider, cheapest, servicesCount }) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                cheapest={cheapest}
                servicesCount={servicesCount}
                isFr={isFr}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProviderCard({
  provider,
  cheapest,
  servicesCount,
  isFr,
}: {
  provider: any;
  cheapest: any | null;
  servicesCount: number;
  isFr: boolean;
}) {
  const priceLabel = cheapest
    ? formatCurrency(
        cheapest.price_amount ?? cheapest.price_xof,
        (cheapest.currency ?? "XOF") as any,
      )
    : null;

  return (
    <Link
      to={`/beauty/p/${provider.slug ?? provider.id}`}
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative h-32 overflow-hidden">
        {provider.cover_url ? (
          <img
            src={provider.cover_url}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full beauty-gradient opacity-60" />
        )}
        {provider.city && (
          <Badge className="absolute right-2 top-2 bg-background/80 text-foreground backdrop-blur">
            <MapPin className="mr-1 h-3 w-3" /> {provider.city}
          </Badge>
        )}
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="relative -mt-8 h-14 w-14 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted">
          {provider.avatar_url ? (
            <img src={provider.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-black text-muted-foreground">
              {(provider.business_name ?? "?")[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-bold">{provider.business_name}</div>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-foreground">
                {Number(provider.avg_rating ?? 0).toFixed(1)}
              </span>
              <span>({provider.total_reviews ?? 0})</span>
            </span>
            <span>·</span>
            <span>{servicesCount} {isFr ? "services" : "services"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
        <div className="text-xs text-muted-foreground">
          {isFr ? "À partir de" : "From"}
        </div>
        <div className="text-sm font-black">{priceLabel ?? "—"}</div>
      </div>
    </Link>
  );
}

function EmptyState({ isFr }: { isFr: boolean }) {
  return (
    <Card className="border-dashed p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Search className="h-5 w-5" />
      </div>
      <div className="font-bold">
        {isFr ? "Aucun expert pour ces critères." : "No experts for these filters."}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isFr
          ? "Essaie d'élargir la ville ou de retirer un filtre."
          : "Try widening the city or removing a filter."}
      </p>
    </Card>
  );
}
