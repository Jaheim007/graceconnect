import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, ShieldAlert, Info, Zap, Calendar, Home, Store, Check, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  redacted_body: string | null;
  contains_contact_attempt: boolean;
  created_at: string;
  read_at: string | null;
  kind?: string | null;
  offer_id?: string | null;
};

type Offer = {
  id: string;
  conversation_id: string;
  provider_id: string;
  client_id: string;
  service_id: string;
  slot_start: string;
  slot_end: string;
  location_type: "salon" | "home";
  address: string | null;
  note: string | null;
  price_amount: number;
  currency: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  booking_id: string | null;
};

export default function BeautyConversation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ["beauty-conv", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beauty_conversations")
        .select(
          "id, provider_id, client_id, booking_id, beauty_providers(id, user_id, business_name, avatar_url, slug)",
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const providerRel = (conversation as any)?.beauty_providers;
  const iAmProvider = !!providerRel && providerRel.user_id === user?.id;

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ["beauty-messages", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_messages")
        .select("*")
        .eq("conversation_id", id!)
        .order("created_at", { ascending: true })
        .limit(200);
      return (data ?? []) as Message[];
    },
  });

  const { data: offers } = useQuery({
    queryKey: ["beauty-offers", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_offers")
        .select("*")
        .eq("conversation_id", id!);
      return (data ?? []) as Offer[];
    },
  });

  const offersById = useMemo(() => {
    const m = new Map<string, Offer>();
    (offers ?? []).forEach((o) => m.set(o.id, o));
    return m;
  }, [offers]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`beauty-msgs-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beauty_messages", filter: `conversation_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["beauty-messages", id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beauty_offers", filter: `conversation_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["beauty-offers", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length, offers?.length]);

  useEffect(() => {
    if (!id || !user || !messages?.length) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    supabase.from("beauty_messages").update({ read_at: new Date().toISOString() }).in("id", unread).then();
  }, [id, user, messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !id || !user || sending) return;
    setSending(true);
    // Optimistic append so the sender sees their message instantly,
    // even before realtime echoes it back.
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: id,
      sender_id: user.id,
      body,
      redacted_body: body,
      contains_contact_attempt: false,
      created_at: new Date().toISOString(),
      read_at: null,
      kind: "text",
      offer_id: null,
    };
    qc.setQueryData<Message[]>(["beauty-messages", id], (prev) => [...(prev ?? []), optimistic]);
    setText("");

    const { data: inserted, error } = await supabase
      .from("beauty_messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        body,
        redacted_body: body,
        kind: "text",
      } as any)
      .select("*")
      .single();
    setSending(false);
    if (error) {
      // Roll back optimistic message
      qc.setQueryData<Message[]>(["beauty-messages", id], (prev) =>
        (prev ?? []).filter((m) => m.id !== tempId),
      );
      setText(body);
      const msg = (error as any)?.message ?? "";
      if (msg.includes("beauty_chat_blocked")) {
        const reason = msg.split("beauty_chat_blocked:")[1]?.trim() ?? "contact";
        const label: Record<string, [string, string]> = {
          phone: ["Numéro de téléphone détecté — message bloqué.", "Phone number detected — message blocked."],
          email: ["Adresse email détectée — message bloqué.", "Email detected — message blocked."],
          social_handle: ["Réseau social détecté — message bloqué.", "Social handle detected — message blocked."],
          payment_bypass: ["Paiement hors plateforme détecté — message bloqué.", "Off-platform payment detected — message blocked."],
        };
        const [fr, en] = label[reason] ?? ["Message bloqué par la sécurité du chat.", "Message blocked by chat safety."];
        toast.error(t(fr, en), {
          description: t(
            "Restez dans le chat. Tout paiement se fait via SiteViral pour votre protection.",
            "Stay in chat. All payments go through SiteViral for your protection.",
          ),
        });
        return;
      }
      toast.error(t("Envoi impossible", "Failed to send"));
      return;
    }
    // Replace optimistic with real row
    qc.setQueryData<Message[]>(["beauty-messages", id], (prev) => {
      const withoutTemp = (prev ?? []).filter((m) => m.id !== tempId);
      if (inserted && !withoutTemp.some((m) => m.id === (inserted as any).id)) {
        return [...withoutTemp, inserted as Message];
      }
      return withoutTemp;
    });
    qc.invalidateQueries({ queryKey: ["beauty-messages", id] });
  };

  if (convLoading) {
    return (
      <div className="min-h-dvh bg-background p-4 space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("Conversation introuvable.", "Conversation not found.")}
          </p>
          <Button className="mt-4" onClick={() => navigate("/beauty/messages")}>
            {t("Retour", "Back")}
          </Button>
        </Card>
      </div>
    );
  }

  const headerLabel = iAmProvider ? t("Client", "Client") : providerRel?.business_name;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/beauty/messages")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {!iAmProvider && providerRel?.slug ? (
            <Link to={`/beauty/p/${providerRel.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={providerRel?.avatar_url ?? undefined} />
                <AvatarFallback>{(headerLabel ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">{headerLabel}</div>
                <div className="text-[10px] text-muted-foreground">{t("Voir le profil", "View profile")}</div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{(headerLabel ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="font-medium truncate">{headerLabel}</div>
            </div>
          )}
          {conversation.booking_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/beauty/bookings/${conversation.booking_id}`)}
            >
              {t("Réservation", "Booking")}
            </Button>
          )}
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {t(
                "Restez dans le chat — le paiement se fait via l'offre envoyée par le pro. Numéros et emails sont masqués.",
                "Stay in chat — payment goes through the pro's offer. Phone numbers and emails are masked.",
              )}
            </span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4 space-y-2">
          {msgLoading ? (
            <>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
            </>
          ) : !messages?.length ? (
            <div className="text-center text-xs text-muted-foreground py-10 flex flex-col items-center gap-2">
              <Info className="h-5 w-5" />
              {iAmProvider
                ? t(
                    "Bienvenue ! Envoie un mot ou envoie directement une offre de rendez-vous.",
                    "Welcome! Say hi or send an appointment offer right away.",
                  )
                : t(
                    "Discute avec le pro pour caler ton rendez-vous.",
                    "Chat with the pro to set up your appointment.",
                  )}
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              if (m.kind === "offer" && m.offer_id) {
                const offer = offersById.get(m.offer_id);
                return (
                  <OfferBubble
                    key={m.id}
                    offer={offer}
                    mine={mine}
                    iAmProvider={iAmProvider}
                    isFr={isFr}
                    onChanged={() => {
                      qc.invalidateQueries({ queryKey: ["beauty-offers", id] });
                    }}
                  />
                );
              }
              const shown = m.contains_contact_attempt ? m.redacted_body ?? m.body : m.body;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm",
                    )}
                  >
                    <div>{shown}</div>
                    {m.contains_contact_attempt && (
                      <div
                        className={cn(
                          "mt-1 text-[10px] flex items-center gap-1",
                          mine ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        {t("Contact masqué", "Contact masked")}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-0.5 text-[10px]",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {new Date(m.created_at).toLocaleTimeString(isFr ? "fr-FR" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl px-3 py-2 flex items-end gap-2">
          {iAmProvider && (
            <SendOfferSheet
              conversationId={id!}
              providerId={providerRel.id}
              clientId={conversation.client_id}
              onSent={() => {
                qc.invalidateQueries({ queryKey: ["beauty-messages", id] });
                qc.invalidateQueries({ queryKey: ["beauty-offers", id] });
              }}
              isFr={isFr}
            />
          )}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("Écrire un message…", "Write a message…")}
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={send} disabled={!text.trim() || sending} size="icon" className="h-11 w-11 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Offer bubble ----------------
function OfferBubble({
  offer,
  mine,
  iAmProvider,
  isFr,
  onChanged,
}: {
  offer: Offer | undefined;
  mine: boolean;
  iAmProvider: boolean;
  isFr: boolean;
  onChanged: () => void;
}) {
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"pay" | "decline" | "cancel" | null>(null);

  if (!offer) {
    return (
      <div className="mx-auto max-w-[85%] rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        {t("Offre indisponible.", "Offer unavailable.")}
      </div>
    );
  }

  const pay = async () => {
    setBusy("pay");
    try {
      const { data, error } = await supabase.functions.invoke("beauty-create-booking", {
        body: {
          service_id: offer.service_id,
          slot_start: offer.slot_start,
          slot_end: offer.slot_end,
          location_type: offer.location_type,
          address: offer.address,
          return_origin: window.location.origin,
        },
      });
      if (error || !(data as any)?.checkout_url) {
        throw new Error((error as any)?.message || (data as any)?.error || "checkout error");
      }
      // Link offer → booking optimistically
      await supabase
        .from("beauty_offers")
        .update({ booking_id: (data as any).booking_id, status: "accepted" })
        .eq("id", offer.id);
      window.location.href = (data as any).checkout_url;
    } catch (e: any) {
      toast.error(e?.message ?? t("Paiement impossible", "Payment failed"));
    } finally {
      setBusy(null);
    }
  };

  const decline = async () => {
    setBusy("decline");
    await supabase.from("beauty_offers").update({ status: "declined" }).eq("id", offer.id);
    setBusy(null);
    onChanged();
  };

  const cancel = async () => {
    setBusy("cancel");
    await supabase.from("beauty_offers").update({ status: "cancelled" }).eq("id", offer.id);
    setBusy(null);
    onChanged();
  };

  const statusChip: Record<Offer["status"], { label: string; cls: string }> = {
    pending: { label: t("En attente", "Pending"), cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
    accepted: { label: t("Payée", "Paid"), cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
    declined: { label: t("Refusée", "Declined"), cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
    expired: { label: t("Expirée", "Expired"), cls: "bg-muted text-muted-foreground" },
    cancelled: { label: t("Annulée", "Cancelled"), cls: "bg-muted text-muted-foreground" },
  };
  const chip = statusChip[offer.status];

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border p-3 space-y-2 text-sm",
          mine ? "border-primary/40 bg-primary/5" : "border-border bg-card",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="font-bold">{t("Offre de rendez-vous", "Booking offer")}</div>
          <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", chip.cls)}>
            {chip.label}
          </span>
        </div>
        <div className="rounded-lg bg-background/50 p-2 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">
              {new Date(offer.slot_start).toLocaleString(isFr ? "fr-FR" : "en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {offer.location_type === "home" ? <Home className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
            <span>
              {offer.location_type === "home"
                ? t("À domicile", "At home")
                : t("En salon", "At salon")}
              {offer.address ? ` · ${offer.address}` : ""}
            </span>
          </div>
          {offer.note && <div className="text-muted-foreground italic">"{offer.note}"</div>}
          <div className="pt-1 text-lg font-black text-foreground">
            {formatCurrency(offer.price_amount, offer.currency as any)}
          </div>
        </div>

        {offer.status === "pending" && !iAmProvider && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-9" onClick={pay} disabled={busy !== null}>
              {busy === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {t("Payer & confirmer", "Pay & confirm")}
            </Button>
            <Button size="sm" variant="outline" onClick={decline} disabled={busy !== null}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {offer.status === "pending" && iAmProvider && (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={cancel} disabled={busy !== null}>
              {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Annuler l'offre", "Cancel offer")}
            </Button>
          </div>
        )}
        {offer.status === "accepted" && offer.booking_id && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/beauty/bookings/${offer.booking_id}`)}
          >
            {t("Voir la réservation", "View booking")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------- Send offer sheet (provider) ----------------
function SendOfferSheet({
  conversationId,
  providerId,
  clientId,
  onSent,
  isFr,
}: {
  conversationId: string;
  providerId: string;
  clientId: string;
  onSent: () => void;
  isFr: boolean;
}) {
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationType, setLocationType] = useState<"salon" | "home">("salon");
  const [address, setAddress] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const { data: services } = useQuery({
    queryKey: ["beauty-provider-services-for-offer", providerId],
    enabled: !!providerId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_services")
        .select("id, title, price_amount, price_xof, currency, duration_min, at_home, at_salon")
        .eq("provider_id", providerId)
        .eq("active", true);
      return data ?? [];
    },
  });

  const selectedService = (services ?? []).find((s: any) => s.id === serviceId);

  const submit = async () => {
    if (!user || !serviceId || !date || !time || !selectedService) {
      toast.error(t("Champs manquants", "Missing fields"));
      return;
    }
    const startISO = new Date(`${date}T${time}`).toISOString();
    const durationMin = selectedService.duration_min ?? 60;
    const endISO = new Date(new Date(startISO).getTime() + durationMin * 60 * 1000).toISOString();
    const currency = selectedService.currency ?? "XOF";
    const basePrice = selectedService.price_amount ?? selectedService.price_xof ?? 0;
    const price = priceOverride ? parseInt(priceOverride, 10) : basePrice;
    if (!price || price < 100) {
      toast.error(t("Prix invalide", "Invalid price"));
      return;
    }

    setSending(true);

    const { data: offer, error: offErr } = await supabase
      .from("beauty_offers")
      .insert({
        conversation_id: conversationId,
        provider_id: providerId,
        client_id: clientId,
        service_id: serviceId,
        slot_start: startISO,
        slot_end: endISO,
        location_type: locationType,
        address: locationType === "home" ? address || null : null,
        note: note || null,
        price_amount: price,
        currency,
        status: "pending",
      })
      .select("id")
      .single();

    if (offErr || !offer) {
      setSending(false);
      toast.error(t("Envoi de l'offre impossible", "Failed to send offer"));
      return;
    }

    const summary = `📋 ${t("Offre envoyée", "Offer sent")} — ${selectedService.title} · ${new Date(
      startISO,
    ).toLocaleString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${formatCurrency(
      price,
      currency as any,
    )}`;

    await supabase.from("beauty_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: summary,
      redacted_body: summary,
      kind: "offer",
      offer_id: offer.id,
    } as any);

    setSending(false);
    setOpen(false);
    setServiceId("");
    setDate("");
    setTime("");
    setNote("");
    setPriceOverride("");
    toast.success(t("Offre envoyée", "Offer sent"));
    onSent();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" title={t("Envoyer une offre", "Send offer")}>
          <Zap className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("Envoyer une offre de rendez-vous", "Send an appointment offer")}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">{t("Service", "Service")}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("Choisir un service", "Pick a service")} />
              </SelectTrigger>
              <SelectContent>
                {(services ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} — {formatCurrency(s.price_amount ?? s.price_xof, (s.currency ?? "XOF") as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("Date", "Date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("Heure", "Time")}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("Lieu", "Location")}</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={locationType === "salon" ? "default" : "outline"}
                onClick={() => setLocationType("salon")}
                className="h-9 text-xs"
              >
                <Store className="mr-1 h-4 w-4" /> {t("Salon", "Salon")}
              </Button>
              <Button
                type="button"
                variant={locationType === "home" ? "default" : "outline"}
                onClick={() => setLocationType("home")}
                className="h-9 text-xs"
              >
                <Home className="mr-1 h-4 w-4" /> {t("Domicile", "Home")}
              </Button>
            </div>
          </div>
          {locationType === "home" && (
            <div>
              <Label className="text-xs">{t("Adresse", "Address")}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
            </div>
          )}
          <div>
            <Label className="text-xs">
              {t("Prix (laisse vide pour prix du service)", "Price (leave blank for service price)")}
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder={
                selectedService
                  ? String(selectedService.price_amount ?? selectedService.price_xof ?? "")
                  : ""
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t("Note (optionnelle)", "Note (optional)")}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" />
          </div>
          <Button className="w-full" onClick={submit} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Envoyer l'offre", "Send offer")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
