import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { BeautyHeader } from "@/components/beauty/BeautyHeader";

export default function BeautyMessagesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["beauty-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_conversations")
        .select(
          "id, last_message_at, provider_id, client_id, beauty_providers(business_name, avatar_url, slug)",
        )
        .or(`client_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`beauty-conv-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beauty_conversations" },
        () => qc.invalidateQueries({ queryKey: ["beauty-conversations", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/beauty")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t("Messages", "Messages")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : !conversations?.length ? (
          <Card className="p-8 text-center space-y-3">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t(
                "Aucune conversation. Réserve un rendez-vous pour discuter avec ton expert(e).",
                "No conversations yet. Book an appointment to chat with your expert.",
              )}
            </p>
            <Button onClick={() => navigate("/beauty/search")}>
              {t("Explorer", "Explore")}
            </Button>
          </Card>
        ) : (
          conversations.map((c: any) => {
            const provider = c.beauty_providers;
            const isProvider = c.provider_id === user?.id;
            const label = isProvider ? t("Client", "Client") : provider?.business_name;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/beauty/messages/${c.id}`)}
                className="w-full text-left"
              >
                <Card className="p-4 flex items-center gap-3 hover:bg-muted/40 active:scale-[0.99] transition">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={provider?.avatar_url ?? undefined} />
                    <AvatarFallback>{(label ?? "?").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{label ?? t("Conversation", "Conversation")}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.last_message_at
                        ? new Date(c.last_message_at).toLocaleString(isFr ? "fr-FR" : "en-US")
                        : t("Nouveau", "New")}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Card>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
