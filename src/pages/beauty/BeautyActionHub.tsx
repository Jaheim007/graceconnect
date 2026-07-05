import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Calendar, Scissors, LayoutDashboard,
  ArrowRight, Sparkles, Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { BeautyHeader } from "@/components/beauty/BeautyHeader";
import { BeautyPendingReviewNag } from "@/components/beauty/BeautyPendingReviewNag";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";


/**
 * BeautyActionHub — Beauty universe entry, styled identically to the Digital
 * ActionHub: compact hero + vertical tile stack + "Learn more" footer link
 * pointing to /beauty/about.
 */
export default function BeautyActionHub() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const displayName =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

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

  // Next upcoming appointment (confirmed or pending, slot_start in the future)
  const { data: nextBooking } = useQuery({
    queryKey: ["beauty-next-booking", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("beauty_bookings")
        .select(
          "id, status, slot_start, location_type, beauty_services(title), beauty_providers(business_name, avatar_url, city)",
        )
        .eq("client_id", user!.id)
        .in("status", ["pending_payment", "confirmed", "in_progress"])
        .gte("slot_start", nowIso)
        .order("slot_start", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    document.title = "SiteViral Beauty — Que veux-tu faire ?";
    // Remember the active vertical so post-login redirection lands back here.
    try { localStorage.setItem('sv_last_vertical', 'beauty'); } catch {}
  }, []);

  const goAuth = (returnTo: string) => {
    try { sessionStorage.setItem('sv_auth_returnTo', returnTo); } catch {}
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const actions = [
    {
      id: "explore",
      icon: Search,
      titleFr: "Explorer les services",
      titleEn: "Explore services",
      descFr: "Coiffure, ongles, maquillage, spa près de toi",
      descEn: "Hair, nails, makeup, spa near you",
      route: "/beauty/search",
      iconBg: "bg-rose-100 dark:bg-rose-500/15",
      iconColor: "text-rose-600 dark:text-rose-400",
      borderClass: "hover:border-rose-300 dark:hover:border-rose-500/40",
    },
    {
      id: "bookings",
      icon: Calendar,
      titleFr: "Prendre rendez-vous",
      titleEn: "Book an appointment",
      descFr: "Réserve, suis et gère tes prestations",
      descEn: "Book, track and manage your services",
      route: "/beauty/bookings",
      iconBg: "bg-amber-100 dark:bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderClass: "hover:border-amber-300 dark:hover:border-amber-500/40",
    },
    ...(isProvider
      ? [
          {
            id: "provider-space",
            icon: LayoutDashboard,
            titleFr: "Mon espace",
            titleEn: "My space",
            descFr: "Agenda, revenus, services",
            descEn: "Calendar, revenue, services",
            route: "/beauty/pro",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
          },
        ]
      : [
          {
            id: "offer-services",
            icon: Scissors,
            titleFr: "Proposer mes services",
            titleEn: "Offer my services",
            descFr: "Crée ton compte pour proposer tes services aux autres",
            descEn: "Create your account to offer your services to others",
            route: "/beauty/pro/onboarding",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            borderClass: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
          },
        ]),
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
    <div className="beauty-scope flex min-h-screen flex-col bg-background text-foreground">
      <SEOHead
        title="SiteViral Beauty — Que veux-tu faire ?"
        description="Réserve un expert beauté ou propose tes services. Paiement sécurisé, chat protégé, avis vérifiés."
        canonicalUrl="https://siteviral.com/beauty"
      />

      <BeautyHeader showBack={false} />
      <BeautyPendingReviewNag />

      {/* Main content — mirrors ActionHub */}
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
              {t("Beauté vérifiée", "Verified beauty")}
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
                "Réserve, discute, propose tes services — tout en un seul endroit.",
                "Book, chat, offer your services — all in one place.",
              )}
            </p>
          </motion.div>

          {/* Next appointment strip */}
          {nextBooking && (
            <motion.button
              variants={item}
              onClick={() => navigate(`/beauty/bookings/${nextBooking.id}`)}
              className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg active:scale-[0.98] sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Clock className="h-2.5 w-2.5" />
                  {t("Prochain rendez-vous", "Next appointment")}
                </div>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex items-center gap-3">
                {(nextBooking as any).beauty_providers?.avatar_url ? (
                  <img
                    src={(nextBooking as any).beauty_providers.avatar_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                    {((nextBooking as any).beauty_providers?.business_name ?? "?")[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-foreground">
                    {(nextBooking as any).beauty_services?.title ?? t("Service", "Service")}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {(nextBooking as any).beauty_providers?.business_name}
                    {(nextBooking as any).beauty_providers?.city
                      ? ` · ${(nextBooking as any).beauty_providers.city}`
                      : ""}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Calendar className="h-3 w-3" />
                    {new Date(nextBooking.slot_start).toLocaleString(isFr ? "fr-FR" : "en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
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
              onClick={() => navigate("/beauty/about")}
              className="text-[10px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {t("En savoir plus sur SiteViral Beauty", "Learn more about SiteViral Beauty")}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
