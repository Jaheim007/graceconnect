import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import EducationOfferComposer from "@/components/education/EducationOfferComposer";

interface Msg { id: string; sender_id: string; body: string; created_at: string; }

export default function EducationProConversationPane() {
  const { id } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [conv, setConv] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
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
      if ((c as any)?.student_id) {
        const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", (c as any).student_id).maybeSingle();
        if (mounted) setStudentProfile(p);
      }
      const { data } = await supabase.from("education_messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
      if (mounted && data) setMsgs(data as any);
    })();
    const ch = supabase.channel(`education-pro-conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "education_messages", filter: `conversation_id=eq.${id}` },
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
    const { error } = await supabase.from("education_messages").insert({ conversation_id: id, sender_id: user.id, body });
    if (!error) await supabase.from("education_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setSending(false);
  };

  const isTutor = user?.id === conv?.education_tutors?.user_id;
  const otherName = isTutor ? (studentProfile?.display_name || (isFr ? "Étudiant" : "Student")) : (conv?.education_tutors?.display_name || (isFr ? "Tuteur" : "Tutor"));
  const otherAvatar = isTutor ? studentProfile?.avatar_url : null;

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link to="/admin/learn/messages" className="lg:hidden rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          {otherAvatar ? (
            <img src={otherAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><UserIcon className="h-4 w-4" /></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{otherName}</div>
            <div className="text-[10px] text-muted-foreground">{isTutor ? (isFr ? "Étudiant" : "Student") : (isFr ? "Tuteur" : "Tutor")}</div>
          </div>
          {isTutor && conv && (
            <EducationOfferComposer conversationId={conv.id} tutorId={conv.tutor_id} studentId={conv.student_id} />
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-xs",
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
