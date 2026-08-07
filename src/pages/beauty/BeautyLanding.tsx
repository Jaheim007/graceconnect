import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeautyLandingBody } from "./BeautyLandingBody";

/**
 * BeautyLanding — the marketing landing at /beauty/about.
 * The action-first entry lives at /beauty (BeautyActionHub).
 */
export default function BeautyLanding() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "SiteViral Beauty — La beauté d'Afrique, réservée en confiance";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    meta?.setAttribute(
      "content",
      "Marketplace beauté panafricaine. Coiffure, ongles, maquillage, spa. Paiement sécurisé, chat intégré, avis vérifiés. Démarrage Abidjan.",
    );
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/beauty" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl beauty-gradient text-white shadow-lg">
              
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
              <Link to="/beauty/pro/onboarding">Proposer mes services <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <BeautyLandingBody />
    </div>
  );
}
