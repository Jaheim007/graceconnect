import { Link } from "react-router-dom";
import { Calendar, MessageSquare, ShieldCheck, Sparkles, AlertCircle, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function BeautyProOverview() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["beauty-provider-me-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("beauty_providers").select("*, beauty_provider_stats(*)").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: servicesCount = 0 } = useQuery({
    queryKey: ["beauty-services-count", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { count } = await supabase.from("beauty_services").select("id", { count: "exact", head: true }).eq("provider_id", provider!.id);
      return count ?? 0;
    },
  });

  if (isLoading || !provider) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  const stats = (provider as any).beauty_provider_stats;
  const kycDone = (provider as any).status === "active";
  const hasServices = servicesCount > 0;
  const currency = "XOF";

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{(provider as any).business_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace pro Beauté", "Beauty pro space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Bonjour", "Hello")}, {(provider as any).business_name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Voici ce qui se passe dans ton salon aujourd'hui.", "Here's what's happening in your salon today.")}
          </p>
        </div>

        <div className="space-y-2.5">
          {!kycDone && (
            <Link to="/admin/beauty/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-amber-900 dark:text-amber-200">{t("Vérification d'identité requise", "Identity verification required")}</div>
                  <div className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    {t("Complète le KYC pour recevoir tes paiements.", "Complete KYC to receive payouts.")}
                  </div>
                </div>
              </div>
            </Link>
          )}
          {kycDone && !hasServices && (
            <Link to="/admin/beauty/settings" className="block rounded-2xl border border-pink-500/40 bg-pink-500/10 p-4 hover:bg-pink-500/15 transition">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-pink-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-pink-900 dark:text-pink-200">{t("Publie ton premier service", "Publish your first service")}</div>
                  <div className="text-xs text-pink-800/80 dark:text-pink-200/80">
                    {t("Les clientes ne peuvent pas réserver tant qu'aucun service n'est publié.", "Clients can't book you until you publish a service.")}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t("Rendez-vous", "Appointments")} value={stats?.bookings_completed ?? stats?.jobs_completed ?? 0} />
          <StatCard label={t("Revenu 30j", "30d revenue")} value={`${Number(stats?.revenue_30d ?? 0).toLocaleString()} ${currency}`} />
          <StatCard label={t("Services publiés", "Services live")} value={servicesCount} />
          <StatCard label={t("Taux de réponse", "Response rate")} value={stats?.response_rate != null ? `${Math.round(Number(stats.response_rate) * 100)}%` : "—"} />
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          {[
            { icon: MessageSquare, label: t("Messages clientes", "Client messages"), to: "/admin/beauty/messages" },
            { icon: Calendar, label: t("Rendez-vous", "Appointments"), to: "/admin/beauty/orders" },
            { icon: Sparkles, label: t("Mes services", "My services"), to: "/admin/beauty/settings" },
            { icon: Share2, label: t("Ma page publique", "My public page"), to: (provider as any).slug ? `/beauty/p/${(provider as any).slug}` : "/admin/beauty/settings" },
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
