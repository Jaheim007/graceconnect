import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home as HomeIcon, LayoutDashboard, MessageSquare, ClipboardList, TrendingUp, Settings as SettingsIcon, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { ProShell, ProNavItem } from "@/components/pro/ProShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Layout for the artisan pro space. All `/home/pro/*` children render inside this
 * shell on desktop so the sidebar stays "fixated" while the right pane changes.
 */
export default function HomeProLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => {
    if (!user) navigate("/auth?returnTo=/home/pro");
  }, [user, navigate]);

  const { data: provider } = useQuery({
    queryKey: ["home-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_providers")
        .select("id, business_name, slug, avatar_url, kyc_verified_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Unread messages badge — provider side.
  const { data: unread = 0 } = useQuery({
    queryKey: ["home-pro-unread", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("home_conversations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", provider!.id);
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const items: ProNavItem[] = [
    { to: "/home/pro", end: true, label: t("Aperçu", "Overview"), icon: LayoutDashboard },
    { to: "/home/pro/messages", label: t("Messages", "Messages"), icon: MessageSquare, badge: unread || undefined },
    { to: "/home/pro/orders", label: t("Demandes & interventions", "Orders & jobs"), icon: ClipboardList },
    { to: "/home/pro/revenue", label: t("Revenus", "Revenue"), icon: TrendingUp },
    { to: "/home/pro/settings", label: t("Réglages", "Settings"), icon: SettingsIcon },
  ];

  const sharePublic = async () => {
    if (!provider?.slug) return;
    const url = `${window.location.origin}/home/pro/${provider.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("Lien copié", "Link copied"));
    } catch {
      toast.error(url);
    }
  };

  return (
    <ProShell
      title={provider?.business_name || t("Espace Artisan", "Artisan space")}
      subtitle={t("Tableau de bord pro", "Pro dashboard")}
      brandIcon={<HomeIcon className="h-5 w-5" />}
      brandGradient="from-sky-500 to-emerald-500"
      items={items}
      footer={
        provider?.slug ? (
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={sharePublic}>
              <Share2 className="h-3.5 w-3.5 mr-2" />
              {t("Partager ma page publique", "Share my public page")}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-xs text-muted-foreground"
              size="sm"
              onClick={() => window.open(`/home/pro/${provider.slug}`, "_blank")}
            >
              {t("Voir ma page publique", "View my public page")}
            </Button>
          </div>
        ) : null
      }
    />
  );
}
