import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate, useParams, useSearchParams } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, ShieldCheck, MessageCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { homeVerifyBooking } from "@/lib/verticals/bookings.functions";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import HomeOtpPanel from "@/components/home/HomeOtpPanel";
import HomeExtraCharges from "@/components/home/HomeExtraCharges";
import HomeReviewForm from "@/components/home/HomeReviewForm";
import { askConfirm } from '@/components/ui/confirm-dialog';

const STATUS: Record<string, { fr: string; en: string; color: string; icon: any }> = {
  pending_payment: { fr: "Paiement en attente", en: "Payment pending", color: "amber", icon: Loader2 },
  pending: { fr: "En attente", en: "Pending", color: "amber", icon: Loader2 },
  confirmed: { fr: "Confirmé", en: "Confirmed", color: "sky", icon: CheckCircle2 },
  en_route: { fr: "En route", en: "En route", color: "sky", icon: Zap },
  in_progress: { fr: "En cours", en: "In progress", color: "sky", icon: Zap },
  completed: { fr: "Terminé", en: "Completed", color: "emerald", icon: CheckCircle2 },
  cancelled: { fr: "Annulé", en: "Cancelled", color: "rose", icon: XCircle },
  disputed: { fr: "Litige", en: "Disputed", color: "rose", icon: AlertTriangle },
  refunded: { fr: "Remboursé", en: "Refunded", color: "muted", icon: XCircle },
};

export default function HomeBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const returnedSuccess = params.get("status") === "success";
  const sessionId = params.get("session_id");

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ["home-booking", id],
    enabled: !!id,
    refetchInterval: (q) => (q.state.data as any)?.status === "pending_payment" ? 3000 : false,
    queryFn: async () => {
      const { data } = await supabase.from("home_bookings")
        .select("*, home_providers(user_id, business_name, avatar_url, city, slug)")
        .eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: review } = useQuery({
    queryKey: ["home-review", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("home_reviews").select("*").eq("booking_id", id!).maybeSingle();
      return data;
    },
  });

  // Realtime: refresh when booking row changes
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`home-bk-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "home_bookings", filter: `id=eq.${id}` },
        () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  useEffect(() => {
    if (!returnedSuccess || !id) return;
    (async () => {
      try {
        await runVerifyBooking({ data: { booking_id: id, session_id: sessionId } });
        qc.invalidateQueries({ queryKey: ["home-booking", id] });
      } catch (e) { console.warn(e); }
    })();
  }, [returnedSuccess, id, sessionId, qc]);

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  if (!booking) return (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <div className="text-lg font-bold">{t("Réservation introuvable", "Booking not found")}</div>
        <Button className="mt-4" onClick={() => navigate("/home/bookings")}>{t("Mes demandes", "My bookings")}</Button>
      </div>
    </div>
  );

  const isClient = user?.id === booking.client_id;
  const provider = (booking as any).home_providers;
  const isProvider = !!user?.id && provider?.user_id === user.id;
  const status = STATUS[booking.status] ?? STATUS.pending_payment;
  const StatusIcon = status.icon;

  const cancel = async () => {
    if (!(await askConfirm(t("Annuler cette réservation ?", "Cancel this booking?")))) return;
    const { error } = await supabase.from("home_bookings").update({
      status: "cancelled", cancelled_at: new Date().toISOString(),
    }).eq("id", booking.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["home-booking", id] });
  };

  const canCancel = ["pending_payment", "pending", "confirmed"].includes(booking.status) && !booking.started_at;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home/bookings")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{provider?.business_name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {booking.scheduled_for ? new Date(booking.scheduled_for).toLocaleString(isFr ? "fr-FR" : "en-US") : "—"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        <div className={cn(
          "rounded-2xl border p-5",
          status.color === "sky" && "border-sky-200 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20",
          status.color === "emerald" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
          status.color === "amber" && "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
          status.color === "rose" && "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
          status.color === "muted" && "border-border bg-muted/40",
        )}>
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("h-6 w-6",
              status.color === "amber" && "animate-spin text-amber-600",
              status.color === "sky" && "text-sky-600",
              status.color === "emerald" && "text-emerald-600",
              status.color === "rose" && "text-rose-600",
            )} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Statut", "Status")}</div>
              <div className="text-lg font-black">{isFr ? status.fr : status.en}</div>
            </div>
          </div>
          {booking.status === "pending_payment" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("En attente de confirmation du paiement…", "Waiting for payment confirmation…")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-sm">
          {booking.scheduled_for && (
            <div className="flex gap-3"><Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">{t("Créneau", "Slot")}</div>
                <div className="font-semibold">{new Date(booking.scheduled_for).toLocaleString(isFr ? "fr-FR" : "en-US")}</div>
              </div>
            </div>
          )}
          {booking.address && (
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">{t("Adresse", "Address")}</div>
                <div className="font-semibold">{booking.address}</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t("Montant", "Amount")}</span>
            <span className="text-lg font-black">{Number(booking.price).toLocaleString()} {booking.currency}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3 w-3 text-sky-500" />
            {t("Fonds bloqués en escrow SiteViral jusqu'à la fin du travail.",
               "Funds held in SiteViral escrow until the work is done.")}
          </p>
        </div>

        {(isClient || isProvider) && (
          <HomeOtpPanel booking={booking} isClient={isClient} isProvider={isProvider}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["home-booking", id] }); refetch(); }} />
        )}

        {(isClient || isProvider) && (
          <HomeExtraCharges
            bookingId={booking.id}
            currency={booking.currency}
            isClient={isClient}
            isProvider={isProvider}
            bookingStarted={!!booking.started_at}
            bookingCompleted={!!booking.completed_at}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => {
            const { data: conv } = await supabase.from("home_conversations").select("id")
              .eq("client_id", booking.client_id).eq("provider_id", booking.provider_id).maybeSingle();
            if (conv?.id) navigate(`/home/messages/${conv.id}`);
          }}>
            <MessageCircle className="h-4 w-4 mr-1.5" />{t("Ouvrir le chat", "Open chat")}
          </Button>
          {canCancel && (
            <Button variant="ghost" onClick={cancel} className="text-rose-600 hover:text-rose-700">{t("Annuler", "Cancel")}</Button>
          )}
          {(isClient || isProvider) && (booking.status === "completed" || booking.status === "disputed") && (
            <Button variant="ghost" className="text-amber-700"
              onClick={async () => {
                const reason = prompt(t("Décris le problème :", "Describe the issue:")) || "";
                if (!reason.trim()) return;
                const { error } = await supabase.from("home_disputes").insert({
                  booking_id: booking.id, opened_by: user!.id, reason: reason.trim(), status: "open",
                });
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                else toast({ title: t("Litige ouvert", "Dispute opened") });
              }}>
              <AlertTriangle className="h-4 w-4 mr-1.5" />{t("Signaler un problème", "Report an issue")}
            </Button>
          )}
        </div>

        {isClient && booking.status === "completed" && !review && (
          <HomeReviewForm bookingId={booking.id} providerId={booking.provider_id}
            onSubmitted={() => qc.invalidateQueries({ queryKey: ["home-review", id] })} />
        )}

        {review && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-bold flex items-center gap-2">
              {t("Ton avis", "Your review")}
              <span className="ml-auto font-black">{review.rating}/5 ★</span>
            </div>
            {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
