import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  extraChargeId: string;
}

export default function EventsExtraChargeCard({ extraChargeId }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [ec, setEc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("events_extra_charges").select("*").eq("id", extraChargeId).maybeSingle()
      .then(({ data }) => setEc(data));
  }, [extraChargeId]);

  if (!ec) return null;
  const isClient = user?.id === ec.client_id;

  const accept = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("events-extra-charge", {
      body: { action: "accept", extra_charge_id: extraChargeId, return_origin: window.location.origin },
    });
    if (error || !data?.checkout_url) {
      setLoading(false);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    window.location.href = data.checkout_url;
  };

  const decline = async () => {
    setLoading(true);
    await supabase.functions.invoke("events-extra-charge", {
      body: { action: "decline", extra_charge_id: extraChargeId },
    });
    setEc({ ...ec, status: "declined" });
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-sm">
      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{t("Supplément demandé", "Extra charge")}</div>
      <div className="mt-1 font-semibold">{ec.description || ec.label}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-lg font-black text-amber-600">+{Number(ec.amount).toLocaleString()} {ec.currency}</span>
        {ec.status === "proposed" && isClient && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={decline} disabled={loading}><X className="h-3 w-3 mr-1" />{t("Refuser", "Decline")}</Button>
            <Button size="sm" onClick={accept} disabled={loading} className="bg-amber-500 text-white hover:bg-amber-600">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />{t("Payer", "Pay")}</>}
            </Button>
          </div>
        )}
        {ec.status === "paid" && <span className="text-[10px] font-bold uppercase text-emerald-600">{t("Payé", "Paid")}</span>}
        {ec.status === "declined" && <span className="text-[10px] font-bold uppercase text-muted-foreground">{t("Refusé", "Declined")}</span>}
        {ec.status === "proposed" && !isClient && <span className="text-[10px] font-bold uppercase text-amber-600">{t("En attente", "Pending")}</span>}
      </div>
    </div>
  );
}
