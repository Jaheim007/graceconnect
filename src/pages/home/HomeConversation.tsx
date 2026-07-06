import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

interface Msg { id: string; sender_id: string; body: string | null; kind: string; created_at: string; }

export default function HomeConversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [providerName, setProviderName] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;

    (async () => {
      const { data: conv } = await supabase.from("home_conversations")
        .select("id, home_providers(business_name)").eq("id", id).maybeSingle();
      if (mounted && conv?.home_providers) setProviderName((conv.home_providers as any).business_name);

      const { data } = await supabase.from("home_messages")
        .select("id, sender_id, body, kind, created_at")
        .eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
      if (mounted && data) setMsgs(data as Msg[]);
    })();

    const ch = supabase.channel(`home-conv-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "home_messages", filter: `conversation_id=eq.${id}` },
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
    const { error } = await supabase.from("home_messages")
      .insert({ conversation_id: id, sender_id: user.id, body, kind: "text" });
    if (!error) {
      await supabase.from("home_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    }
    setSending(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/home/messages" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold truncate">{providerName || (isFr ? "Conversation" : "Conversation")}</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mine ? "bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-br-sm"
                     : "bg-card border border-border rounded-bl-sm")}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/95 p-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={isFr ? "Écris un message…" : "Type a message…"} className="flex-1 h-11" />
          <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="h-11 w-11 bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
