import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

interface Msg { id: string; sender_id: string; body: string | null; kind: string; created_at: string; offer_id?: string | null; }

export default function BeautyProConversationPane() {
  const { id } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [conv, setConv] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;
    (async () => {
      const { data: c } = await supabase.from("beauty_conversations")
        .select("id, client_id, provider_id, beauty_providers(business_name, user_id)")
        .eq("id", id).maybeSingle();
      if (mounted) setConv(c);
      if (c?.client_id) {
        const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", c.client_id).maybeSingle();
        if (mounted) setClientProfile(p);
      }
      const { data } = await supabase.from("beauty_messages")
        .select("id, sender_id, body, kind, created_at, offer_id")
        .eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
      if (mounted && data) setMsgs(data as Msg[]);
    })();
    const ch = supabase.channel(`beauty-pro-conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "beauty_messages", filter: `conversation_id=eq.${id}` },
        (payload) => setMsgs((p) => [...p, payload.new as Msg]))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!text.trim() || !id || !user) return;
    setSending(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("beauty_messages").insert({ conversation_id: id, sender_id: user.id, body, redacted_body: body, kind: "text" });
    if (!error) await supabase.from("beauty_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setSending(false);
  };

  const isProvider = user?.id === conv?.beauty_providers?.user_id;
  const otherName = isProvider ? (clientProfile?.display_name || (isFr ? "Cliente" : "Client")) : (conv?.beauty_providers?.business_name || (isFr ? "Salon" : "Salon"));
  const otherAvatar = isProvider ? clientProfile?.avatar_url : null;

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link to="/admin/beauty/messages" className="lg:hidden rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          {otherAvatar ? (
            <img src={otherAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300"><UserIcon className="h-4 w-4" /></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{otherName}</div>
            <div className="text-[10px] text-muted-foreground">{isProvider ? (isFr ? "Cliente" : "Client") : (isFr ? "Salon" : "Salon")}</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md")}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/60 bg-background/95 p-3 backdrop-blur">
        <div className="flex items-end gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={isFr ? "Écris un message…" : "Type a message…"} className="flex-1 h-11" />
          <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="h-11 w-11">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
