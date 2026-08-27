import { useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Search, Calendar, GraduationCap, LayoutDashboard, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function EducationActionHub() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: isTutor } = useQuery({
    queryKey: ["education-is-tutor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("education_tutors").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    document.title = "SiteViral Learn — Que veux-tu faire ?";
    try { localStorage.setItem("sv_last_vertical", "learn"); } catch {}
  }, []);

  const actions = [
    { id: "explore", icon: Search, titleFr: "Trouver un prof", titleEn: "Find a tutor",
      descFr: "Maths, langues, code, musique…", descEn: "Math, languages, code, music…",
      route: "/learn/discover", iconBg: "bg-teal-100 dark:bg-teal-500/15", iconColor: "text-teal-600 dark:text-teal-400",
      borderClass: "hover:border-teal-300 dark:hover:border-teal-500/40" },
    { id: "bookings", icon: Calendar, titleFr: "Mes séances", titleEn: "My sessions",
      descFr: "Suis tes cours et paiements", descEn: "Track lessons and payments",
      route: "/learn/bookings", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400",
      borderClass: "hover:border-amber-300 dark:hover:border-amber-500/40" },
    ...(isTutor
      ? [{ id: "pro", icon: LayoutDashboard, titleFr: "Mon espace prof", titleEn: "My tutor space",
          descFr: "Agenda, revenus, matières", descEn: "Calendar, revenue, subjects",
          route: "/learn/pro", iconBg: "bg-cyan-100 dark:bg-cyan-500/15", iconColor: "text-cyan-600 dark:text-cyan-400",
          borderClass: "hover:border-cyan-300 dark:hover:border-cyan-500/40" }]
      : [{ id: "offer", icon: GraduationCap, titleFr: "Devenir prof", titleEn: "Become a tutor",
          descFr: "Enseigne et gagne en escrow", descEn: "Teach and earn with escrow",
          route: "/learn/pro/onboarding", iconBg: "bg-cyan-100 dark:bg-cyan-500/15", iconColor: "text-cyan-600 dark:text-cyan-400",
          borderClass: "hover:border-cyan-300 dark:hover:border-cyan-500/40" }]),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SEOHead title="SiteViral Learn — Trouve ton prof particulier"
        description="Cours particuliers vérifiés. Maths, langues, code, musique. Paiement sécurisé, avis vérifiés, chat protégé."
        canonicalUrl="https://siteviral.com/learn" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-black">SiteViral</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Learn</div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-6 pb-28 sm:pb-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-black leading-tight sm:text-2xl">
              {t("Apprendre. Grandir. En sécurité.", "Learn. Grow. Safely.")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("Discute, réserve, paie en escrow.", "Chat, book, pay via escrow.")}
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
            <button onClick={() => navigate("/learn/about")}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
              {t("En savoir plus sur SiteViral Learn", "Learn more about SiteViral Learn")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
