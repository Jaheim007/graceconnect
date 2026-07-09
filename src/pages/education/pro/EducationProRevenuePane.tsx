import { Link } from "react-router-dom";
import { TrendingUp, Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function EducationProRevenuePane() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: tutor } = useQuery({
    queryKey: ["education-tutor-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("id, kyc_status, is_verified").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["education-tutor-stats", (tutor as any)?.id],
    enabled: !!(tutor as any)?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutor_stats").select("*").eq("tutor_id", (tutor as any).id).maybeSingle();
      return data;
    },
  });

  const { data: completed } = useQuery({
    queryKey: ["education-completed", (tutor as any)?.id],
    enabled: !!(tutor as any)?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_bookings")
        .select("id, total_xof, subject, scheduled_at, created_at")
        .eq("tutor_id", (tutor as any).id).eq("status", "completed")
        .order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const T = tutor as any;
  const kycDone = T?.kyc_status === "verified" || T?.is_verified;

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/dashboard" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Revenus & paiements", "Revenue & payouts")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Revenus & paiements", "Revenue & payouts")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Suis ce que tu as gagné et gère tes retraits.", "Track what you've earned and manage payouts.")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3 w-3" />{t("Séances données", "Sessions done")}
            </div>
            <div className="mt-1 text-2xl font-black">{(stats as any)?.sessions_completed ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3 w-3" />{t("Revenu total", "Total revenue")}
            </div>
            <div className="mt-1 text-2xl font-black">
              {Number((stats as any)?.total_earnings_xof ?? 0).toLocaleString()} <span className="text-xs text-muted-foreground">XOF</span>
            </div>
          </div>
        </div>

        {!kycDone && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-sm">
                <div className="font-bold text-amber-900 dark:text-amber-200">{t("Débloque tes retraits", "Unlock your payouts")}</div>
                <div className="text-xs text-amber-800/80 dark:text-amber-200/80">{t("Les retraits s'activent après la validation KYC.", "Payouts activate after KYC validation.")}</div>
              </div>
              <Button asChild size="sm"><Link to="/admin/learn/kyc">{t("Faire le KYC", "Verify")}</Link></Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-bold">{t("Séances terminées", "Completed sessions")}</div>
          <div className="divide-y divide-border">
            {(completed ?? []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">{t("Pas encore de séance terminée.", "No completed sessions yet.")}</div>
            ) : (completed ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{b.subject}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString(isFr ? "fr-FR" : "en-US") : new Date(b.created_at).toLocaleDateString(isFr ? "fr-FR" : "en-US")}
                  </div>
                </div>
                <div className="text-sm font-black text-emerald-600">+{Number(b.total_xof).toLocaleString()} XOF</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
