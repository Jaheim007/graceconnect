import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/**
 * Messages pane for the artisan pro. Two columns on desktop (list | thread),
 * pure list on mobile (thread routes to /home/pro/messages/:id).
 */
export default function HomeProMessagesPane() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const { id: activeId } = useParams();

  const { data: provider } = useQuery({
    queryKey: ["home-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("home_providers").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: convs, refetch } = useQuery({
    queryKey: ["home-pro-conversations", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_conversations")
        .select("id, last_message_at, client_id, provider_id")
        .eq("provider_id", provider!.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);
      // fetch client display names
      const ids = (data ?? []).map((c: any) => c.client_id);
      let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids);
        for (const p of profs ?? []) {
          profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        }
      }
      return (data ?? []).map((c: any) => ({ ...c, client: profileMap[c.client_id] ?? null }));
    },
  });

  useEffect(() => {
    if (!provider?.id) return;
    const ch = supabase
      .channel(`home-pro-conv-${provider.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "home_conversations", filter: `provider_id=eq.${provider.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [provider?.id, refetch]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:flex-row">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex flex-col border-b lg:border-b-0 lg:border-r border-border/60 bg-background",
          "lg:w-80 xl:w-96 lg:shrink-0",
          activeId ? "hidden lg:flex" : "flex",
        )}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
          {/* Mobile back link when no conv selected */}
          <Link to="/dashboard" className="lg:hidden rounded-lg p-1.5 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-base font-bold">{isFr ? "Messages" : "Messages"}</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">{convs?.length ?? 0}</span>
        </header>
        <div className="flex-1 overflow-y-auto">
          {(convs ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
              {isFr ? "Aucune conversation." : "No conversations yet."}
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(convs ?? []).map((c: any) => {
                const name = c.client?.display_name || (isFr ? "Client" : "Client");
                const initial = (name[0] ?? "?").toUpperCase();
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <NavLink
                      to={`/admin/home/messages/${c.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition",
                        isActive && "bg-primary/10 hover:bg-primary/10",
                      )}
                    >
                      {c.client?.avatar_url ? (
                        <img src={c.client.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sky-700 font-bold dark:bg-sky-500/15 dark:text-sky-300">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleString(isFr ? "fr-FR" : "en-US", { dateStyle: "short", timeStyle: "short" })
                            : (isFr ? "Nouveau" : "New")}
                        </div>
                      </div>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread pane */}
      <section className={cn("flex-1 min-w-0 flex flex-col", !activeId && "hidden lg:flex")}>
        {activeId ? (
          <Outlet />
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto h-10 w-10 opacity-40" />
              <p className="mt-3">{isFr ? "Sélectionne une conversation pour commencer." : "Select a conversation to start."}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
