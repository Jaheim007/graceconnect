import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Church as ChurchIcon, LayoutDashboard, Mic, HeartHandshake, Megaphone,
  Calendar, HandHeart, Users, ClipboardList, Settings as SettingsIcon, Share2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { ProShell, ProNavItem } from "@/components/pro/ProShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Church pro shell — same fixated dashboard shape as the other verticals,
 * with items scoped to the church domain (sermons, giving, prayer, team…).
 */
export default function ChurchProLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  useEffect(() => { if (!user) navigate("/auth?returnTo=/church/pro"); }, [user, navigate]);

  const { data: provider } = useQuery({
    queryKey: ["church-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("church_providers")
        .select("id, name, slug, logo_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { id: string; name: string; slug: string | null; logo_url: string | null } | null;
    },
  });

  const items: ProNavItem[] = [
    { to: "/church/pro", end: true, label: t("Aperçu", "Overview"), icon: LayoutDashboard },
    { to: "/church/pro/sermons", label: t("Prédications", "Sermons"), icon: Mic },
    { to: "/church/pro/giving", label: t("Dons", "Giving"), icon: HeartHandshake },
    { to: "/church/pro/campaigns", label: t("Campagnes", "Campaigns"), icon: Megaphone },
    { to: "/church/pro/events", label: t("Événements", "Events"), icon: Calendar },
    { to: "/church/pro/prayer", label: t("Prières", "Prayer"), icon: HandHeart },
    { to: "/church/pro/announcements", label: t("Annonces", "Announcements"), icon: Megaphone },
    { to: "/church/pro/team", label: t("Équipe", "Team"), icon: Users },
    { to: "/church/pro/appointments", label: t("Rendez-vous", "Appointments"), icon: ClipboardList },
    { to: "/church/pro/settings", label: t("Réglages", "Settings"), icon: SettingsIcon },
  ];

  const sharePublic = async () => {
    if (!provider?.slug) return;
    const url = `${window.location.origin}/church/${provider.slug}`;
    try { await navigator.clipboard.writeText(url); toast.success(t("Lien copié", "Link copied")); }
    catch { toast.error(url); }
  };

  return (
    <ProShell
      title={provider?.name || t("Espace Église", "Church space")}
      subtitle={t("Tableau de bord pro", "Pro dashboard")}
      brandIcon={<ChurchIcon className="h-5 w-5" />}
      brandGradient="from-amber-500 to-orange-500"
      items={items}
      footer={provider?.slug ? (
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm" onClick={sharePublic}>
            <Share2 className="h-3.5 w-3.5 mr-2" />{t("Partager ma page publique", "Share my public page")}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" size="sm"
            onClick={() => window.open(`/church/${provider.slug}`, "_blank")}>
            {t("Voir ma page publique", "View my public page")}
          </Button>
        </div>
      ) : null}
    />
  );
}
