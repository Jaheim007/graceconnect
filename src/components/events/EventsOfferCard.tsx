import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Loader2, ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  offerId: string;
}

export default function EventsOfferCard({ offerId }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    supabase.from("events_offers").select("*").eq("id", offerId).maybeSingle()
      .then(({ data }) => setOffer(data));
  }, [offerId]);

  if (!offer) return null;
  const isClient = user?.id === offer.client_id;

  const accept = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("events-create-booking", {
      body: { offer_id: offerId, return_origin: window.location.origin },
    });
    if (error || !data?.checkout_url) {
      setLoading(false);
      toast({ title: "Error", description: error?.message || "no checkout url", variant: "destructive" });
      return;
    }
    window.location.href = data.checkout_url;
  };

  const decline = async () => {
    await supabase.from("events_offers").update({ status: "declined" }).eq("id", offerId);
    setOffer({ ...offer, status: "declined" });
  };

  const goToBooking = async () => {
    const { data } = await supabase.from("events_bookings").select("id").eq("offer_id", offerId).maybeSingle();
    if (data?.id) navigate(`/events/booking/${data.id}`);
  };

  const chargeAmount = offer.deposit_amount ?? offer.price;
  const isDeposit = offer.deposit_amount && Number(offer.deposit_amount) < Number(offer.price);

  return (
    <div className="rounded-2xl border-2 border-fuchsia-500/30 bg-fuchsia-50/50 dark:bg-fuchsia-950/20 p-3 text-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-600">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-fuchsia-500 text-white text-[8px]">$</span>
        {t("Devis", "Quote")}
      </div>
      <div className="mt-1 font-bold">{offer.title}</div>
      {offer.description && <div className="mt-0.5 text-xs text-muted-foreground">{offer.description}</div>}
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        {offer.event_date && (
          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(offer.event_date).toLocaleString(isFr ? "fr-FR" : "en-US")}</div>
        )}
        {offer.venue_address && (
          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.venue_address}</div>
        )}
        {offer.guest_count && (
          <div className="flex items-center gap-1"><Users className="h-3 w-3" />{offer.guest_count} {t("invités", "guests")}</div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-lg font-black text-fuchsia-600">{Number(offer.price).toLocaleString()} {offer.currency}</div>
          {isDeposit && (
            <div className="text-[10px] text-muted-foreground">
              {t("Acompte", "Deposit")}: <span className="font-bold text-fuchsia-600">{Number(offer.deposit_amount).toLocaleString()} {offer.currency}</span>
            </div>
          )}
        </div>
        {offer.status === "sent" && isClient && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={decline}>{t("Refuser", "Decline")}</Button>
            <Button size="sm" onClick={accept} disabled={loading}
              className="bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>{isDeposit ? t("Payer l'acompte", "Pay deposit") : t("Accepter et payer", "Accept & pay")}<ArrowRight className="ml-1 h-3 w-3" /></>}
            </Button>
          </div>
        )}
        {offer.status === "sent" && !isClient && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">{t("En attente", "Pending")}</span>
        )}
        {offer.status === "accepted" && (
          <Button size="sm" variant="outline" onClick={goToBooking}>{t("Voir la réservation", "View booking")}</Button>
        )}
        {offer.status === "declined" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Refusé", "Declined")}</span>
        )}
      </div>
    </div>
  );
}
