import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import EducationOfferComposer from "@/components/education/EducationOfferComposer";
import EducationOfferCard from "@/components/education/EducationOfferCard";
import EducationExtraChargeCard from "@/components/education/EducationExtraChargeCard";

interface Msg { id: string; sender_id: string; body: string; created_at: string; }

// Inline parser: messages beginning with "[OFFER:<uuid>]" or "[EXTRA:<uuid>]" render special cards.
const OFFER_RE = /^\[OFFER:([0-9a-f-]{36})\]/;
const EXTRA_RE = /^\[EXTRA:([0-9a-f-]{36})\]/;

export default function EducationConversation() {
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
      const { data: c } = await supabase.from("education_conversations")
        .select("id, student_id, tutor_id, education_tutors(display_name, user_id)")
        .eq("id", id).maybeSingle();
      if (mounted) setConv(c);
      const { data } = await supabase.from("education_messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
      if (mounted && data) setMsgs(data as Msg[]);
    })();
    const ch = supabase.channel(`education-conv-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "education_messages", filter: `conversation_id=eq.${id}` },
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
    const { error } = await supabase.from("education_messages").insert({
      conversation_id: id, sender_id: user.id, body,
    });
    if (!error) {
      await supabase.from("education_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    }
    setSending(false);
  };

  const tutorName = conv?.education_tutors?.display_name;
  const isTutor = user?.id === conv?.education_tutors?.user_id;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/education/messages" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold truncate flex-1">{tutorName || (isFr ? "Conversation" : "Conversation")}</h1>
          {isTutor && conv && (
            <EducationOfferComposer conversationId={conv.id} tutorId={conv.tutor_id} studentId={conv.student_id} />
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          const offerMatch = m.body?.match(OFFER_RE);
          const extraMatch = m.body?.match(EXTRA_RE);
          if (offerMatch) {
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] w-full sm:max-w-md"><EducationOfferCard offerId={offerMatch[1]} /></div>
              </div>
            );
          }
          if (extraMatch) {
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] w-full sm:max-w-md"><EducationExtraChargeCard extraChargeId={extraMatch[1]} /></div>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mine ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-br-sm"
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
          <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="h-11 w-11 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
