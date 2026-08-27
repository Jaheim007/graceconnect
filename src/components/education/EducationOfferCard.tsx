import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { educationCategoryLabel } from "@/lib/educationCategories";

interface Props { offerId: string; }

export default function EducationOfferCard({ offerId }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<any>(null);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  useEffect(() => {
    supabase.from("education_offers").select("*").eq("id", offerId).maybeSingle()
      .then(({ data }) => setOffer(data));
  }, [offerId]);

  if (!offer) return null;
  const isStudent = user?.id === offer.student_id;

  const accept = async () => {
    if (!scheduledAt) {
      toast({ title: t("Choisis une date et heure.", "Pick a date and time."), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("education-create-booking", {
      body: { offer_id: offerId, scheduled_at: new Date(scheduledAt).toISOString(), mode: offer.mode, return_origin: window.location.origin },
    });
    if (error || !(data as any)?.checkout_url) {
      setLoading(false);
      toast({ title: "Error", description: error?.message || "no checkout url", variant: "destructive" });
      return;
    }
    window.location.href = (data as any).checkout_url;
  };

  const decline = async () => {
    await supabase.from("education_offers").update({ status: "declined" }).eq("id", offerId);
    setOffer({ ...offer, status: "declined" });
  };

  const goToBooking = async () => {
    const { data } = await supabase.from("education_bookings").select("id").eq("offer_id", offerId).maybeSingle();
    if (data?.id) navigate(`/learn/booking/${data.id}`);
  };

  return (
    <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 p-3 text-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-teal-500 text-white text-[8px]">$</span>
        {t("Offre", "Offer")}
      </div>
      <div className="mt-1 font-bold">{educationCategoryLabel(offer.subject, locale)}</div>
      {offer.description && <div className="mt-0.5 text-xs text-muted-foreground">{offer.description}</div>}
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />
          {offer.session_count} × {offer.duration_min}min ({offer.mode === "online" ? (isFr ? "en ligne" : "online") : (isFr ? "à domicile" : "in-person")})
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-lg font-black text-teal-600">{Number(offer.total_xof).toLocaleString()} XOF</div>
          <div className="text-[10px] text-muted-foreground">
            {Number(offer.rate_xof).toLocaleString()} × {offer.session_count}
          </div>
        </div>
        {offer.status === "pending" && isStudent && (
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-8 text-xs" />
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={decline}>{t("Refuser", "Decline")}</Button>
              <Button size="sm" onClick={accept} disabled={loading}
                className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>{t("Payer", "Pay")} <ArrowRight className="ml-1 h-3 w-3" /></>}
              </Button>
            </div>
          </div>
        )}
        {offer.status === "pending" && !isStudent && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">{t("En attente", "Pending")}</span>
        )}
        {offer.status === "accepted" && (
          <Button size="sm" variant="outline" onClick={goToBooking}>{t("Voir la séance", "View session")}</Button>
        )}
        {offer.status === "declined" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Refusé", "Declined")}</span>
        )}
      </div>
    </div>
  );
}
