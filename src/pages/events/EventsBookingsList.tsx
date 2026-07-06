import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export default function EventsBookingsList() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";

  const { data: bookings } = useQuery({
    queryKey: ["events-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_bookings")
        .select("id, status, event_date, price, currency, venue_address, events_providers(business_name)")
        .order("event_date", { ascending: false, nullsFirst: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/events" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Mes événements" : "My events"}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-2 pb-28">
        {(bookings ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm">{isFr ? "Aucun événement pour le moment." : "No events yet."}</p>
            <Link to="/events/discover" className="mt-3 inline-block text-xs font-semibold text-fuchsia-600 underline">
              {isFr ? "Trouver un prestataire" : "Find a vendor"}
            </Link>
          </div>
        )}
        {(bookings ?? []).map((b: any) => (
          <Link key={b.id} to={`/events/booking/${b.id}`} className="block rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">{b.events_providers?.business_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {b.event_date ? new Date(b.event_date).toLocaleString(isFr ? "fr-FR" : "en-US") : "—"}
                </div>
                {b.venue_address && <div className="mt-0.5 text-[11px] text-muted-foreground">{b.venue_address}</div>}
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-fuchsia-600">{Number(b.price).toLocaleString()} {b.currency}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{b.status}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
