import { Link } from "@/lib/router-compat";
import { Calendar, MessageSquare, ShieldCheck, GraduationCap, AlertCircle, BookOpen, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";

export default function EducationProOverview() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["education-tutor-me-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("*").eq("user_id", user!.id).maybeSingle();
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

  const { data: subjectsCount = 0 } = useQuery({
    queryKey: ["education-subjects-count", (tutor as any)?.id],
    enabled: !!(tutor as any)?.id,
    queryFn: async () => {
      const { count } = await supabase.from("education_subjects").select("id", { count: "exact", head: true }).eq("tutor_id", (tutor as any).id);
      return count ?? 0;
    },
  });

  if (isLoading || !tutor) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  const T = tutor as any;
  const kycDone = T.kyc_status === "verified" || T.is_verified;
  const hasSubjects = subjectsCount > 0;

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-black truncate">{T.display_name}</div>
            <div className="text-[10px] text-muted-foreground">{t("Espace pro Tuteur", "Tutor pro space")}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Bonjour", "Hello")}, {T.display_name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Voici ton activité d'enseignement.", "Here's your tutoring activity.")}</p>
        </div>

        <div className="space-y-2.5">
          {!kycDone && (
            <Link to="/admin/learn/kyc" className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-amber-900 dark:text-amber-200">{t("Vérification d'identité requise", "Identity verification required")}</div>
                  <div className="text-xs text-amber-800/80 dark:text-amber-200/80">{t("Complète le KYC pour recevoir des paiements.", "Complete KYC to receive payouts.")}</div>
                </div>
              </div>
            </Link>
          )}
          {kycDone && !hasSubjects && (
            <Link to="/admin/learn/subjects" className="block rounded-2xl border border-teal-500/40 bg-teal-500/10 p-4 hover:bg-teal-500/15 transition">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-teal-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-teal-900 dark:text-teal-200">{t("Ajoute tes matières", "Add your subjects")}</div>
                  <div className="text-xs text-teal-800/80 dark:text-teal-200/80">{t("Sans matières, les étudiants ne peuvent pas te réserver.", "Without subjects, students can't book you.")}</div>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t("Séances données", "Sessions done")} value={(stats as any)?.sessions_completed ?? T.sessions_completed ?? 0} />
          <StatCard label={t("Revenu total", "Total revenue")} value={`${Number((stats as any)?.total_earnings_xof ?? 0).toLocaleString()} XOF`} />
          <StatCard label={t("Matières", "Subjects")} value={subjectsCount} />
          <StatCard label={t("Note moyenne", "Avg rating")} value={T.rating_avg ? Number(T.rating_avg).toFixed(1) : "—"} />
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          {[
            { icon: MessageSquare, label: t("Messages étudiants", "Student messages"), to: "/admin/learn/messages" },
            { icon: Calendar, label: t("Mes séances", "My sessions"), to: "/admin/learn/orders" },
            { icon: BookOpen, label: t("Mes matières", "My subjects"), to: "/admin/learn/subjects" },
            { icon: Share2, label: t("Ma page publique", "My public page"), to: T.slug ? `/learn/pro/${T.slug}` : "/admin/learn/settings" },
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
