import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  redacted_body: string | null;
  contains_contact_attempt: boolean;
  created_at: string;
  read_at: string | null;
};

export default function BeautyConversation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ["beauty-conv", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beauty_conversations")
        .select(
          "id, provider_id, client_id, booking_id, beauty_providers(business_name, avatar_url, slug)",
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ["beauty-messages", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_messages")
        .select("*")
        .eq("conversation_id", id!)
        .order("created_at", { ascending: true })
        .limit(200);
      return (data ?? []) as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`beauty-msgs-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "beauty_messages",
          filter: `conversation_id=eq.${id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["beauty-messages", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  // Mark messages as read
  useEffect(() => {
    if (!id || !user || !messages?.length) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    supabase.from("beauty_messages").update({ read_at: new Date().toISOString() }).in("id", unread).then();
  }, [id, user, messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !id || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("beauty_messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body,
      redacted_body: body,
    } as any);
    setSending(false);
    if (error) {
      toast.error(t("Envoi impossible", "Failed to send"));
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["beauty-messages", id] });
  };

  if (convLoading) {
    return (
      <div className="min-h-dvh bg-background p-4 space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("Conversation introuvable.", "Conversation not found.")}
          </p>
          <Button className="mt-4" onClick={() => navigate("/beauty/messages")}>
            {t("Retour", "Back")}
          </Button>
        </Card>
      </div>
    );
  }

  const provider = (conversation as any).beauty_providers;
  const isProvider = conversation.provider_id === user?.id;
  const headerLabel = isProvider ? t("Client", "Client") : provider?.business_name;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/beauty/messages")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {!isProvider && provider?.slug ? (
            <Link to={`/beauty/p/${provider.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={provider?.avatar_url ?? undefined} />
                <AvatarFallback>{(headerLabel ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">{headerLabel}</div>
                <div className="text-[10px] text-muted-foreground">{t("Voir le profil", "View profile")}</div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{(headerLabel ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="font-medium truncate">{headerLabel}</div>
            </div>
          )}
          {conversation.booking_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/beauty/bookings/${conversation.booking_id}`)}
            >
              {t("Réservation", "Booking")}
            </Button>
          )}
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {t(
                "Restez dans le chat — numéros, emails et réseaux sont masqués pour votre sécurité et la garantie escrow.",
                "Stay in chat — phone numbers, emails and social handles are masked to protect you and keep the escrow guarantee.",
              )}
            </span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4 space-y-2">
          {msgLoading ? (
            <>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
            </>
          ) : !messages?.length ? (
            <div className="text-center text-xs text-muted-foreground py-10 flex flex-col items-center gap-2">
              <Info className="h-5 w-5" />
              {t("Envoyez le premier message.", "Send the first message.")}
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              const shown = m.contains_contact_attempt ? m.redacted_body ?? m.body : m.body;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm",
                    )}
                  >
                    <div>{shown}</div>
                    {m.contains_contact_attempt && (
                      <div
                        className={cn(
                          "mt-1 text-[10px] flex items-center gap-1",
                          mine ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        {t("Contact masqué", "Contact masked")}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-0.5 text-[10px]",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {new Date(m.created_at).toLocaleTimeString(isFr ? "fr-FR" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl px-3 py-2 flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("Écrire un message…", "Write a message…")}
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={send} disabled={!text.trim() || sending} size="icon" className="h-11 w-11 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
