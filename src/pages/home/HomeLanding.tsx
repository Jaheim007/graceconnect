import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home as HomeIcon, ArrowRight, ShieldCheck, MessageSquare, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOME_CATEGORIES } from "@/lib/homeCategories";
import { useI18n } from "@/i18n/I18nContext";

export default function HomeLanding() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => {
    document.title = "SiteViral Home — Le pro qu'il te faut, à la maison";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg">
              <HomeIcon className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black">SiteViral</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Home</div>
            </div>
          </Link>
          <div className="hidden gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm"><Link to="/home/discover">{t("Explorer", "Explore")}</Link></Button>
            <Button asChild size="sm" className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white hover:opacity-90">
              <Link to="/home/pro/onboarding">{t("Proposer mes services", "Offer my services")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            {t("Le pro qu'il te faut. ", "The pro you need. ")}
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              {t("Chez toi.", "At home.")}
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t(
              "Plombier, électricien, ménage, déménagement, peinture — les meilleurs pros vérifiés près de toi. Paiement bloqué en sécurité jusqu'à la fin du travail.",
              "Plumber, electrician, cleaner, movers, painter — the best verified pros near you. Payment held safe until the job is done.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
              <Link to="/home/discover">{t("Trouver un pro", "Find a pro")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/home/pro/onboarding">{t("Je suis un pro", "I'm a pro")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {HOME_CATEGORIES.slice(0, 10).map((c) => (
            <Link key={c.id} to={`/home/discover?cat=${c.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-center">{isFr ? c.fr : c.en}</span>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: t("Pros vérifiés", "Verified pros"), d: t("KYC obligatoire pour tous les pros", "KYC required for every pro") },
            { icon: MessageSquare, t: t("Chat protégé", "Protected chat"), d: t("Filtres anti-arnaque en temps réel", "Real-time anti-scam filters") },
            { icon: Wallet, t: t("Paiement bloqué", "Escrow payment"), d: t("Argent libéré à la fin du travail", "Money released when job is done") },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-sky-500" />
              <div className="mt-2 text-sm font-bold">{f.t}</div>
              <div className="text-xs text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
