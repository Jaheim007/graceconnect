import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export default function EducationBookingsList() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";

  const { data: bookings } = useQuery({
    queryKey: ["education-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_bookings")
        .select("id, status, scheduled_at, subject, total_xof, education_tutors(display_name)")
        .order("scheduled_at", { ascending: false, nullsFirst: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/education" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Mes séances" : "My sessions"}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-2 pb-28">
        {(bookings ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm">{isFr ? "Aucune séance pour le moment." : "No sessions yet."}</p>
            <Link to="/education/discover" className="mt-3 inline-block text-xs font-semibold text-teal-600 underline">
              {isFr ? "Trouver un prof" : "Find a tutor"}
            </Link>
          </div>
        )}
        {(bookings ?? []).map((b: any) => (
          <Link key={b.id} to={`/education/booking/${b.id}`} className="block rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">{b.education_tutors?.display_name} — {b.subject}</div>
                <div className="text-[11px] text-muted-foreground">
                  {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString(isFr ? "fr-FR" : "en-US") : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-teal-600">{Number(b.total_xof).toLocaleString()} XOF</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{b.status}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
