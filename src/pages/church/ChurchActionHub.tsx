import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HandHeart, Church as ChurchIcon, LayoutDashboard,
  ArrowRight, Sparkles, Info, Link2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { ChurchHeader } from "@/components/church/ChurchHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * ChurchActionHub — Church universe entry, styled identically to Digital and
 * Beauty ActionHubs: compact hero + vertical tile stack + "Learn more" footer
 * link pointing to /church/about (the marketing landing).
 */
export default function ChurchActionHub() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const displayName =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

  const { data: myChurch } = useQuery({
    queryKey: ["church-hub-owner", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("churches" as any)
        .select("id, slug, name")
        .eq("owner_user_id", user!.id)
        .maybeSingle();
      return (data as unknown as { id: string; slug: string; name: string } | null);
    },
  });

  useEffect(() => {
    document.title = t(
      "SiteViral Church — Que veux-tu faire ?",
      "SiteViral Church — What do you want to do?",
    );
    try { localStorage.setItem("sv_last_vertical", "church"); } catch {}
  }, [isFr]); // eslint-disable-line react-hooks/exhaustive-deps

  const actions = [
    {
      id: "discover",
      icon: Compass,
      titleFr: "Découvrir les églises",
      titleEn: "Discover churches",
      descFr: "Sermons, événements, communautés près de chez toi",
      descEn: "Sermons, events, communities near you",
      route: "/church/discover",
      iconBg: "bg-violet-100 dark:bg-violet-500/15",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderClass: "hover:border-violet-300 dark:hover:border-violet-500/40",
    },
    {
      id: "give",
      icon: HandHeart,
      titleFr: "Faire un don / dîme",
      titleEn: "Give / tithe",
      descFr: "Soutiens une église avec Mobile Money ou carte",
      descEn: "Support a church with Mobile Money or card",
      route: "/church/discover?intent=give",
      iconBg: "bg-amber-100 dark:bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderClass: "hover:border-amber-300 dark:hover:border-amber-500/40",
    },
    ...(myChurch
      ? [
          {
            id: "my-church",
            icon: LayoutDashboard,
            titleFr: "Mon espace pastoral",
            titleEn: "My pastoral space",
            descFr: "Prédications, dons, communauté, équipe",
            descEn: "Sermons, giving, community, team",
            route: "/church/pro",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
          },
        ]
      : [
          {
            id: "create-church",
            icon: ChurchIcon,
            titleFr: "Créer mon église",
            titleEn: "Create my church",
            descFr: "Reçois dîmes & offrandes, publie tes prédications",
            descEn: "Receive tithes & offerings, publish your sermons",
            route: "/church/pro/onboarding",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
          },
        ]),
    {
      id: "about",
      icon: Info,
      titleFr: "Comment ça marche",
      titleEn: "How it works",
      descFr: "Vision, tarifs, fonctionnalités SiteViral Church",
      descEn: "Vision, pricing, SiteViral Church features",
      route: "/church/about",
      iconBg: "bg-sky-100 dark:bg-sky-500/15",
      iconColor: "text-sky-600 dark:text-sky-400",
      borderClass: "hover:border-sky-300 dark:hover:border-sky-500/40",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SEOHead
        title="SiteViral Church — Que veux-tu faire ?"
        description="Découvre des églises, donne en Mobile Money ou gère la tienne : sermons, dîmes, communauté — tout en un."
        canonicalUrl="https://siteviral.com/church"
      />

      <ChurchHeader showBack={false} />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 pb-28 sm:pb-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md space-y-5"
        >
          {/* Compact hero */}
          <motion.div variants={item} className="space-y-1.5 text-center">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {t("Église connectée", "Connected church")}
            </div>
            <h1 className="text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">
              {user && displayName
                ? isFr
                  ? `Salut ${displayName} 👋`
                  : `Hey ${displayName} 👋`
                : t("Que veux-tu faire ?", "What do you want to do?")}
            </h1>
            <p className="mx-auto max-w-[280px] text-xs text-muted-foreground">
              {t(
                "Découvre, donne, gère ton église — tout en un seul endroit.",
                "Discover, give, run your church — all in one place.",
              )}
            </p>
          </motion.div>

          {/* Owner strip */}
          {myChurch && (
            <motion.button
              variants={item}
              onClick={() => navigate(`/church/${myChurch.slug}`)}
              className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg active:scale-[0.98] sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <ChurchIcon className="h-2.5 w-2.5" />
                  {t("Ton église publique", "Your public page")}
                </div>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-foreground">
                  {myChurch.name}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  siteviral.com/church/{myChurch.slug}
                </div>
              </div>
            </motion.button>
          )}

          {/* Action cards */}
          <div className="space-y-2.5">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                variants={item}
                onClick={() => navigate(action.route)}
                className={cn(
                  "group flex w-full items-center gap-3.5 rounded-2xl border bg-card p-3.5 text-left transition-all duration-150 sm:p-4",
                  "active:scale-[0.97] active:opacity-80",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5",
                  action.borderClass,
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
                    action.iconBg,
                  )}
                >
                  <action.icon className={cn("h-5 w-5", action.iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold leading-tight text-foreground sm:text-sm">
                    {isFr ? action.titleFr : action.titleEn}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                    {isFr ? action.descFr : action.descEn}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:text-foreground" />
              </motion.button>
            ))}
          </div>

          {/* Footer link */}
          <motion.div variants={item} className="pt-1 text-center">
            <button
              onClick={() => navigate("/church/about")}
              className="text-[10px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {t("En savoir plus sur SiteViral Church", "Learn more about SiteViral Church")}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
