import { Link, useNavigate } from "react-router-dom";
import { Calendar, MessageSquare, Package, ShieldCheck, TrendingUp, PartyPopper } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function EventsProDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => {
    if (!user) navigate("/auth?returnTo=/events/pro");
  }, [user, navigate]);

  const { data: provider } = useQuery({
    queryKey: ["events-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_providers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["events-provider-stats", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase.from("events_provider_stats").select("*").eq("provider_id", provider!.id).maybeSingle();
      return data;
    },
  });

  if (!provider) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;

  const kycDone = !!provider.kyc_verified_at;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
            <PartyPopper className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{provider.business_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace prestataire Events", "Events vendor space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        {!kycDone && (
          <Link to="/events/pro/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <div className="flex-1 text-sm">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  {t("Vérification d'identité requise", "Identity verification required")}
                </div>
                <div className="text-xs text-amber-800/80 dark:text-amber-200/80">
                  {t("Complète le KYC pour apparaître dans la recherche.", "Complete KYC to appear in search.")}
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Événements terminés", "Events done")}</div>
            <div className="mt-1 text-2xl font-black">{stats?.events_completed ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Revenu 30j", "30d revenue")}</div>
            <div className="mt-1 text-2xl font-black">{Number(stats?.revenue_30d ?? 0).toLocaleString()} <span className="text-xs text-muted-foreground">{provider.currency}</span></div>
          </div>
        </div>

        <div className="grid gap-2.5">
          {[
            { icon: MessageSquare, label: t("Messages", "Messages"), to: "/events/messages" },
            { icon: Calendar, label: t("Mes événements", "My events"), to: "/events/bookings" },
            { icon: Package, label: t("Mes packages", "My packages"), to: "/events/pro/packages" },
            { icon: TrendingUp, label: t("Revenus & paiements", "Revenue & payouts"), to: "/events/pro/revenue" },
          ].map((a) => (
            <Button key={a.to} asChild variant="outline" className="h-14 justify-start">
              <Link to={a.to}><a.icon className="mr-3 h-4 w-4" />{a.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
