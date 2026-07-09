import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, MessageSquare, ClipboardList, TrendingUp, Settings as SettingsIcon, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { ProShell, ProNavItem } from "@/components/pro/ProShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EducationProLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => { if (!user) navigate("/auth?returnTo=/learn/pro"); }, [user, navigate]);

  const { data: tutor } = useQuery({
    queryKey: ["education-tutor-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors")
        .select("id, display_name, slug, avatar_url, kyc_status, is_verified")
        .eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["education-pro-unread", (tutor as any)?.id],
    enabled: !!(tutor as any)?.id,
    queryFn: async () => {
      const { count } = await supabase.from("education_conversations")
        .select("id", { count: "exact", head: true }).eq("tutor_id", (tutor as any).id);
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const items: ProNavItem[] = [
    { to: "/learn/pro", end: true, label: t("Aperçu", "Overview"), icon: LayoutDashboard },
    { to: "/learn/pro/messages", label: t("Messages", "Messages"), icon: MessageSquare, badge: unread || undefined },
    { to: "/learn/pro/orders", label: t("Séances", "Sessions"), icon: ClipboardList },
    { to: "/learn/pro/revenue", label: t("Revenus", "Revenue"), icon: TrendingUp },
    { to: "/learn/pro/settings", label: t("Réglages", "Settings"), icon: SettingsIcon },
  ];

  const share = async () => {
    if (!(tutor as any)?.slug) return;
    const url = `${window.location.origin}/learn/pro/${(tutor as any).slug}`;
    try { await navigator.clipboard.writeText(url); toast.success(t("Lien copié", "Link copied")); }
    catch { toast.error(url); }
  };

  return (
    <ProShell
      title={(tutor as any)?.display_name || t("Espace Tuteur", "Tutor space")}
      subtitle={t("Tableau de bord pro", "Pro dashboard")}
      brandIcon={<GraduationCap className="h-5 w-5" />}
      brandGradient="from-teal-500 to-cyan-500"
      items={items}
      footer={(tutor as any)?.slug ? (
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm" onClick={share}>
            <Share2 className="h-3.5 w-3.5 mr-2" />{t("Partager ma page publique", "Share my public page")}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" size="sm"
            onClick={() => window.open(`/learn/pro/${(tutor as any).slug}`, "_blank")}>
            {t("Voir ma page publique", "View my public page")}
          </Button>
        </div>
      ) : null}
    />
  );
}
