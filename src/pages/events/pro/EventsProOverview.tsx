import { Link } from "@/lib/router-compat";
import { Calendar, MessageSquare, ShieldCheck, PartyPopper, AlertCircle, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function EventsProOverview() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["events-provider-me-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_providers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["events-provider-stats", (provider as any)?.id],
    enabled: !!(provider as any)?.id,
    queryFn: async () => {
      const { data } = await supabase.from("events_provider_stats").select("*").eq("provider_id", (provider as any).id).maybeSingle();
      return data;
    },
  });

  const { data: packagesCount = 0 } = useQuery({
    queryKey: ["events-packages-count", (provider as any)?.id],
    enabled: !!(provider as any)?.id,
    queryFn: async () => {
      const { count } = await supabase.from("events_packages").select("id", { count: "exact", head: true }).eq("provider_id", (provider as any).id);
      return count ?? 0;
    },
  });

  if (isLoading || !provider) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  const p = provider as any;
  const kycDone = !!p.kyc_verified_at;
  const hasPackages = packagesCount > 0;

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-fuchsia-500 text-white">
            <PartyPopper className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{p.business_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace pro Événements", "Events pro space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Bonjour", "Hello")}, {p.business_name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Voici ton activité événementielle.", "Here's your events activity.")}</p>
        </div>

        <div className="space-y-2.5">
          {!kycDone && (
            <Link to="/admin/events-service/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-amber-900 dark:text-amber-200">{t("Vérification d'identité requise", "Identity verification required")}</div>
                  <div className="text-xs text-amber-800/80 dark:text-amber-200/80">{t("Complète le KYC pour recevoir des paiements.", "Complete KYC to receive payouts.")}</div>
                </div>
              </div>
            </Link>
          )}
          {kycDone && !hasPackages && (
            <Link to="/admin/events-service/packages" className="block rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-4 hover:bg-fuchsia-500/15 transition">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-fuchsia-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-fuchsia-900 dark:text-fuchsia-200">{t("Crée ton premier package", "Create your first package")}</div>
                  <div className="text-xs text-fuchsia-800/80 dark:text-fuchsia-200/80">{t("Sans package, les clients ne peuvent pas réserver.", "Without a package, clients can't book you.")}</div>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t("Événements", "Events")} value={(stats as any)?.bookings_completed ?? 0} />
          <StatCard label={t("Revenu 30j", "30d revenue")} value={`${Number((stats as any)?.revenue_30d ?? 0).toLocaleString()} ${p.currency}`} />
          <StatCard label={t("Packages", "Packages")} value={packagesCount} />
          <StatCard label={t("Note moyenne", "Avg rating")} value={p.rating_avg ? Number(p.rating_avg).toFixed(1) : "—"} />
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          {[
            { icon: MessageSquare, label: t("Messages clients", "Client messages"), to: "/admin/events-service/messages" },
            { icon: Calendar, label: t("Réservations", "Bookings"), to: "/admin/events-service/orders" },
            { icon: PartyPopper, label: t("Mes packages", "My packages"), to: "/admin/events-service/packages" },
            { icon: Share2, label: t("Ma page publique", "My public page"), to: p.slug ? `/events/pro/${p.slug}` : "/admin/events-service/settings" },
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

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black truncate">{value}</div>
    </div>
  );
}
