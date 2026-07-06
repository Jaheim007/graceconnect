import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
  providerId: string;
  onSubmitted?: () => void;
}

export default function EventsReviewForm({ bookingId, providerId, onSubmitted }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || rating < 1) {
      toast({ title: t("Note requise", "Rating required"), variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("events_reviews").insert({
      booking_id: bookingId, client_id: user.id, provider_id: providerId,
      rating, comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: t("Merci pour ton avis !", "Thanks for your review!") });
    onSubmitted?.();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-lg font-black mb-3">{t("Laisser un avis", "Leave a review")}</h3>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star className={cn("h-8 w-8", (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
      <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder={t("Comment s'est passé l'événement ?", "How was the event?")} />
      <Button onClick={submit} disabled={saving || rating < 1} className="w-full mt-3 bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />{t("Publier", "Publish")}</>}
      </Button>
    </div>
  );
}
