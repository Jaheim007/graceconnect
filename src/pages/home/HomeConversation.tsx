import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import HomeOfferComposer from "@/components/home/HomeOfferComposer";
import HomeOfferCard from "@/components/home/HomeOfferCard";
import HomeExtraChargeCard from "@/components/home/HomeExtraChargeCard";

interface Msg {
  id: string; sender_id: string; body: string | null; kind: string; created_at: string;
  offer_id?: string | null; extra_charge_id?: string | null; booking_id?: string | null;
}

export default function HomeConversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [conv, setConv] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;
    (async () => {
      const { data: c } = await supabase.from("home_conversations")
        .select("id, client_id, provider_id, home_providers(business_name, user_id)")
        .eq("id", id).maybeSingle();
      if (mounted) setConv(c);
      const { data } = await supabase.from("home_messages")
        .select("id, sender_id, body, kind, created_at, offer_id, extra_charge_id, booking_id")
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
    const { error } = await supabase.from("home_messages").insert({
      conversation_id: id, sender_id: user.id, body, kind: "text",
    });
    if (!error) {
      await supabase.from("home_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    }
    setSending(false);
  };

  const providerName = conv?.home_providers?.business_name;
  const isProvider = user?.id === conv?.home_providers?.user_id;
  const currency = "XOF";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/home/messages" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold truncate flex-1">{providerName || (isFr ? "Conversation" : "Conversation")}</h1>
          {isProvider && conv && (
            <HomeOfferComposer conversationId={conv.id} providerId={conv.provider_id} clientId={conv.client_id} currency={currency} />
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          if (m.kind === "offer" && m.offer_id) {
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] w-full sm:max-w-md"><HomeOfferCard offerId={m.offer_id} /></div>
              </div>
            );
          }
          if (m.kind === "extra_charge" && m.extra_charge_id) {
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] w-full sm:max-w-md"><HomeExtraChargeCard extraChargeId={m.extra_charge_id} /></div>
              </div>
            );
          }
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
