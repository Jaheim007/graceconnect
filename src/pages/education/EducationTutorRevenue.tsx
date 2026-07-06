import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function EducationTutorRevenue() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: tutor } = useQuery({
    queryKey: ["education-tutor-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["education-tutor-stats", tutor?.id],
    enabled: !!tutor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutor_stats").select("*").eq("tutor_id", tutor!.id).maybeSingle();
      return data;
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["education-recent-bookings", tutor?.id],
    enabled: !!tutor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_bookings")
        .select("id, status, total_xof, tutor_earnings_xof, scheduled_at, subject, created_at")
        .eq("tutor_id", tutor!.id)
        .order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/learn/pro" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Revenus & paiements", "Revenue & payouts")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3 w-3" />{t("Séances", "Sessions")}
            </div>
            <div className="mt-1 text-2xl font-black">{stats?.sessions_completed ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3 w-3" />{t("Revenu total", "Total revenue")}
            </div>
            <div className="mt-1 text-2xl font-black">
              {Number(stats?.total_earnings_xof ?? 0).toLocaleString()} <span className="text-xs text-muted-foreground">XOF</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-bold">{t("Dernières séances", "Recent sessions")}</div>
          <div className="divide-y divide-border">
            {(recent ?? []).length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">{t("Pas encore de séances.", "No sessions yet.")}</div>
            )}
            {(recent ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{b.subject}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(b.scheduled_at).toLocaleDateString(isFr ? "fr-FR" : "en-US")} · {b.status}
                  </div>
                </div>
                <div className="text-sm font-black text-teal-600">{Number(b.tutor_earnings_xof).toLocaleString()} XOF</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground">
            {t("Les retraits par Mobile Money seront disponibles à la fin de la validation KYC.",
               "Mobile Money payouts unlock after KYC validation.")}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link to="/learn/pro/kyc">{t("Voir le KYC", "View KYC")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
