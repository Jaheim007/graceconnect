import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, Check, X, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
  currency: string;
  isClient: boolean;
  isProvider: boolean;
  bookingStarted: boolean;
  bookingCompleted: boolean;
}

export default function BeautyExtraCharges({
  bookingId, currency, isClient, isProvider, bookingStarted, bookingCompleted,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const { data: charges, refetch, isLoading } = useQuery({
    queryKey: ["beauty-extra-charges", bookingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_extra_charges" as any)
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    refetchInterval: 5000,
  });

  const canRequest = isProvider && bookingStarted && !bookingCompleted;
  const hasAny = (charges?.length ?? 0) > 0;

  if (!hasAny && !canRequest) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-black">{t("Suppléments", "Extras")}</h3>
        {canRequest && <RequestButton bookingId={bookingId} currency={currency} onCreated={refetch} />}
      </div>

      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      <div className="space-y-2">
        {(charges ?? []).map((c) => (
          <ExtraChargeRow
            key={c.id}
            charge={c}
            isClient={isClient}
            isProvider={isProvider}
            onChanged={refetch}
          />
        ))}
      </div>
    </div>
  );
}

function RequestButton({ bookingId, currency, onCreated }: { bookingId: string; currency: string; onCreated: () => void }) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const amt = Math.floor(Number(amount) || 0);
    if (amt < 100 || description.trim().length < 3) {
      toast({ title: t("Montant et description requis", "Amount and description required"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("beauty-extra-charge", {
        body: { action: "create", booking_id: bookingId, amount: amt, description: description.trim() },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
      toast({ title: t("Supplément envoyé", "Extra charge sent") });
      setOpen(false); setAmount(""); setDescription("");
      onCreated();
    } catch (e: any) {
      toast({ title: t("Erreur", "Error"), description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 beauty-gradient text-white">
          <Plus className="h-4 w-4" /> {t("Demander un supplément", "Request extra")}
        </Button>
      </DialogTrigger>
      <DialogContent className="beauty-scope">
        <DialogHeader>
          <DialogTitle>{t("Nouveau supplément", "New extra charge")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("Description", "Description")}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Ex: Faux cils, coiffure express…", "Ex: Lashes, quick styling…")}
              maxLength={120}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("Montant", "Amount")} ({currency})
            </label>
            <Input
              type="number" inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
            {t(
              "La cliente reçoit une notification et doit accepter et payer. Sans réponse en 30 min, la demande expire.",
              "The client is notified and must accept and pay. If unanswered for 30 min, the request expires.",
            )}
          </div>
          <Button onClick={submit} disabled={busy} className="w-full beauty-gradient text-white">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="ml-1.5">{t("Envoyer la demande", "Send request")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExtraChargeRow({ charge, isClient, isProvider, onChanged }: { charge: any; isClient: boolean; isProvider: boolean; onChanged: () => void }) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [busy, setBusy] = useState<string | null>(null);

  const isPending = charge.status === "pending";
  const expired = isPending && new Date(charge.expires_at).getTime() < Date.now();

  async function accept() {
    setBusy("accept");
    try {
      const { data, error } = await supabase.functions.invoke("beauty-extra-charge", {
        body: { action: "accept", extra_charge_id: charge.id },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
      const url = (data as any).checkout_url;
      if (url) window.location.href = url;
    } catch (e: any) {
      toast({ title: t("Erreur", "Error"), description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  async function decline() {
    if (!confirm(t("Refuser ce supplément ?", "Decline this extra?"))) return;
    setBusy("decline");
    try {
      const { data, error } = await supabase.functions.invoke("beauty-extra-charge", {
        body: { action: "decline", extra_charge_id: charge.id },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
      onChanged();
    } catch (e: any) {
      toast({ title: t("Erreur", "Error"), description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  const statusMeta: Record<string, { label: string; className: string; Icon: any }> = {
    pending: { label: t("En attente", "Pending"), className: "bg-amber-500/10 text-amber-700", Icon: Clock },
    accepted: { label: t("Accepté", "Accepted"), className: "bg-blue-500/10 text-blue-700", Icon: Check },
    paid: { label: t("Payé", "Paid"), className: "bg-emerald-500/10 text-emerald-700", Icon: CheckCircle2 },
    declined: { label: t("Refusé", "Declined"), className: "bg-rose-500/10 text-rose-700", Icon: X },
    expired: { label: t("Expiré", "Expired"), className: "bg-muted text-muted-foreground", Icon: Clock },
    cancelled: { label: t("Annulé", "Cancelled"), className: "bg-muted text-muted-foreground", Icon: X },
  };
  const meta = statusMeta[expired ? "expired" : charge.status] ?? statusMeta.pending;
  const StatusIcon = meta.Icon;

  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{charge.description}</div>
          <div className="mt-0.5 text-lg font-black tabular-nums">
            +{formatCurrency(charge.amount, charge.currency as any)}
          </div>
        </div>
        <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", meta.className)}>
          <StatusIcon className="h-3 w-3" />{meta.label}
        </span>
      </div>

      {isClient && isPending && !expired && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm" onClick={accept} disabled={busy !== null}
            className="flex-1 gap-1.5 beauty-gradient text-white"
          >
            {busy === "accept" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {t("Accepter & payer", "Accept & pay")}
          </Button>
          <Button
            size="sm" variant="ghost" onClick={decline} disabled={busy !== null}
            className="text-rose-600"
          >
            <X className="h-3.5 w-3.5" />
            {t("Refuser", "Decline")}
          </Button>
        </div>
      )}

      {isProvider && isPending && !expired && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {t("En attente de la réponse du client…", "Waiting for the client's response…")}
        </div>
      )}
    </div>
  );
}
