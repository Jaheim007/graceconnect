import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EDUCATION_CATEGORIES, educationCategoryLabel } from "@/lib/educationCategories";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";

export default function EducationDiscover() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") ?? "";
  const [q, setQ] = useState("");

  const { data: tutors, isLoading } = useQuery({
    queryKey: ["education-discover", activeCat],
    queryFn: async () => {
      const { data, error } = await supabase.from("education_tutors")
        .select("id, slug, display_name, headline, city, avatar_url, rating_avg, rating_count, hourly_rate_xof, is_verified, education_subjects(subject, level)")
        .eq("is_active", true)
        .order("rating_avg", { ascending: false })
        .limit(60);
      if (error) throw error;
      let list = data ?? [];
      if (activeCat) list = list.filter((t: any) => (t.education_subjects ?? []).some((s: any) => s.subject === activeCat));
      return list;
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return tutors ?? [];
    const s = q.toLowerCase();
    return (tutors ?? []).filter(
      (p: any) => p.display_name?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s),
    );
  }, [tutors, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title={isFr ? "Trouver un prof — SiteViral Education" : "Find a tutor — SiteViral Education"}
        description={isFr ? "Profs particuliers vérifiés près de toi." : "Verified private tutors near you."} />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/education" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Trouver un prof" : "Find a tutor"}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4 pb-28">
        <Input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={isFr ? "Nom, ville…" : "Name, city…"} className="h-10" />

        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            <button onClick={() => setParams({})} className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
              !activeCat ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card",
            )}>{isFr ? "Toutes" : "All"}</button>
            {EDUCATION_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setParams({ cat: c.id })}
                className={cn("shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  activeCat === c.id ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
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
            <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">
              {isFr ? "Aucun prof vérifié pour l'instant" : "No verified tutors yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isFr ? "Reviens bientôt — nous accueillons de nouveaux profs chaque jour."
                    : "Come back soon — we onboard new tutors daily."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p: any) => (
              <Link key={p.id} to={`/education/pro/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 font-bold">
                    {p.display_name?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{p.display_name}</div>
                  {p.headline && <div className="truncate text-[11px] text-muted-foreground">{p.headline}</div>}
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {p.city && (<><MapPin className="h-3 w-3" />{p.city}</>)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
                      <Star className="h-3 w-3 fill-current" />{Number(p.rating_avg).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">({p.rating_count})</span>
                    <span className="ml-auto font-bold text-teal-600">{Number(p.hourly_rate_xof).toLocaleString()} XOF/h</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(p.education_subjects ?? []).slice(0, 2).map((s: any) => (
                      <span key={s.subject} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        {educationCategoryLabel(s.subject, locale)}
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
