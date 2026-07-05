import { useState } from "react";
import { Star, Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface Props {
  bookingId: string;
  providerId: string;
  currency: string;
  onSubmitted?: () => void;
}

const TIP_PRESETS = [0, 5, 10, 15, 20]; // %

export default function BeautyReviewForm({ bookingId, providerId, currency, onSubmitted }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tipPct, setTipPct] = useState<number | null>(0);
  const [tipCustom, setTipCustom] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) return;
    if (rating < 1) {
      toast({ title: t("Note requise", "Rating required"), variant: "destructive" });
      return;
    }
    if (body.trim().length < 10) {
      toast({
        title: t("Commentaire requis", "Comment required"),
        description: t("Écris au moins 10 caractères pour aider les autres.", "Write at least 10 characters to help others."),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const tipAmount = tipCustom
        ? Math.max(0, Math.floor(Number(tipCustom) || 0))
        : 0;
      const { error } = await supabase.from("beauty_reviews").insert({
        booking_id: bookingId,
        client_id: user.id,
        provider_id: providerId,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
        tip_xof: tipAmount,
      });
      if (error) throw error;
      toast({
        title: t("Merci pour ton avis ✨", "Thanks for your review ✨"),
        description: tipAmount > 0
          ? t("Ton pourboire sera versé avec la prestation.", "Your tip will be paid out with the service.")
          : undefined,
      });
      onSubmitted?.();
    } catch (e: any) {
      toast({
        title: t("Erreur", "Error"),
        description: e.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="beauty-scope rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-black">{t("Laisser un avis", "Leave a review")}</h3>
      </div>

      {/* Stars */}
      <div className="mb-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1"
            aria-label={`${n} stars`}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-transform",
                (hover || rating) >= n ? "fill-amber-400 text-amber-400 scale-110" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating > 0 ? `${rating}/5` : ""}</span>
      </div>

      <Input
        placeholder={t("Titre (optionnel)", "Title (optional)")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        className="mb-3"
      />
      <Textarea
        placeholder={t("Raconte ton expérience (obligatoire, min. 10 caractères)…", "Tell us about your experience (required, min 10 chars)…")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={800}
        className="mb-4"
        required
      />

      {/* Tip */}
      <div className="mb-4 rounded-xl bg-primary/5 p-4">
        <div className="mb-2 text-sm font-semibold">
          {t("Ajouter un pourboire ?", "Add a tip?")}
        </div>
        <div className="flex flex-wrap gap-2">
          {TIP_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setTipPct(p); setTipCustom(""); }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                tipPct === p && !tipCustom
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              {p === 0 ? t("Aucun", "None") : `+${p}%`}
            </button>
          ))}
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t("Montant libre", "Custom amount")}
            value={tipCustom}
            onChange={(e) => { setTipCustom(e.target.value); setTipPct(null); }}
            className="h-8 w-32 text-xs"
          />
        </div>
        {tipCustom && Number(tipCustom) > 0 && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            {t("Pourboire", "Tip")}: {formatCurrency(Number(tipCustom), currency as any)}
          </div>
        )}
      </div>

      <Button
        onClick={submit}
        disabled={submitting || rating < 1 || body.trim().length < 10}
        className="w-full gap-1.5 beauty-gradient text-white hover:opacity-90"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t("Publier mon avis", "Publish review")}
      </Button>
    </div>
  );
}
