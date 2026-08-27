import { useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import { ArrowLeft, MapPin, Star, Home as HomeIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HOME_CATEGORIES, homeCategoryLabel } from "@/lib/homeCategories";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";

export default function HomeDiscover() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") ?? "";
  const [q, setQ] = useState("");

  const { data: providers, isLoading } = useQuery({
    queryKey: ["home-discover", activeCat],
    queryFn: async () => {
      let query = supabase.from("home_providers")
        .select("id, slug, business_name, categories, city, avatar_url, rating_avg, rating_count, is_new")
        .eq("status", "active")
        .not("kyc_verified_at", "is", null)
        .order("rating_avg", { ascending: false })
        .limit(60);
      if (activeCat) query = query.contains("categories", [activeCat]);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return providers ?? [];
    const s = q.toLowerCase();
    return (providers ?? []).filter(
      (p: any) => p.business_name?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s),
    );
  }, [providers, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title={isFr ? "Trouver un artisan — SiteViral Home" : "Find an artisan — SiteViral Home"}
        description={isFr ? "Plombiers, électriciens, ménage, déménagement près de toi." : "Plumbers, electricians, cleaning, movers near you."} />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/home" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Trouver un artisan" : "Find an artisan"}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4 pb-28">
        <Input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={isFr ? "Nom, ville…" : "Name, city…"} className="h-10" />

        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            <button onClick={() => setParams({})} className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
              !activeCat ? "border-sky-500 bg-sky-500/10 text-sky-600" : "border-border bg-card",
            )}>{isFr ? "Tous" : "All"}</button>
            {HOME_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setParams({ cat: c.id })}
                className={cn("shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  activeCat === c.id ? "border-sky-500 bg-sky-500/10 text-sky-600" : "border-border bg-card")}>
                <c.icon className="h-3.5 w-3.5" />
                {isFr ? c.fr : c.en}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{isFr ? "Chargement…" : "Loading…"}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <HomeIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">
              {isFr ? "Aucun artisan vérifié pour le moment" : "No verified artisans yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isFr ? "Reviens bientôt — nous accueillons de nouveaux artisans chaque jour."
                    : "Come back soon — we onboard new artisans daily."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p: any) => (
              <Link key={p.id} to={`/home/pro/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 font-bold">
                    {p.business_name?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{p.business_name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {p.city && (<><MapPin className="h-3 w-3" />{p.city}</>)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
                      <Star className="h-3 w-3 fill-current" />{Number(p.rating_avg).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">({p.rating_count})</span>
                    {p.is_new && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">{isFr ? "Nouveau" : "New"}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(p.categories ?? []).slice(0, 2).map((c: string) => (
                      <span key={c} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        {homeCategoryLabel(c, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
