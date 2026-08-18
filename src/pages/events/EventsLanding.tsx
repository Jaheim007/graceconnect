import { Link } from "react-router-dom";
import { PartyPopper, ArrowRight, ShieldCheck, MessageSquare, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENTS_CATEGORIES } from "@/lib/eventsCategories";
import { useI18n } from "@/i18n/I18nContext";
import { SEOHead } from "@/components/seo/SEOHead";

export default function EventsLanding() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={t("SiteViral Events — prestataires pour mariages et fêtes", "SiteViral Events — vendors for weddings and celebrations")}
        description={t(
          "Traiteurs, photographes, DJ, décorateurs et salles pour ton mariage ou ta fête. Devis clairs, acompte sécurisé, échanges protégés jusqu'au jour J.",
          "Caterers, photographers, DJs, decorators and venues for your wedding or party. Clear quotes, secure deposits and protected chat up to the big day.",
        )}
        canonicalUrl="https://siteviral.com/events/about"
        locale={isFr ? "fr_FR" : "en_US"}
      />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/events" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-lg">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black">SiteViral</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-400">Events</div>
            </div>
          </Link>
          <div className="hidden gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm"><Link to="/events/discover">{t("Explorer", "Explore")}</Link></Button>
            <Button asChild size="sm" className="bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white hover:opacity-90">
              <Link to="/events/pro/onboarding">{t("Proposer mes services", "Offer my services")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            {t("Ton événement. ", "Your event. ")}
            <span className="bg-gradient-to-r from-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
              {t("Sans stress.", "Zero stress.")}
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t(
              "Photographe, DJ, traiteur, décoration, salle — les meilleurs prestataires vérifiés pour ton mariage, anniversaire ou soirée. Acompte bloqué en sécurité jusqu'au jour J.",
              "Photographer, DJ, caterer, decorator, venue — the best verified vendors for your wedding, birthday or party. Deposit held safely until event day.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
              <Link to="/events/discover">{t("Trouver un prestataire", "Find a vendor")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/events/pro/onboarding">{t("Je suis prestataire", "I'm a vendor")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-6">
          {EVENTS_CATEGORIES.slice(0, 12).map((c) => (
            <Link key={c.id} to={`/events/discover?cat=${c.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-center">{isFr ? c.fr : c.en}</span>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: t("Prestataires vérifiés", "Verified vendors"), d: t("KYC obligatoire pour chaque prestataire", "KYC required for every vendor") },
            { icon: MessageSquare, t: t("Chat protégé", "Protected chat"), d: t("Filtres anti-arnaque en temps réel", "Real-time anti-scam filters") },
            { icon: Wallet, t: t("Acompte bloqué", "Deposit held safe"), d: t("Argent libéré à la fin de l'événement", "Money released after the event") },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-fuchsia-500" />
              <div className="mt-2 text-sm font-bold">{f.t}</div>
              <div className="text-xs text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
