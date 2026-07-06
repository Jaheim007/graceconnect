import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Wrench, LayoutDashboard, ArrowRight, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function HomeActionHub() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: isProvider } = useQuery({
    queryKey: ["home-is-provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("home_providers").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    document.title = "SiteViral Home — Que veux-tu faire ?";
    try { localStorage.setItem("sv_last_vertical", "home"); } catch {}
  }, []);

  const actions = [
    { id: "explore", icon: Search, titleFr: "Trouver un artisan", titleEn: "Find an artisan",
      descFr: "Plombier, électricien, ménage, déménagement", descEn: "Plumber, electrician, cleaning, movers",
      route: "/home/discover", iconBg: "bg-sky-100 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400",
      borderClass: "hover:border-sky-300 dark:hover:border-sky-500/40" },
    { id: "bookings", icon: Calendar, titleFr: "Mes demandes", titleEn: "My requests",
      descFr: "Suis et gère tes interventions", descEn: "Track and manage your jobs",
      route: "/home/bookings", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400",
      borderClass: "hover:border-amber-300 dark:hover:border-amber-500/40" },
    ...(isProvider
      ? [{ id: "pro", icon: LayoutDashboard, titleFr: "Mon espace pro", titleEn: "My pro space",
          descFr: "Agenda, revenus, services", descEn: "Calendar, revenue, services",
          route: "/home/pro", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400",
          borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40" }]
      : [{ id: "offer", icon: Wrench, titleFr: "Proposer mes services", titleEn: "Offer my services",
          descFr: "Crée ton compte pro et gagne de l'argent", descEn: "Create a pro account and earn",
          route: "/home/pro/onboarding", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400",
          borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40" }]),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SEOHead title="SiteViral Home — Trouve un pro près de toi"
        description="Plombiers, électriciens, ménage, déménagement, peinture. Paiement sécurisé, avis vérifiés, chat protégé."
        canonicalUrl="https://siteviral.com/home" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow">
            <HomeIcon className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-black">SiteViral</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Home</div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-6 pb-28 sm:pb-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-black leading-tight sm:text-2xl">
              {t("Un artisan chez toi, en 1 clic.", "An artisan at home, in 1 tap.")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("Discute, réserve, paie en sécurité.", "Chat, book, pay securely.")}
            </p>
          </div>
          <div className="space-y-2.5">
            {actions.map((a) => (
              <button key={a.id} onClick={() => navigate(a.route)}
                className={cn("group flex w-full items-center gap-3.5 rounded-2xl border bg-card p-4 text-left transition-all active:scale-[0.97] hover:-translate-y-0.5 hover:shadow-lg", a.borderClass)}>
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", a.iconBg)}>
                  <a.icon className={cn("h-5 w-5", a.iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{isFr ? a.titleFr : a.titleEn}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{isFr ? a.descFr : a.descEn}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </button>
            ))}
          </div>
          <div className="pt-1 text-center">
            <button onClick={() => navigate("/home/about")}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
              {t("En savoir plus sur SiteViral Home", "Learn more about SiteViral Home")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
