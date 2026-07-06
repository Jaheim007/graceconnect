import { Link, useNavigate } from "react-router-dom";
import { Calendar, MessageSquare, BookOpen, ShieldCheck, TrendingUp, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function EducationTutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => { if (!user) navigate("/auth?returnTo=/education/pro"); }, [user, navigate]);

  const { data: tutor } = useQuery({
    queryKey: ["education-tutor-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("*").eq("user_id", user!.id).maybeSingle();
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

  if (!tutor) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  const kycDone = tutor.kyc_status === "verified";

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{tutor.display_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace prof Education", "Tutor space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        {!kycDone && (
          <Link to="/education/pro/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
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
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Séances données", "Sessions done")}</div>
            <div className="mt-1 text-2xl font-black">{stats?.sessions_completed ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Revenu total", "Total revenue")}</div>
            <div className="mt-1 text-2xl font-black">{Number(stats?.total_earnings_xof ?? 0).toLocaleString()} <span className="text-xs text-muted-foreground">XOF</span></div>
          </div>
        </div>

        <div className="grid gap-2.5">
          {[
            { icon: MessageSquare, label: t("Messages", "Messages"), to: "/education/messages" },
            { icon: Calendar, label: t("Mes séances", "My sessions"), to: "/education/bookings" },
            { icon: BookOpen, label: t("Mes matières", "My subjects"), to: "/education/pro/subjects" },
            { icon: TrendingUp, label: t("Revenus & paiements", "Revenue & payouts"), to: "/education/pro/revenue" },
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
