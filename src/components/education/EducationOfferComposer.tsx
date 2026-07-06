import { useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { EDUCATION_CATEGORIES, EDUCATION_MODES } from "@/lib/educationCategories";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: string;
  tutorId: string;
  studentId: string;
}

export default function EducationOfferComposer({ conversationId, tutorId, studentId }: Props) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("5000");
  const [duration, setDuration] = useState("60");
  const [sessionCount, setSessionCount] = useState("1");
  const [mode, setMode] = useState("online");
  const [saving, setSaving] = useState(false);

  const total = (Number(rate) || 0) * (Number(sessionCount) || 1);

  const submit = async () => {
    if (!user) return;
    if (!subject || !rate) {
      toast({ title: t("Matière et tarif requis", "Subject and rate required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: offer, error } = await supabase.from("education_offers").insert({
      conversation_id: conversationId,
      tutor_id: tutorId,
      student_id: studentId,
      subject,
      mode,
      session_count: Number(sessionCount) || 1,
      duration_min: Number(duration) || 60,
      rate_xof: Number(rate),
      total_xof: total,
      description: description.trim() || null,
      status: "pending",
    }).select("id").single();
    if (error || !offer) {
      setSaving(false);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    await supabase.from("education_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: `[OFFER:${offer.id}] ${subject} — ${total} XOF`,
    });
    await supabase.from("education_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
    setSaving(false); setOpen(false);
    setSubject(""); setDescription(""); setRate("5000"); setDuration("60"); setSessionCount("1");
    toast({ title: t("Offre envoyée", "Offer sent") });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />{t("Envoyer une offre", "Send an offer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("Nouvelle offre de séance", "New session offer")}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Matière", "Subject")}</label>
            <div className="flex flex-wrap gap-1.5">
              {EDUCATION_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setSubject(subject === c.id ? "" : c.id)}
                  className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                    subject === c.id ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                  <c.icon className="h-3 w-3" />{isFr ? c.fr : c.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Description", "Description")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder={t("Ce que la séance couvre", "What the session covers")} />
          </div>
          <div className="flex gap-2">
            {EDUCATION_MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)}
                className={cn("flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold",
                  mode === m.id ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                {isFr ? m.fr : m.en}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">{t("Tarif/séance", "Rate/session")}</label>
              <Input type="number" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">{t("Durée (min)", "Duration")}</label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">{t("Nb séances", "Sessions")}</label>
              <Input type="number" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} />
            </div>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 text-center">
            <div className="text-[10px] uppercase text-muted-foreground">{t("Total", "Total")}</div>
            <div className="text-2xl font-black text-teal-600">{total.toLocaleString()} XOF</div>
          </div>
          <Button onClick={submit} disabled={saving} className="w-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Envoyer", "Send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
