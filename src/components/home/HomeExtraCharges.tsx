import { useState } from "react";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";

interface Props {
  bookingId: string;
  currency: string;
  isClient: boolean;
  isProvider: boolean;
  bookingStarted: boolean;
  bookingCompleted: boolean;
}

export default function HomeExtraCharges({ bookingId, currency, isClient, isProvider, bookingStarted, bookingCompleted }: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: charges } = useQuery({
    queryKey: ["home-extras", bookingId],
    queryFn: async () => {
      const { data } = await supabase.from("home_extra_charges")
        .select("*").eq("booking_id", bookingId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = async () => {
    setSaving(true);
    const { error } = await supabase.functions.invoke("home-extra-charge", {
      body: { action: "create", booking_id: bookingId, amount: Number(amount), description: description.trim() },
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false); setAmount(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["home-extras", bookingId] });
    toast({ title: t("Supplément envoyé", "Extra charge sent") });
  };

  const respond = async (id: string, action: "accept" | "decline") => {
    const { data, error } = await supabase.functions.invoke("home-extra-charge", {
      body: { action, extra_charge_id: id, return_origin: window.location.origin },
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (action === "accept" && (data as any)?.checkout_url) {
      window.location.href = (data as any).checkout_url; return;
    }
    qc.invalidateQueries({ queryKey: ["home-extras", bookingId] });
  };

  const list = charges ?? [];
  if (!list.length && !isProvider) return null;
  if (!list.length && isProvider && (!bookingStarted || bookingCompleted)) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{t("Suppléments", "Extra charges")}</h3>
        {isProvider && bookingStarted && !bookingCompleted && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />{t("Ajouter", "Add")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>{t("Nouveau supplément", "New extra charge")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("Motif (ex : pièce supplémentaire)", "Reason (e.g. extra part)")} />
                <div className="flex gap-2 items-center">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("Montant", "Amount")} className="flex-1" />
                  <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
                </div>
                <Button onClick={create} disabled={saving || !amount || description.trim().length < 3}
                  className="w-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Envoyer", "Send")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("Aucun supplément.", "No extras.")}</p>
        )}
        {list.map((c: any) => (
          <div key={c.id} className="rounded-xl border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.description || c.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.status}</div>
              </div>
              <div className="text-right font-black text-amber-600">+{Number(c.amount).toLocaleString()} {c.currency}</div>
            </div>
            {c.status === "proposed" && isClient && (
              <div className="mt-2 flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => respond(c.id, "decline")}>{t("Refuser", "Decline")}</Button>
                <Button size="sm" onClick={() => respond(c.id, "accept")} className="bg-amber-500 text-white hover:bg-amber-600">{t("Payer", "Pay")}</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
