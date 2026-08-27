import { useNavigate } from "@/lib/router-compat";
import { Sun, Moon, LayoutDashboard, LogOut, User, ArrowLeft, HandHeart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalPreferencesSelector } from "@/components/global/GlobalPreferencesSelector";
import { SiteLogo } from "@/components/ui/SiteLogo";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ChurchHeaderProps {
  /** When true, show a back arrow that goes to /church */
  showBack?: boolean;
  /** Optional slot rendered on the right side, before the auth zone */
  right?: React.ReactNode;
}

/**
 * Shared header for /church/* pages — logo + language + theme + sign-in / avatar menu.
 * Mirrors BeautyHeader so every vertical carries the same shell.
 */
export function ChurchHeader({ showBack = true, right }: ChurchHeaderProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const displayName =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const initial = (displayName || user?.email || "?")[0]?.toUpperCase();

  const { data: myChurch } = useQuery({
    queryKey: ["church-owner-header", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("churches" as any)
        .select("id, slug")
        .eq("owner_user_id", user!.id)
        .maybeSingle();
      return (data as unknown as { id: string; slug: string } | null);
    },
  });

  const goAuth = (returnTo: string) => {
    try { sessionStorage.setItem("sv_auth_returnTo", returnTo); } catch {}
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 -ml-2"
            onClick={() => navigate("/church")}
            aria-label={t("Retour", "Back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <button
          onClick={() => { window.location.href = "https://siteviral.com"; }}
          className="flex items-center"
          aria-label="SiteViral"
        >
          <SiteLogo size="sm" animate linked={false} />
        </button>
        <div className="flex-1" />
        {right}
        <GlobalPreferencesSelector />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          aria-label={t("Changer de thème", "Toggle theme")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {!user ? (
          <Button
            size="sm"
            className="h-8 text-xs font-semibold rounded-xl px-4"
            onClick={() => goAuth(window.location.pathname + window.location.search)}
          >
            {t("Connexion", "Sign in")}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-border/70 transition hover:ring-primary/60"
                aria-label={t("Mon compte", "My account")}
              >
                <Avatar className="h-8 w-8">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback className="text-xs font-bold">{initial}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {displayName || user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/my-purchases?tab=giving")}>
                <HandHeart className="mr-2 h-4 w-4" />
                {t("Mes dons", "My donations")}
              </DropdownMenuItem>
              {myChurch && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t("Mon espace pastoral", "My pastoral space")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/church/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("Paramètres de l'église", "Church settings")}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                <User className="mr-2 h-4 w-4" />
                {t("Retour au Hub", "Back to Hub")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate("/church");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("Se déconnecter", "Sign out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
