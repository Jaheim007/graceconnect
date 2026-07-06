import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, ShieldCheck, MessageSquare, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EDUCATION_CATEGORIES } from "@/lib/educationCategories";
import { useI18n } from "@/i18n/I18nContext";

export default function EducationLanding() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => { document.title = "SiteViral Education — Trouve ton prof"; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/learn" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black">SiteViral</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Education</div>
            </div>
          </Link>
          <div className="hidden gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm"><Link to="/learn/discover">{t("Explorer", "Explore")}</Link></Button>
            <Button asChild size="sm" className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90">
              <Link to="/learn/pro/onboarding">{t("Devenir prof", "Become a tutor")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            {t("Progresser. ", "Learn. ")}
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {t("Sans se ruiner.", "Without breaking the bank.")}
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t(
              "Cours particuliers de maths, langues, code, musique — en ligne ou à domicile. Paiement bloqué en escrow jusqu'à la fin de ta séance.",
              "One-on-one lessons in math, languages, coding, music — online or in-person. Payment held in escrow until your session ends.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
              <Link to="/learn/discover">{t("Trouver un prof", "Find a tutor")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/learn/pro/onboarding">{t("Je suis prof", "I'm a tutor")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-6">
          {EDUCATION_CATEGORIES.slice(0, 12).map((c) => (
            <Link key={c.id} to={`/learn/discover?cat=${c.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-center">{isFr ? c.fr : c.en}</span>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: t("Profs vérifiés", "Verified tutors"), d: t("KYC obligatoire pour tous les tuteurs", "KYC required for every tutor") },
            { icon: MessageSquare, t: t("Chat protégé", "Protected chat"), d: t("Filtres anti-arnaque en temps réel", "Real-time anti-scam filters") },
            { icon: Wallet, t: t("Escrow séance", "Escrow per session"), d: t("Argent libéré après ta séance", "Money released after your session") },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-teal-500" />
              <div className="mt-2 text-sm font-bold">{f.t}</div>
              <div className="text-xs text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
