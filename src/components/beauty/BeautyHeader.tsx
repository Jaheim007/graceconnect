import { useNavigate } from "react-router-dom";
import { Sun, Moon, MessageCircle, Calendar, LayoutDashboard, LogOut, User, ArrowLeft } from "lucide-react";
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

interface BeautyHeaderProps {
  /** When true, show a back arrow that goes to /beauty */
  showBack?: boolean;
  /** Optional children rendered on the right side of the header, before the auth zone */
  right?: React.ReactNode;
}

/**
 * Shared header for /beauty/* pages — logo + language + theme + sign-in / avatar menu.
 * Keeps the "connected" feel identical to Digital across the whole Beauty universe.
 */
export function BeautyHeader({ showBack = true, right }: BeautyHeaderProps) {
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

  const { data: isProvider } = useQuery({
    queryKey: ["beauty-is-provider-header", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
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
            onClick={() => navigate("/beauty")}
            aria-label={t("Retour", "Back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <button
          onClick={() => navigate("/beauty")}
          className="flex items-center gap-2"
          aria-label="SiteViral Beauty"
        >
          <SiteLogo size="sm" animate linked={false} />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-black tracking-tight">SiteViral</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Beauty
            </div>
          </div>
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
            className="h-8 text-xs"
            onClick={() => goAuth(window.location.pathname + window.location.search)}
          >
            {t("Se connecter", "Sign in")}
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
              <DropdownMenuItem onClick={() => navigate("/beauty/bookings")}>
                <Calendar className="mr-2 h-4 w-4" />
                {t("Mes rendez-vous", "My appointments")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/beauty/messages")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {t("Mes messages", "My messages")}
              </DropdownMenuItem>
              {isProvider && (
                <DropdownMenuItem onClick={() => navigate("/beauty/pro")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t("Mon espace pro", "My pro space")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                <User className="mr-2 h-4 w-4" />
                {t("SiteViral Digital", "SiteViral Digital")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate("/beauty");
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
