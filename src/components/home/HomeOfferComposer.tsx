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

interface Props {
  conversationId: string;
  providerId: string;
  clientId: string;
  currency: string;
}

export default function HomeOfferComposer({ conversationId, providerId, clientId, currency }: Props) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!title.trim() || !price) {
      toast({ title: t("Titre et prix requis", "Title and price required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: offer, error } = await supabase.from("home_offers").insert({
      conversation_id: conversationId,
      provider_id: providerId,
      client_id: clientId,
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      currency,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      address: address.trim() || null,
      status: "sent",
    }).select("id").single();
    if (error || !offer) {
      setSaving(false);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    await supabase.from("home_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      kind: "offer",
      offer_id: offer.id,
      body: `${title.trim()} — ${price} ${currency}`,
    });
    await supabase.from("home_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
    setSaving(false); setOpen(false);
    setTitle(""); setDescription(""); setPrice(""); setScheduledFor(""); setAddress("");
    toast({ title: t("Devis envoyé", "Quote sent") });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />{t("Envoyer un devis", "Send a quote")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Nouveau devis", "New quote")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Titre", "Title")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Ex : Réparation fuite", "E.g. Leak repair")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Description", "Description")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold">{t("Prix", "Price")} ({currency})</label>
              <Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold">{t("Date/heure", "Date/time")}</label>
              <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Adresse", "Address")}</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Envoyer", "Send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
