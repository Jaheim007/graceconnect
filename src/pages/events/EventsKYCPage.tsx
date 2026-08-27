import { Link } from "@/lib/router-compat";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function EventsKYCPage() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/dashboard" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Vérification d'identité" : "Identity verification"}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-600">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-black">{isFr ? "KYC bientôt disponible" : "KYC coming soon"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isFr
            ? "La vérification d'identité pour SiteViral Events arrive dans la prochaine phase. En attendant, tu peux finaliser ton profil et tes packages."
            : "Identity verification for SiteViral Events ships in the next phase. Meanwhile, you can finish your profile and packages."}
        </p>
        <Button asChild className="mt-6 bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
          <Link to="/dashboard">{isFr ? "Retour au tableau de bord" : "Back to dashboard"}</Link>
        </Button>
      </div>
    </div>
  );
}
