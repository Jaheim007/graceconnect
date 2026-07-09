import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, PartyPopper, Share2, User, Bell, Copy, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EventsProSettingsPane() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: provider } = useQuery({
    queryKey: ["events-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_providers")
        .select("id, business_name, slug, avatar_url, kyc_verified_at, currency")
        .eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const p = provider as any;
  const publicUrl = p?.slug ? `${window.location.origin}/events/pro/${p.slug}` : null;
  const kycDone = !!p?.kyc_verified_at;

  const copy = async () => {
    if (!publicUrl) return;
    try { await navigator.clipboard.writeText(publicUrl); toast.success(t("Lien copié", "Link copied")); }
    catch { toast.error(publicUrl); }
  };

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/events/pro" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Réglages", "Settings")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 lg:px-8 py-6 space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Réglages de mon activité", "My business settings")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Gère ce qui est visible et ce qui déclenche les paiements.", "Manage what clients see and what unlocks payouts.")}</p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600"><Share2 className="h-4 w-4" /></div>
            <div>
              <div className="text-sm font-bold">{t("Ma page publique", "My public page")}</div>
              <div className="text-xs text-muted-foreground">{t("Le lien à partager pour être trouvé & réservé.", "The link to share so clients can find & book you.")}</div>
            </div>
          </div>
          {publicUrl ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-2 pl-3">
              <span className="truncate text-xs">{publicUrl}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0" onClick={copy}><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => window.open(publicUrl, "_blank")}><ExternalLink className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("Termine l'onboarding pour générer ton lien.", "Finish onboarding to generate your link.")}</p>
          )}
        </section>

        <Row icon={<ShieldCheck className="h-4 w-4" />} iconBg="bg-amber-500/15 text-amber-600"
          title={t("Vérification d'identité (KYC)", "Identity verification (KYC)")}
          desc={kycDone ? t("Ton identité est vérifiée.", "Your identity is verified.") : t("Obligatoire pour recevoir des paiements.", "Required to receive payouts.")}
          cta={kycDone ? t("Voir", "View") : t("Faire le KYC", "Verify now")} to="/events/pro/kyc"
          badge={kycDone ? { label: t("Vérifié", "Verified"), cls: "bg-emerald-500/15 text-emerald-700" } : { label: t("Requis", "Required"), cls: "bg-amber-500/15 text-amber-700" }} />

        <Row icon={<PartyPopper className="h-4 w-4" />} iconBg="bg-fuchsia-500/15 text-fuchsia-600"
          title={t("Mes packages & tarifs", "My packages & pricing")}
          desc={t("Formules, prestations et prix.", "Packages, deliverables and prices.")}
          cta={t("Gérer", "Manage")} to="/events/pro/packages" />

        <Row icon={<User className="h-4 w-4" />} iconBg="bg-violet-500/15 text-violet-600"
          title={t("Profil & compte", "Profile & account")}
          desc={t("Nom, avatar, email de contact.", "Name, avatar, contact email.")}
          cta={t("Modifier", "Edit")} to="/profile" />

        <Row icon={<Bell className="h-4 w-4" />} iconBg="bg-sky-500/15 text-sky-600"
          title={t("Notifications", "Notifications")}
          desc={t("Choisis comment tu es averti des nouvelles demandes.", "Pick how you're notified of new requests.")}
          cta={t("Préférences", "Preferences")} to="/notification-preferences" />
      </div>
    </div>
  );
}

function Row({ icon, iconBg, title, desc, cta, to, badge }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">{title}</div>
          {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Button asChild variant="outline" size="sm"><Link to={to}>{cta}</Link></Button>
    </div>
  );
}
