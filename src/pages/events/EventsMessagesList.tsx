import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export default function EventsMessagesList() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";

  const { data: convs, refetch } = useQuery({
    queryKey: ["events-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events_conversations")
        .select("id, last_message_at, client_id, provider_id, events_providers(business_name, avatar_url, user_id)")
        .order("last_message_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("events-conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "events_conversations" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/events" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{isFr ? "Messages" : "Messages"}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-2 pb-28">
        {(convs ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm">{isFr ? "Aucune conversation." : "No conversations yet."}</p>
          </div>
        )}
        {(convs ?? []).map((c: any) => (
          <Link key={c.id} to={`/events/messages/${c.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:-translate-y-0.5 hover:shadow-lg transition">
            {c.events_providers?.avatar_url ? (
              <img src={c.events_providers.avatar_url} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-600 font-bold dark:bg-fuchsia-500/15">
                {(c.events_providers?.business_name ?? "?")[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{c.events_providers?.business_name}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(c.last_message_at).toLocaleString(isFr ? "fr-FR" : "en-US")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
