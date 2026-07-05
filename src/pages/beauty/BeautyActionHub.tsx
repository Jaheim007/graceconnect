import { lazy, Suspense, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Calendar, MessageCircle, Sparkles, Scissors, LayoutDashboard,
  ArrowRight, Sun, Moon, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { GlobalPreferencesSelector } from "@/components/global/GlobalPreferencesSelector";
import { SiteLogo } from "@/components/ui/SiteLogo";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const BeautyLandingBody = lazy(() =>
  import("@/pages/beauty/BeautyLandingBody").then((m) => ({ default: m.BeautyLandingBody })),
);

/**
 * BeautyActionHub — Universe entry for /beauty.
 * Mirrors the Digital flow: action tiles on top ("what do you want to do?"),
 * marketing landing embedded below (scroll to learn more).
 */
export default function BeautyActionHub() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  // Is the current user already a beauty provider? Show "Espace pro" tile if so.
  const { data: isProvider } = useQuery({
    queryKey: ["beauty-is-provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("beauty_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    document.title = "SiteViral Beauty — Que veux-tu faire ?";
  }, []);

  const tiles = [
    {
      id: "explore",
      icon: Search,
      titleFr: "Explorer les pros",
      titleEn: "Explore pros",
      descFr: "Trouve ta prestation, filtre par ville, prix, note.",
      descEn: "Find your service, filter by city, price, rating.",
      route: "/beauty/search",
      accent: "hsl(340 82% 55%)",
    },
    {
      id: "bookings",
      icon: Calendar,
      titleFr: "Mes réservations",
      titleEn: "My bookings",
      descFr: "Suivre mes rendez-vous, annuler, confirmer.",
      descEn: "Track my appointments, cancel, confirm.",
      route: user ? "/beauty/bookings" : "/auth?returnTo=/beauty/bookings",
      accent: "hsl(28 88% 55%)",
    },
    {
      id: "messages",
      icon: MessageCircle,
      titleFr: "Messages",
      titleEn: "Messages",
      descFr: "Discute avec ta pro. Contact protégé.",
      descEn: "Chat with your pro. Contact protected.",
      route: user ? "/beauty/messages" : "/auth?returnTo=/beauty/messages",
      accent: "hsl(320 70% 60%)",
    },
    ...(isProvider
      ? [
          {
            id: "provider-space",
            icon: LayoutDashboard,
            titleFr: "Mon espace pro",
            titleEn: "My pro space",
            descFr: "Tableau de bord, agenda, revenus.",
            descEn: "Dashboard, calendar, revenue.",
            route: "/beauty/pro",
            accent: "hsl(45 90% 55%)",
          },
        ]
      : [
          {
            id: "become-pro",
            icon: Scissors,
            titleFr: "Devenir pro beauté",
            titleEn: "Become a beauty pro",
            descFr: "Publie tes services, remplis ton agenda, encaisse en Mobile Money.",
            descEn: "List your services, fill your calendar, get paid in Mobile Money.",
            route: user ? "/beauty/pro/onboarding" : "/auth?returnTo=/beauty/pro/onboarding",
            accent: "hsl(45 90% 55%)",
          },
        ]),
  ];

  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground">
      <SEOHead
        title="SiteViral Beauty — Que veux-tu faire ?"
        description="Réserve une pro beauté ou publie tes services. Paiement sécurisé, chat protégé, avis vérifiés."
        canonicalUrl="https://siteviral.com/beauty"
      />

      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <SiteLogo size="sm" animate linked={false} />
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight">SiteViral</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Beauty</div>
            </div>
          </Link>
          <div className="flex-1" />
          <GlobalPreferencesSelector />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button size="sm" className="h-8 text-xs beauty-gradient text-white hover:opacity-90" onClick={() => navigate("/beauty/search")}>
              {t("Réserver", "Book")}
            </Button>
          ) : (
            <Button size="sm" className="h-8 text-xs" onClick={() => navigate("/auth")}>
              {t("Se connecter", "Sign in")}
            </Button>
          )}
        </div>
      </header>

      {/* Action hub */}
      <section className="relative">
        <div className="absolute inset-0 beauty-soft opacity-60 -z-10" />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="mb-6 flex flex-col gap-1 text-center sm:mb-10">
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> SiteViral Beauty
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {t("Que veux-tu faire ?", "What do you want to do?")}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {t(
                "Réserve, discute, deviens pro. Un seul compte SiteViral.",
                "Book, chat, become a pro. One SiteViral account.",
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  onClick={() => navigate(tile.route)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 text-left",
                    "transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]",
                  )}
                >
                  <div
                    className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-40 transition group-hover:opacity-70"
                    style={{ background: tile.accent }}
                  />
                  <div className="relative flex items-start gap-4">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg"
                      style={{ background: tile.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{isFr ? tile.titleFr : tile.titleEn}</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {isFr ? tile.descFr : tile.descEn}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scroll cue to learn more */}
          <div className="mt-10 flex justify-center">
            <a
              href="#learn-more"
              className="group inline-flex flex-col items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
            >
              {t("Découvrir SiteViral Beauty", "Discover SiteViral Beauty")}
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Marketing landing below */}
      <div id="learn-more" className="border-t border-border/60">
        <Suspense fallback={<div className="h-64" />}>
          <BeautyLandingBody />
        </Suspense>
      </div>
    </div>
  );
}
