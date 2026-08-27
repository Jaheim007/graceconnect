import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { MessageSquare, ArrowLeft, Loader2, Zap, Home as HomeIcon, GraduationCap, PartyPopper } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Unified customer Messages inbox (Step 3).
 * Presentation/aggregation layer only — reads the existing per-vertical
 * conversation tables (beauty, home, education, events). No schema changes.
 * Clicking a row deep-links to the vertical's existing conversation renderer.
 *
 * Known gap: `home_messages` and `events_messages` have no `read_at` column,
 * so unread state is only surfaced for beauty & education.
 */

type Vertical = "beauty" | "home" | "education" | "events";

type Row = {
  key: string;             // vertical:id
  vertical: Vertical;
  id: string;
  href: string;            // deep link to existing thread
  title: string;           // provider/business/tutor display
  avatarUrl: string | null;
  snippet: string | null;
  lastAt: string | null;
  unread: number | null;   // null when the source cannot report unread
};

const VERTICAL_META: Record<Vertical, { fr: string; en: string; icon: any; color: string }> = {
  beauty:    { fr: "Beauté",    en: "Beauty",    icon: Zap,     color: "bg-pink-500/10 text-pink-600 dark:text-pink-300" },
  home:      { fr: "Artisan",   en: "Home",      icon: HomeIcon,     color: "bg-sky-500/10 text-sky-600 dark:text-sky-300" },
  education: { fr: "Cours",     en: "Tutoring",  icon: GraduationCap,color: "bg-teal-500/10 text-teal-600 dark:text-teal-300" },
  events:    { fr: "Événements",en: "Events",    icon: PartyPopper,  color: "bg-amber-500/10 text-amber-600 dark:text-amber-300" },
};

export default function PersonalMessagesPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [partialErrors, setPartialErrors] = useState<Vertical[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const uid = user.id;
      const failures: Vertical[] = [];

      // Fetch each vertical independently so one broken source doesn't blank the whole inbox.
      const [beauty, home, edu, events] = await Promise.all([
        supabase
          .from("beauty_conversations")
          .select("id, provider_id, last_message_at, beauty_providers(business_name, avatar_url, slug)")
          .eq("client_id", uid)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50)
          .then(r => (r.error ? (failures.push("beauty"), []) : (r.data ?? []))),
        supabase
          .from("home_conversations")
          .select("id, provider_id, last_message_at, home_providers(business_name, avatar_url, slug)")
          .eq("client_id", uid)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50)
          .then(r => (r.error ? (failures.push("home"), []) : (r.data ?? []))),
        supabase
          .from("education_conversations")
          .select("id, tutor_id, last_message_at, education_tutors(display_name, avatar_url, slug)")
          .eq("student_id", uid)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50)
          .then(r => (r.error ? (failures.push("education"), []) : (r.data ?? []))),
        supabase
          .from("events_conversations")
          .select("id, provider_id, last_message_at, events_providers(business_name, avatar_url, slug)")
          .eq("client_id", uid)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50)
          .then(r => (r.error ? (failures.push("events"), []) : (r.data ?? []))),
      ]);

      // Last-message snippets & unread (best-effort, chunked per source)
      const beautyIds = beauty.map((c: any) => c.id);
      const homeIds = home.map((c: any) => c.id);
      const eduIds = edu.map((c: any) => c.id);
      const eventIds = events.map((c: any) => c.id);

      const [beautyMsgs, homeMsgs, eduMsgs, eventMsgs] = await Promise.all([
        beautyIds.length
          ? supabase.from("beauty_messages")
              .select("conversation_id, body, redacted_body, created_at, sender_id, read_at")
              .in("conversation_id", beautyIds)
              .order("created_at", { ascending: false })
              .then(r => r.data ?? [])
          : Promise.resolve([]),
        homeIds.length
          ? supabase.from("home_messages")
              .select("conversation_id, body, created_at, sender_id")
              .in("conversation_id", homeIds)
              .order("created_at", { ascending: false })
              .then(r => r.data ?? [])
          : Promise.resolve([]),
        eduIds.length
          ? supabase.from("education_messages")
              .select("conversation_id, body, filtered_body, created_at, sender_id, read_at")
              .in("conversation_id", eduIds)
              .order("created_at", { ascending: false })
              .then(r => r.data ?? [])
          : Promise.resolve([]),
        eventIds.length
          ? supabase.from("events_messages")
              .select("conversation_id, body, created_at, sender_id")
              .in("conversation_id", eventIds)
              .order("created_at", { ascending: false })
              .then(r => r.data ?? [])
          : Promise.resolve([]),
      ]);

      const firstBy = <T extends { conversation_id: string }>(arr: T[]) => {
        const m = new Map<string, T>();
        for (const x of arr) if (!m.has(x.conversation_id)) m.set(x.conversation_id, x);
        return m;
      };
      const unreadCount = (arr: any[], hasReadAt: boolean) => {
        if (!hasReadAt) return null;
        const m = new Map<string, number>();
        for (const x of arr) {
          if (x.sender_id !== uid && !x.read_at) m.set(x.conversation_id, (m.get(x.conversation_id) ?? 0) + 1);
        }
        return m;
      };

      const bLast = firstBy(beautyMsgs as any[]);
      const hLast = firstBy(homeMsgs as any[]);
      const eLast = firstBy(eduMsgs as any[]);
      const evLast = firstBy(eventMsgs as any[]);
      const bUnread = unreadCount(beautyMsgs as any[], true) as Map<string, number>;
      const eUnread = unreadCount(eduMsgs as any[], true) as Map<string, number>;

      const snip = (s?: string | null) => (s ? s.length > 90 ? s.slice(0, 90) + "…" : s : null);

      const merged: Row[] = [
        ...beauty.map((c: any) => {
          const last = bLast.get(c.id) as any;
          return {
            key: `beauty:${c.id}`, vertical: "beauty" as const, id: c.id,
            href: `/dashboard/messages/beauty/${c.id}`,
            title: c.beauty_providers?.business_name ?? (isFr ? "Prestataire" : "Provider"),
            avatarUrl: c.beauty_providers?.avatar_url ?? null,
            snippet: snip(last?.redacted_body ?? last?.body),
            lastAt: c.last_message_at ?? last?.created_at ?? null,
            unread: bUnread.get(c.id) ?? 0,
          };
        }),
        ...home.map((c: any) => {
          const last = hLast.get(c.id) as any;
          return {
            key: `home:${c.id}`, vertical: "home" as const, id: c.id,
            href: `/dashboard/messages/home/${c.id}`,
            title: c.home_providers?.business_name ?? (isFr ? "Artisan" : "Artisan"),
            avatarUrl: c.home_providers?.avatar_url ?? null,
            snippet: snip(last?.body),
            lastAt: c.last_message_at ?? last?.created_at ?? null,
            unread: null,
          };
        }),
        ...edu.map((c: any) => {
          const last = eLast.get(c.id) as any;
          return {
            key: `education:${c.id}`, vertical: "education" as const, id: c.id,
            href: `/dashboard/messages/learn/${c.id}`,
            title: c.education_tutors?.display_name ?? (isFr ? "Tuteur" : "Tutor"),
            avatarUrl: c.education_tutors?.avatar_url ?? null,
            snippet: snip(last?.filtered_body ?? last?.body),
            lastAt: c.last_message_at ?? last?.created_at ?? null,
            unread: eUnread.get(c.id) ?? 0,
          };
        }),
        ...events.map((c: any) => {
          const last = evLast.get(c.id) as any;
          return {
            key: `events:${c.id}`, vertical: "events" as const, id: c.id,
            href: `/dashboard/messages/events/${c.id}`,
            title: c.events_providers?.business_name ?? (isFr ? "Prestataire" : "Provider"),
            avatarUrl: c.events_providers?.avatar_url ?? null,
            snippet: snip(last?.body),
            lastAt: c.last_message_at ?? last?.created_at ?? null,
            unread: null,
          };
        }),
      ].sort((a, b) => {
        const at = a.lastAt ? +new Date(a.lastAt) : 0;
        const bt = b.lastAt ? +new Date(b.lastAt) : 0;
        return bt - at;
      });

      if (!cancelled) {
        setRows(merged);
        setPartialErrors(failures);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isFr]);

  const totalUnread = useMemo(
    () => (rows ?? []).reduce((n, r) => n + (r.unread ?? 0), 0),
    [rows],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-24">
      <header className="flex items-center gap-2 mb-4">
        <Link to="/dashboard" className="lg:hidden rounded-lg p-1.5 hover:bg-accent" aria-label={isFr ? "Retour" : "Back"}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold flex-1">{isFr ? "Messages" : "Messages"}</h1>
        {totalUnread > 0 && (
          <Badge variant="default" className="rounded-full">{totalUnread}</Badge>
        )}
      </header>

      {partialErrors.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {isFr
            ? `Certaines sources sont temporairement indisponibles : ${partialErrors.join(", ")}.`
            : `Some sources are temporarily unavailable: ${partialErrors.join(", ")}.`}
        </div>
      )}

      {rows === null ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 opacity-40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {isFr
              ? "Aucune conversation pour le moment. Contacte un prestataire pour démarrer un échange."
              : "No conversations yet. Reach out to a provider to start a chat."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card overflow-hidden">
          {rows.map((r) => {
            const meta = VERTICAL_META[r.vertical];
            const Icon = meta.icon;
            const initial = (r.title[0] ?? "?").toUpperCase();
            return (
              <li key={r.key}>
                <Link
                  to={r.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition"
                >
                  {r.avatarUrl ? (
                    <img src={r.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={cn("grid h-11 w-11 place-items-center rounded-full font-bold shrink-0", meta.color)}>
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{r.title}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", meta.color)}>
                        <Icon className="h-3 w-3" />
                        {isFr ? meta.fr : meta.en}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {r.snippet ?? (isFr ? "Nouvelle conversation" : "New conversation")}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {r.lastAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.lastAt).toLocaleDateString(isFr ? "fr-FR" : "en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {r.unread && r.unread > 0 ? (
                      <Badge variant="default" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">{r.unread}</Badge>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
