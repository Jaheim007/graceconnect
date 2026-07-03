import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, ShieldCheck, MessageCircle, Star, Scissors, Brush, Hand,
  Flower2, HeartHandshake, Clock, MapPin, ArrowRight, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { icon: Scissors, label: "Coiffure", tint: "from-rose-500/20 to-orange-400/20" },
  { icon: Hand, label: "Ongles", tint: "from-fuchsia-500/20 to-pink-400/20" },
  { icon: Brush, label: "Maquillage", tint: "from-amber-500/20 to-rose-400/20" },
  { icon: Flower2, label: "Soins visage", tint: "from-emerald-500/20 to-teal-400/20" },
  { icon: Sparkles, label: "Extensions & cils", tint: "from-violet-500/20 to-pink-400/20" },
  { icon: HeartHandshake, label: "Massage & spa", tint: "from-cyan-500/20 to-sky-400/20" },
];

const STEPS = [
  { icon: Sparkles, title: "Choisis ton service", body: "Parcours les pros vérifiées d’Abidjan et repère ta favorite en un scroll." },
  { icon: Wallet, title: "Réserve en confiance", body: "Paiement 100% sécurisé ou acompte 20% — les fonds sont bloqués jusqu’à la prestation." },
  { icon: MessageCircle, title: "Discute avec la pro", body: "Chat intégré, contacts protégés jusqu’à confirmation. Aucun no-show impuni." },
  { icon: Star, title: "Confirme & note", body: "Tu confirmes après le service, la pro est payée, tu laisses un avis (et un tip si tu veux)." },
];

const TRUST = [
  { icon: ShieldCheck, title: "Paiement sécurisé", body: "Fonds bloqués côté SiteViral jusqu’à la confirmation. Zéro arnaque." },
  { icon: Clock, title: "Zéro no-show", body: "Créneaux garantis par acompte, calendrier temps réel, rappels auto." },
  { icon: MapPin, title: "100% Abidjan", body: "Cocody, Marcory, Yopougon, Riviera… en salon ou à domicile." },
];

export default function BeautyLanding() {
  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground">
      <SeoHead />


      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/beauty" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl beauty-gradient text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight">SiteViral</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Beauty</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/beauty/search">Explorer</Link>
            </Button>
            <Button asChild size="sm" className="beauty-gradient text-white hover:opacity-90">
              <Link to="/beauty/pro/onboarding">Devenir pro <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 beauty-soft opacity-70" />
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full beauty-gradient opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/15">Nouveau · Beta Abidjan</Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            La beauté d’Abidjan,
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "var(--beauty-gradient)" }}>
              réservée en confiance.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Coiffure, ongles, maquillage, spa… Réserve tes prestations chez les meilleures pros de la ville. Paiement sécurisé, chat protégé, avis vérifiés.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="beauty-gradient text-white hover:opacity-90 beauty-shadow">
              <Link to="/beauty/search">
                Trouver ma pro <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/30 hover:bg-primary/5">
              <Link to="/beauty/pro/onboarding">Je suis une pro</Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              ["+2 000", "Pros pré-inscrites"],
              ["100%", "Paiement sécurisé"],
              ["24/7", "Support SiteViral"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur">
                <div className="text-2xl font-black tabular-nums">{k}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">Explore par catégorie</h2>
            <p className="text-sm text-muted-foreground">Ce que tu peux réserver dès maintenant.</p>
          </div>
          <Link to="/beauty/search" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, tint }) => (
            <Link
              key={label}
              to={`/beauty/search?cat=${encodeURIComponent(label)}`}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tint} opacity-60 transition group-hover:opacity-100`} />
              <div className="relative">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-background/80 text-primary backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-black sm:text-3xl">Comment ça marche</h2>
          <p className="mt-1 text-sm text-muted-foreground">4 étapes, zéro stress.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <Card key={title} className="relative overflow-hidden border-border/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl beauty-gradient text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-black text-muted-foreground/30 tabular-nums">0{i + 1}</span>
                </div>
                <div className="font-bold">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-bold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Provider CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl beauty-gradient p-8 text-white sm:p-12 beauty-shadow">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/25">Pour les pros</Badge>
              <h3 className="text-3xl font-black leading-tight sm:text-4xl">
                Remplis ton agenda. On s’occupe du reste.
              </h3>
              <p className="mt-3 max-w-md text-white/90">
                Encaissement Mobile Money, agenda auto, avis vérifiés, protection anti no-show.
                Commission plateforme : 10%. Paiement sous 72h.
              </p>
              <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
                <Link to="/beauty/pro/onboarding">Créer mon profil pro</Link>
              </Button>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "KYC & payouts SiteViral (déjà en place)",
                "Chat sécurisé, contacts masqués avant réservation",
                "Acompte 20% pour bloquer un créneau",
                "Notes et tips à la fin de chaque prestation",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SiteViral Beauty — Abidjan, Côte d’Ivoire.
        <span className="mx-2">·</span>
        <Link to="/" className="hover:text-foreground">Retour à SiteViral</Link>
      </footer>
    </div>
  );
}
