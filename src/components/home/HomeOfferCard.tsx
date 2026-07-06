import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  offerId: string;
}

export default function HomeOfferCard({ offerId }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  // Fetch on mount
  useState(() => {
    supabase.from("home_offers").select("*").eq("id", offerId).maybeSingle().then(({ data }) => setOffer(data));
  });

  if (!offer) return null;
  const isClient = user?.id === offer.client_id;

  const accept = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("home-create-booking", {
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
    await supabase.from("home_offers").update({ status: "declined" }).eq("id", offerId);
    setOffer({ ...offer, status: "declined" });
  };

  const goToBooking = async () => {
    const { data } = await supabase.from("home_bookings").select("id").eq("offer_id", offerId).maybeSingle();
    if (data?.id) navigate(`/home/booking/${data.id}`);
  };

  return (
    <div className="rounded-2xl border-2 border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 p-3 text-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-white text-[8px]">$</span>
        {t("Devis", "Quote")}
      </div>
      <div className="mt-1 font-bold">{offer.title}</div>
      {offer.description && <div className="mt-0.5 text-xs text-muted-foreground">{offer.description}</div>}
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        {offer.scheduled_for && (
          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(offer.scheduled_for).toLocaleString(isFr ? "fr-FR" : "en-US")}</div>
        )}
        {offer.address && (
          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.address}</div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-lg font-black text-sky-600">{Number(offer.price).toLocaleString()} {offer.currency}</span>
        {offer.status === "sent" && isClient && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={decline}>{t("Refuser", "Decline")}</Button>
            <Button size="sm" onClick={accept} disabled={loading}
              className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>{t("Accepter et payer", "Accept & pay")}<ArrowRight className="ml-1 h-3 w-3" /></>}
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
