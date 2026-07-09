import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, MessageSquare, ClipboardList, TrendingUp, Settings as SettingsIcon, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { ProShell, ProNavItem } from "@/components/pro/ProShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BeautyProLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => { if (!user) navigate("/auth?returnTo=/beauty/pro"); }, [user, navigate]);

  const { data: provider } = useQuery({
    queryKey: ["beauty-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_providers")
        .select("id, business_name, slug, avatar_url, kyc_verified_at, currency")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["beauty-pro-unread", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("beauty_conversations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", provider!.id);
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const items: ProNavItem[] = [
    { to: "/beauty/pro", end: true, label: t("Aperçu", "Overview"), icon: LayoutDashboard },
    { to: "/beauty/pro/messages", label: t("Messages", "Messages"), icon: MessageSquare, badge: unread || undefined },
    { to: "/beauty/pro/orders", label: t("Rendez-vous", "Appointments"), icon: ClipboardList },
    { to: "/beauty/pro/revenue", label: t("Revenus", "Revenue"), icon: TrendingUp },
    { to: "/beauty/pro/settings", label: t("Réglages", "Settings"), icon: SettingsIcon },
  ];

  const sharePublic = async () => {
    if (!provider?.slug) return;
    const url = `${window.location.origin}/beauty/p/${provider.slug}`;
    try { await navigator.clipboard.writeText(url); toast.success(t("Lien copié", "Link copied")); }
    catch { toast.error(url); }
  };

  return (
    <ProShell
      title={provider?.business_name || t("Espace Beauté", "Beauty space")}
      subtitle={t("Tableau de bord pro", "Pro dashboard")}
      brandIcon={<Sparkles className="h-5 w-5" />}
      brandGradient="from-pink-500 to-rose-500"
      items={items}
      footer={provider?.slug ? (
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm" onClick={sharePublic}>
            <Share2 className="h-3.5 w-3.5 mr-2" />{t("Partager ma page publique", "Share my public page")}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" size="sm"
            onClick={() => window.open(`/beauty/p/${provider.slug}`, "_blank")}>
            {t("Voir ma page publique", "View my public page")}
          </Button>
        </div>
      ) : null}
    />
  );
}
