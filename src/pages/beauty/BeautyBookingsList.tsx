import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/I18nContext";
import { BeautyHeader } from "@/components/beauty/BeautyHeader";
import { GuestGate } from "@/components/auth/GuestGate";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  refunded: "bg-muted text-muted-foreground",
  no_show: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  disputed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};

export default function BeautyBookingsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  if (!user) {
    return (
      <GuestGate
        icon={Calendar}
        title={t("Prends ton prochain rendez-vous beauté", "Book your next beauty appointment")}
        subtitle={t(
          "Réserve, suis et gère toutes tes prestations. Gratuit pour commencer.",
          "Book, track and manage all your services. Free to start.",
        )}
        nextUrl="/beauty/bookings"
      />
    );
  }

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["beauty-my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_bookings")
        .select(
          "id, status, slot_start, slot_end, price_amount, price_xof, currency, location_type, beauty_services(title), beauty_providers(business_name, avatar_url, city)",
        )
        .eq("client_id", user!.id)
        .order("slot_start", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="beauty-scope min-h-screen bg-background pb-24 text-foreground">
      <BeautyHeader showBack />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <h1 className="text-lg font-bold">{t("Mes rendez-vous", "My appointments")}</h1>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : !bookings?.length ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="font-bold">{t("Aucune réservation pour l'instant", "No bookings yet")}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "Explore les pros beauté et réserve ta première prestation.",
                "Explore beauty pros and book your first service.",
              )}
            </p>
            <Button className="mt-6 beauty-gradient text-white hover:opacity-90" onClick={() => navigate("/beauty/search")}>
              {t("Explorer", "Explore")}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => {
              const svc = b.beauty_services;
              const pro = b.beauty_providers;
              const amount = b.price_amount ?? b.price_xof ?? 0;
              const currency = (b.currency ?? "XOF") as any;
              const statusLabel =
                {
                  pending_payment: t("Paiement en attente", "Payment pending"),
                  confirmed: t("Confirmé", "Confirmed"),
                  in_progress: t("En cours", "In progress"),
                  completed: t("Terminé", "Completed"),
                  cancelled: t("Annulé", "Cancelled"),
                  no_show: t("No-show", "No-show"),
                  disputed: t("Litige", "Disputed"),
                  refunded: t("Remboursé", "Refunded"),
                }[b.status as string] ?? b.status;

              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/beauty/bookings/${b.id}`)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {pro?.avatar_url ? (
                      <img src={pro.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-black text-muted-foreground">
                        {(pro?.business_name ?? "?")[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-bold">{svc?.title ?? t("Prestation", "Service")}</div>
                      <Badge className={cn("text-[10px]", STATUS_TONE[b.status] ?? "")} variant="secondary">
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {pro?.business_name}
                      {pro?.city ? ` · ${pro.city}` : ""}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(b.slot_start).toLocaleString(isFr ? "fr-FR" : "en-US", {
                        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black">{formatCurrency(amount, currency)}</div>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
