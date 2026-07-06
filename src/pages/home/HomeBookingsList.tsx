import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export default function HomeBookingsList() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";

  const { data: bookings } = useQuery({
    queryKey: ["home-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("home_bookings")
        .select("id, status, scheduled_for, price, currency, address, home_providers(business_name)")
        .order("scheduled_for", { ascending: false, nullsFirst: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/home" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Mes interventions" : "My jobs"}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-2 pb-28">
        {(bookings ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm">{isFr ? "Aucune intervention pour le moment." : "No jobs yet."}</p>
            <Link to="/home/discover" className="mt-3 inline-block text-xs font-semibold text-sky-600 underline">
              {isFr ? "Trouver un artisan" : "Find an artisan"}
            </Link>
          </div>
        )}
        {(bookings ?? []).map((b: any) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">{b.home_providers?.business_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {b.scheduled_for ? new Date(b.scheduled_for).toLocaleString(isFr ? "fr-FR" : "en-US") : "—"}
                </div>
                {b.address && <div className="mt-0.5 text-[11px] text-muted-foreground">{b.address}</div>}
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-sky-600">{Number(b.price).toLocaleString()} {b.currency}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{b.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
