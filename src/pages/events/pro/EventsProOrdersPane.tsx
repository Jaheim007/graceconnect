import { Link } from "react-router-dom";
import { useState } from "react";
import { ClipboardList, Calendar, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

type Status = "all" | "pending" | "pending_payment" | "confirmed" | "deposit_paid" | "in_progress" | "completed" | "cancelled";
const STATUS_TABS: { id: Status; fr: string; en: string }[] = [
  { id: "all", fr: "Tout", en: "All" },
  { id: "pending", fr: "Nouvelles", en: "New" },
  { id: "confirmed", fr: "Confirmées", en: "Confirmed" },
  { id: "in_progress", fr: "En cours", en: "In progress" },
  { id: "completed", fr: "Terminées", en: "Completed" },
  { id: "cancelled", fr: "Annulées", en: "Cancelled" },
];

export default function EventsProOrdersPane() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [status, setStatus] = useState<Status>("all");

  const { data: provider } = useQuery({
    queryKey: ["events-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_providers").select("id, currency").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["events-pro-orders", (provider as any)?.id, status],
    enabled: !!(provider as any)?.id,
    queryFn: async () => {
      let q = supabase.from("events_bookings")
        .select("id, status, event_date, price, currency, venue_address, client_id, created_at")
        .eq("provider_id", (provider as any).id)
        .order("created_at", { ascending: false }).limit(100);
      if (status !== "all") q = q.eq("status", status as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="pb-24 lg:pb-8">
      <header className="lg:hidden sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/dashboard" className="rounded-lg p-2 hover:bg-accent"><ClipboardList className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Réservations", "Bookings")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black">{t("Réservations & événements", "Bookings & events")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Les demandes à confirmer et prestations à livrer.", "Requests to confirm and events to deliver.")}
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setStatus(tab.id)}
              className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                status === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>
              {isFr ? tab.fr : tab.en}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">…</div>
        ) : (orders ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <ClipboardList className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm">{t("Aucune demande pour ce filtre.", "No requests match this filter.")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(orders ?? []).map((o: any) => (
              <Link key={o.id} to={`/events/booking/${o.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:shadow-xs transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                      <StatusBadge status={o.status} isFr={isFr} />
                      <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString(isFr ? "fr-FR" : "en-US")}</span>
                    </div>
                    {o.event_date && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(o.event_date).toLocaleString(isFr ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    )}
                    {o.venue_address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {o.venue_address}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-amber-600">{Number(o.price).toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.currency}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, isFr }: { status: string; isFr: boolean }) {
  const map: Record<string, { fr: string; en: string; cls: string }> = {
    pending: { fr: "Nouvelle", en: "New", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    pending_payment: { fr: "Paiement", en: "Awaiting payment", cls: "bg-amber-500/15 text-amber-700" },
    confirmed: { fr: "Confirmée", en: "Confirmed", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
    deposit_paid: { fr: "Acompte payé", en: "Deposit paid", cls: "bg-sky-500/15 text-sky-700" },
    in_progress: { fr: "En cours", en: "In progress", cls: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
    completed: { fr: "Terminée", en: "Completed", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    cancelled: { fr: "Annulée", en: "Cancelled", cls: "bg-muted text-muted-foreground" },
    disputed: { fr: "Litige", en: "Disputed", cls: "bg-red-500/15 text-red-700" },
    refunded: { fr: "Remboursée", en: "Refunded", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? { fr: status, en: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", s.cls)}>{isFr ? s.fr : s.en}</span>;
}
