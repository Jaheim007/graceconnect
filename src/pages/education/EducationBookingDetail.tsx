import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, ShieldCheck, MessageCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { educationCategoryLabel } from "@/lib/educationCategories";
import EducationOtpPanel from "@/components/education/EducationOtpPanel";
import EducationExtraCharges from "@/components/education/EducationExtraCharges";
import EducationReviewForm from "@/components/education/EducationReviewForm";

const STATUS: Record<string, { fr: string; en: string; color: string; icon: any }> = {
  awaiting_payment: { fr: "Paiement en attente", en: "Payment pending", color: "amber", icon: Loader2 },
  confirmed: { fr: "Confirmée", en: "Confirmed", color: "teal", icon: CheckCircle2 },
  in_progress: { fr: "En cours", en: "In progress", color: "teal", icon: Sparkles },
  completed: { fr: "Terminée", en: "Completed", color: "emerald", icon: CheckCircle2 },
  cancelled: { fr: "Annulée", en: "Cancelled", color: "rose", icon: XCircle },
  disputed: { fr: "Litige", en: "Disputed", color: "rose", icon: AlertTriangle },
};

export default function EducationBookingDetail() {
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
    queryKey: ["education-booking", id],
    enabled: !!id,
    refetchInterval: (q) => (q.state.data as any)?.status === "awaiting_payment" ? 3000 : false,
    queryFn: async () => {
      const { data } = await supabase.from("education_bookings")
        .select("*, education_tutors(user_id, display_name, avatar_url, city, slug)")
        .eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: review } = useQuery({
    queryKey: ["education-review", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("education_reviews").select("*").eq("booking_id", id!).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`education-bk-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "education_bookings", filter: `id=eq.${id}` },
        () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  useEffect(() => {
    if (!returnedSuccess || !id) return;
    (async () => {
      try {
        await supabase.functions.invoke("education-verify-booking", { body: { booking_id: id, session_id: sessionId } });
        qc.invalidateQueries({ queryKey: ["education-booking", id] });
      } catch (e) { console.warn(e); }
    })();
  }, [returnedSuccess, id, sessionId, qc]);

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  if (!booking) return (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <div className="text-lg font-bold">{t("Séance introuvable", "Session not found")}</div>
        <Button className="mt-4" onClick={() => navigate("/education/bookings")}>{t("Mes séances", "My sessions")}</Button>
      </div>
    </div>
  );

  const isStudent = user?.id === booking.student_id;
  const tutor = (booking as any).education_tutors;
  const isTutor = !!user?.id && tutor?.user_id === user.id;
  const status = STATUS[booking.status] ?? STATUS.awaiting_payment;
  const StatusIcon = status.icon;

  const cancel = async () => {
    if (!confirm(t("Annuler cette séance ?", "Cancel this session?"))) return;
    const { error } = await supabase.from("education_bookings").update({
      status: "cancelled",
    }).eq("id", booking.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["education-booking", id] });
  };

  const canCancel = ["awaiting_payment", "confirmed"].includes(booking.status) && !booking.started_at;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/education/bookings")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{tutor?.display_name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString(isFr ? "fr-FR" : "en-US") : "—"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        <div className={cn(
          "rounded-2xl border p-5",
          status.color === "teal" && "border-teal-200 bg-teal-50/50 dark:border-teal-900/50 dark:bg-teal-950/20",
          status.color === "emerald" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
          status.color === "amber" && "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
          status.color === "rose" && "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
        )}>
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("h-6 w-6",
              status.color === "amber" && "animate-spin text-amber-600",
              status.color === "teal" && "text-teal-600",
              status.color === "emerald" && "text-emerald-600",
              status.color === "rose" && "text-rose-600",
            )} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("Statut", "Status")}</div>
              <div className="text-lg font-black">{isFr ? status.fr : status.en}</div>
            </div>
          </div>
          {booking.status === "awaiting_payment" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("En attente de confirmation du paiement…", "Waiting for payment confirmation…")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-sm">
          <div className="flex gap-3"><Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{t("Séance", "Session")}</div>
              <div className="font-semibold">{educationCategoryLabel(booking.subject, locale)} · {booking.session_count}×{booking.duration_min}min</div>
              <div className="text-xs text-muted-foreground">{new Date(booking.scheduled_at).toLocaleString(isFr ? "fr-FR" : "en-US")}</div>
            </div>
          </div>
          {booking.location_address && (
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">{t("Adresse", "Address")}</div>
                <div className="font-semibold">{booking.location_address}</div>
              </div>
            </div>
          )}
          {booking.meeting_url && (
            <div className="flex gap-3"><Video className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">{t("Lien visio", "Meeting link")}</div>
                <a href={booking.meeting_url} target="_blank" rel="noreferrer" className="font-semibold text-teal-600 underline break-all">{booking.meeting_url}</a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t("Montant total", "Total amount")}</span>
            <span className="text-lg font-black">{Number(booking.total_xof).toLocaleString()} XOF</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3 w-3 text-teal-500" />
            {t("Fonds bloqués en escrow SiteViral jusqu'à la fin de la séance.",
               "Funds held in SiteViral escrow until the session is completed.")}
          </p>
        </div>

        {(isStudent || isTutor) && (
          <EducationOtpPanel booking={booking} isStudent={isStudent} isTutor={isTutor}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["education-booking", id] }); refetch(); }} />
        )}

        {(isStudent || isTutor) && (
          <EducationExtraCharges
            bookingId={booking.id}
            isStudent={isStudent}
            isTutor={isTutor}
            bookingStarted={!!booking.started_at}
            bookingCompleted={!!booking.ended_at}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => {
            const { data: conv } = await supabase.from("education_conversations").select("id")
              .eq("student_id", booking.student_id).eq("tutor_id", booking.tutor_id).maybeSingle();
            if (conv?.id) navigate(`/education/messages/${conv.id}`);
          }}>
            <MessageCircle className="h-4 w-4 mr-1.5" />{t("Ouvrir le chat", "Open chat")}
          </Button>
          {canCancel && (
            <Button variant="ghost" onClick={cancel} className="text-rose-600 hover:text-rose-700">{t("Annuler", "Cancel")}</Button>
          )}
          {(isStudent || isTutor) && (booking.status === "completed" || booking.status === "disputed") && (
            <Button variant="ghost" className="text-amber-700"
              onClick={async () => {
                const reason = prompt(t("Décris le problème :", "Describe the issue:")) || "";
                if (!reason.trim()) return;
                const { error } = await supabase.from("education_disputes").insert({
                  booking_id: booking.id, opened_by: user!.id, reason: reason.trim(), status: "open",
                });
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                else toast({ title: t("Litige ouvert", "Dispute opened") });
              }}>
              <AlertTriangle className="h-4 w-4 mr-1.5" />{t("Signaler un problème", "Report an issue")}
            </Button>
          )}
        </div>

        {isStudent && booking.status === "completed" && !review && (
          <EducationReviewForm bookingId={booking.id} tutorId={booking.tutor_id}
            onSubmitted={() => qc.invalidateQueries({ queryKey: ["education-review", id] })} />
        )}

        {review && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />{t("Ton avis", "Your review")}
              <span className="ml-auto font-black">{review.rating}/5 ★</span>
            </div>
            {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
