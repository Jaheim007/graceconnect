import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Calendar as CalIcon, Clock, MapPin, ShieldCheck, MessageCircle,
  CheckCircle2, XCircle, Loader2, Sparkles, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import BeautyReviewForm from "./BeautyReviewForm";
import BeautyOtpPanel from "@/components/beauty/BeautyOtpPanel";

const STATUS_LABELS: Record<
  string,
  { fr: string; en: string; color: string; icon: any }
> = {
  pending_payment: { fr: "Paiement en attente", en: "Payment pending", color: "amber", icon: Loader2 },
  confirmed: { fr: "Confirmé", en: "Confirmed", color: "emerald", icon: CheckCircle2 },
  in_progress: { fr: "En cours", en: "In progress", color: "blue", icon: Sparkles },
  completed: { fr: "Terminé", en: "Completed", color: "primary", icon: CheckCircle2 },
  cancelled: { fr: "Annulé", en: "Cancelled", color: "rose", icon: XCircle },
  no_show: { fr: "No-show", en: "No-show", color: "rose", icon: AlertTriangle },
  disputed: { fr: "Litige", en: "Disputed", color: "rose", icon: AlertTriangle },
  refunded: { fr: "Remboursé", en: "Refunded", color: "muted", icon: XCircle },
};

export default function BeautyBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const returnedFromCheckout = params.get("status") === "success";
  const sessionId = params.get("session_id");

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ["beauty-booking", id],
    enabled: !!id,
    refetchInterval: (q) =>
      (q.state.data as any)?.status === "pending_payment" ? 3000 : false,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_bookings")
        .select(
          "*, beauty_services(title, category, duration_min), beauty_providers(user_id, business_name, avatar_url, city, slug)",
        )
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: existingReview } = useQuery({
    queryKey: ["beauty-review", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_reviews")
        .select("id, rating, title, body")
        .eq("booking_id", id!)
        .maybeSingle();
      return data;
    },
  });

  // Verify Stripe payment on landing from success
  useEffect(() => {
    if (!returnedFromCheckout || !id) return;
    (async () => {
      try {
        await supabase.functions.invoke("beauty-verify-booking", {
          body: { booking_id: id, session_id: sessionId },
        });
        qc.invalidateQueries({ queryKey: ["beauty-booking", id] });
      } catch (e) {
        // Non-fatal — webhook is source of truth
        console.warn("verify-booking failed", e);
      }
    })();
  }, [returnedFromCheckout, id, sessionId, qc]);

  if (isLoading) {
    return (
      <div className="beauty-scope min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-56 rounded-2xl" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="beauty-scope grid min-h-screen place-items-center p-8 text-center">
        <div>
          <div className="text-lg font-bold">{t("Rendez-vous introuvable", "Appointment not found")}</div>
          <Button className="mt-4" onClick={() => navigate("/beauty/bookings")}>
            {t("Mes rendez-vous", "My appointments")}
          </Button>
        </div>
      </div>
    );
  }

  const isClient = user?.id === booking.client_id;
  const service = (booking as any).beauty_services;
  const provider = (booking as any).beauty_providers;
  const currency = (booking.currency ?? "XOF") as any;
  const amount = booking.price_amount ?? booking.price_xof ?? 0;

  const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.pending_payment;
  const StatusIcon = status.icon;

  async function handleConfirmService() {
    if (!id) return;
    // Client confirms the service was rendered → mark completed
    const { error } = await supabase
      .from("beauty_bookings")
      .update({
        status: "completed" as any,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({
        title: t("Erreur", "Error"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    await supabase.from("beauty_booking_events").insert({
      booking_id: id,
      event_type: "client_confirmed",
      payload: {},
    });
    toast({
      title: t("Prestation confirmée", "Service confirmed"),
      description: t(
        "Merci ! Ton avis débloque un cadeau si tu le laisses maintenant.",
        "Thanks! Leave a review now to unlock a small perk.",
      ),
    });
    qc.invalidateQueries({ queryKey: ["beauty-booking", id] });
  }

  async function handleCancel() {
    if (!id) return;
    if (!confirm(t("Annuler cette réservation ?", "Cancel this booking?"))) return;
    const { error } = await supabase
      .from("beauty_bookings")
      .update({
        status: "cancelled" as any,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: t("Erreur", "Error"), description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["beauty-booking", id] });
  }

  const canConfirm = isClient && booking.status === "confirmed" &&
    new Date(booking.slot_end) < new Date();
  const canCancel = booking.status === "confirmed" || booking.status === "pending_payment";

  return (
    <div className="beauty-scope min-h-screen bg-background pb-32 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-3xl items-center gap-3 px-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/beauty/bookings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">
              {service?.title ?? t("Réservation", "Booking")}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {provider?.business_name}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {/* Status card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-5",
            status.color === "emerald" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
            status.color === "amber" && "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
            status.color === "rose" && "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
            status.color === "primary" && "border-primary/30 bg-primary/5",
            status.color === "blue" && "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20",
            status.color === "muted" && "border-border bg-muted/40",
          )}
        >
          <div className="flex items-center gap-3">
            <StatusIcon className={cn(
              "h-6 w-6",
              status.color === "amber" && "animate-spin text-amber-600",
              status.color === "emerald" && "text-emerald-600",
              status.color === "primary" && "text-primary",
              status.color === "rose" && "text-rose-600",
              status.color === "blue" && "text-blue-600",
            )} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Statut", "Status")}
              </div>
              <div className="text-lg font-black">{isFr ? status.fr : status.en}</div>
            </div>
          </div>
          {booking.status === "pending_payment" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(
                "En attente de confirmation du paiement… Cette page se met à jour automatiquement.",
                "Waiting for payment confirmation… This page refreshes automatically.",
              )}
            </p>
          )}
          {booking.status === "confirmed" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(
                "Ton créneau est bloqué. Les contacts sont maintenant partagés dans le chat.",
                "Your slot is locked. Contacts are now shared in the chat.",
              )}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-5">
          <Row
            icon={<CalIcon className="h-4 w-4" />}
            label={t("Créneau", "Slot")}
            value={new Date(booking.slot_start).toLocaleString(isFr ? "fr-FR" : "en-US", {
              weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          />
          <Row
            icon={<Clock className="h-4 w-4" />}
            label={t("Durée", "Duration")}
            value={`${service?.duration_min ?? "—"} min`}
          />
          <Row
            icon={<MapPin className="h-4 w-4" />}
            label={t("Lieu", "Location")}
            value={
              booking.location_type === "home"
                ? `${t("À domicile", "At home")}${booking.address ? ` — ${booking.address}` : ""}`
                : `${t("En salon", "At the salon")}${provider?.city ? ` — ${provider.city}` : ""}`
            }
          />
        </div>

        {/* Amount */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("Montant payé", "Amount paid")}</span>
            <span className="text-lg font-black">{formatCurrency(amount, currency)}</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3 w-3 text-primary" />
            {t(
              "Fonds bloqués en escrow SiteViral jusqu'à confirmation du service.",
              "Funds held in SiteViral escrow until the service is confirmed.",
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => navigate(`/beauty/messages?booking=${booking.id}`)}
          >
            <MessageCircle className="h-4 w-4" />
            {t("Ouvrir le chat", "Open chat")}
          </Button>
          {canConfirm && (
            <Button
              onClick={handleConfirmService}
              className="gap-1.5 beauty-gradient text-white hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("Confirmer la prestation", "Confirm service")}
            </Button>
          )}
          {canCancel && (
            <Button variant="ghost" onClick={handleCancel} className="text-rose-600 hover:text-rose-700">
              {t("Annuler", "Cancel")}
            </Button>
          )}
          {isClient && booking.status === "completed" && (
            <Button
              variant="ghost"
              onClick={async () => {
                const reason = prompt(t("Décris le problème :", "Describe the issue:")) || "";
                if (!reason.trim()) return;
                const { error } = await supabase.from("beauty_disputes").insert({
                  booking_id: booking.id,
                  opened_by: user!.id,
                  reason: reason.trim(),
                  status: "open" as any,
                });
                if (error) {
                  toast({ title: t("Erreur", "Error"), description: error.message, variant: "destructive" });
                } else {
                  toast({
                    title: t("Litige ouvert", "Dispute opened"),
                    description: t("Notre équipe reviendra vers toi sous 24h.", "Our team will reply within 24h."),
                  });
                }
              }}
              className="text-amber-700 hover:text-amber-800"
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              {t("Signaler un problème", "Report an issue")}
            </Button>
          )}
        </div>

        {/* Review form — for the client after completion OR cancellation, once */}
        {isClient &&
          (booking.status === "completed" || booking.status === "cancelled" || booking.status === "no_show") &&
          !existingReview && (
          <BeautyReviewForm
            bookingId={booking.id}
            providerId={booking.provider_id}
            currency={currency}
            onSubmitted={() => {
              qc.invalidateQueries({ queryKey: ["beauty-review", id] });
              refetch();
            }}
          />
        )}

        {existingReview && (
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t("Ton avis publié", "Your review")}</span>
              <span className="ml-auto text-sm font-black">{existingReview.rating}/5 ★</span>
            </div>
            {existingReview.title && <div className="text-sm font-bold">{existingReview.title}</div>}
            {existingReview.body && <p className="mt-1 text-sm text-muted-foreground">{existingReview.body}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
