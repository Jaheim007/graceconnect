import { Link } from "react-router-dom";
import { Calendar, MessageSquare, Wrench, ShieldCheck, Home as HomeIcon, AlertCircle, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function HomeProOverview() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["home-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("home_providers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["home-provider-stats", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase.from("home_provider_stats").select("*").eq("provider_id", provider!.id).maybeSingle();
      return data;
    },
  });

  const { data: servicesCount = 0 } = useQuery({
    queryKey: ["home-services-count", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("home_services")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", provider!.id);
      return count ?? 0;
    },
  });

  if (isLoading || !provider) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;

  const kycDone = !!provider.kyc_verified_at;
  const hasServices = servicesCount > 0;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Mobile header (desktop uses the ProShell sidebar) */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
            <HomeIcon className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{provider.business_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace pro Artisan", "Artisan pro space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Bonjour", "Hello")}, {provider.business_name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Voici ce qui se passe sur ton espace artisan aujourd'hui.", "Here's what's happening on your artisan space today.")}
          </p>
        </div>

        {/* Onboarding alerts */}
        <div className="space-y-2.5">
          {!kycDone && (
            <Link to="/home/pro/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    {t("Vérification d'identité requise", "Identity verification required")}
                  </div>
                  <div className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    {t("Complète le KYC pour apparaître dans la recherche et recevoir des paiements.",
                       "Complete KYC to appear in search results and receive payments.")}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {kycDone && !hasServices && (
            <Link to="/home/pro/services" className="block rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 hover:bg-sky-500/15 transition">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-sky-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-sky-900 dark:text-sky-200">
                    {t("Ajoute ton premier service", "Add your first service")}
                  </div>
                  <div className="text-xs text-sky-800/80 dark:text-sky-200/80">
                    {t("Les clients ne peuvent pas te réserver tant qu'aucun service n'est publié.",
                       "Clients can't book you until you publish a service.")}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t("Travaux terminés", "Jobs done")} value={stats?.jobs_completed ?? 0} />
          <StatCard label={t("Revenu 30j", "30d revenue")} value={`${Number(stats?.revenue_30d ?? 0).toLocaleString()} ${provider.currency}`} />
          <StatCard label={t("Services publiés", "Services live")} value={servicesCount} />
          <StatCard label={t("Taux de réponse", "Response rate")} value={stats?.response_rate != null ? `${Math.round(Number(stats.response_rate) * 100)}%` : "—"} />
        </div>

        {/* Quick actions */}
        <div className="grid gap-2.5 lg:grid-cols-2">
          {[
            { icon: MessageSquare, label: t("Messages clients", "Client messages"), to: "/home/pro/messages" },
            { icon: Calendar, label: t("Demandes & interventions", "Orders & jobs"), to: "/home/pro/orders" },
            { icon: Wrench, label: t("Mes services", "My services"), to: "/home/pro/services" },
            { icon: Share2, label: t("Ma page publique", "My public page"), to: provider.slug ? `/home/pro/${provider.slug}` : "/home/pro/settings" },
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
