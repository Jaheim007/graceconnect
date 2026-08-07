import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Zap, Users, Calendar, AlertTriangle, CheckCircle2, XCircle, Loader2, ExternalLink, ShieldCheck, Ban, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "providers" | "bookings" | "disputes";

export default function SuperadminBeauty() {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            Beauty console
          </h1>
          <p className="text-sm text-muted-foreground">
            Approbations pros, bookings actifs, litiges.
          </p>
        </div>
      </header>

      <StatsRow />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers"><Users className="mr-1.5 h-3.5 w-3.5" />Pros</TabsTrigger>
          <TabsTrigger value="bookings"><Calendar className="mr-1.5 h-3.5 w-3.5" />Bookings</TabsTrigger>
          <TabsTrigger value="disputes"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Litiges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewPanel />
        </TabsContent>
        <TabsContent value="providers" className="mt-4">
          <ProvidersPanel />
        </TabsContent>
        <TabsContent value="bookings" className="mt-4">
          <BookingsPanel />
        </TabsContent>
        <TabsContent value="disputes" className="mt-4">
          <DisputesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────  Stats row  ───────────────────────── */

function StatsRow() {
  const { data } = useQuery({
    queryKey: ["superadmin-beauty-stats"],
    queryFn: async () => {
      const [providers, pending, bookings, disputes, gmv] = await Promise.all([
        supabase.from("beauty_providers").select("*", { count: "exact", head: true }),
        supabase.from("beauty_providers").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("beauty_bookings").select("*", { count: "exact", head: true }).in("status", ["confirmed", "in_progress"] as any),
        supabase.from("beauty_disputes").select("*", { count: "exact", head: true }).in("status", ["open", "investigating"] as any),
        supabase.from("beauty_bookings").select("price_xof").eq("status", "completed"),
      ]);
      const gmvTotal = (gmv.data ?? []).reduce((s, b: any) => s + (b.price_xof ?? 0), 0);
      return {
        providers: providers.count ?? 0,
        pending: pending.count ?? 0,
        activeBookings: bookings.count ?? 0,
        openDisputes: disputes.count ?? 0,
        gmv: gmvTotal,
      };
    },
  });

  const cards = [
    { label: "Pros total", value: data?.providers ?? "—", icon: Users, color: "text-primary" },
    { label: "En attente", value: data?.pending ?? 0, icon: Loader2, color: "text-amber-600" },
    { label: "Bookings actifs", value: data?.activeBookings ?? 0, icon: Calendar, color: "text-emerald-600" },
    { label: "Litiges ouverts", value: data?.openDisputes ?? 0, icon: AlertTriangle, color: "text-rose-600" },
    { label: "GMV (XOF)", value: data ? formatCurrency(data.gmv, "XOF" as any) : "—", icon: Zap, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <c.icon className={cn("h-4 w-4", c.color)} />
            {c.label}
          </div>
          <div className="mt-1 text-2xl font-black">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────────────────  Overview  ───────────────────────── */

function OverviewPanel() {
  const { data: recent } = useQuery({
    queryKey: ["superadmin-beauty-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_bookings")
        .select("id, status, price_xof, currency, created_at, beauty_providers(business_name, slug), beauty_services(title)")
        .order("created_at", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-bold">Derniers bookings</h3>
      <div className="divide-y divide-border/60">
        {(recent ?? []).map((b: any) => (
          <Link
            key={b.id}
            to={`/beauty/bookings/${b.id}`}
            className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/40"
          >
            <StatusPill status={b.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{b.beauty_services?.title ?? "—"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.beauty_providers?.business_name} · {new Date(b.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs font-semibold">
              {formatCurrency(b.price_xof ?? 0, (b.currency ?? "XOF") as any)}
            </div>
          </Link>
        ))}
        {!recent?.length && <div className="py-8 text-center text-sm text-muted-foreground">Aucun booking.</div>}
      </div>
    </Card>
  );
}

/* ─────────────────────────  Providers  ───────────────────────── */

function ProvidersPanel() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "active" | "suspended">("pending");

  const { data: providers, isLoading } = useQuery({
    queryKey: ["superadmin-beauty-providers", status, q],
    queryFn: async () => {
      let query = supabase
        .from("beauty_providers")
        .select("id, business_name, slug, city, status, phone, avatar_url, created_at, kyc_submission_id, avg_rating, total_bookings")
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") query = query.eq("status", status);
      if (q.trim()) query = query.ilike("business_name", `%${q.trim()}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  async function updateStatus(id: string, newStatus: "active" | "suspended" | "pending") {
    const { error } = await supabase.from("beauty_providers").update({ status: newStatus as any }).eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: `Statut → ${newStatus}` });
    qc.invalidateQueries({ queryKey: ["superadmin-beauty-providers"] });
    qc.invalidateQueries({ queryKey: ["superadmin-beauty-stats"] });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un pro…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        {(["pending", "active", "suspended", "all"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <div className="divide-y divide-border/60">
          {(providers ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 py-3">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  {p.business_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 truncate text-sm font-bold">
                  {p.business_name}
                  <StatusPill status={p.status} />
                  {p.kyc_submission_id && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-label="KYC OK" />}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.city ?? "—"} · {p.phone ?? "—"} · {p.total_bookings ?? 0} bookings · ★ {Number(p.avg_rating ?? 0).toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link to={`/beauty/p/${p.slug}`} target="_blank">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                {p.status === "pending" && (
                  <Button size="sm" onClick={() => updateStatus(p.id, "active")} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Activer
                  </Button>
                )}
                {p.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "suspended")} className="gap-1 text-rose-600">
                    <Ban className="h-3.5 w-3.5" /> Suspendre
                  </Button>
                )}
                {p.status === "suspended" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "active")} className="gap-1">
                    Réactiver
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!providers?.length && <div className="py-8 text-center text-sm text-muted-foreground">Aucun résultat.</div>}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────  Bookings  ───────────────────────── */

function BookingsPanel() {
  const [status, setStatus] = useState<string>("confirmed");

  const { data: bookings } = useQuery({
    queryKey: ["superadmin-beauty-bookings", status],
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_bookings")
        .select("id, status, price_xof, currency, slot_start, slot_end, created_at, beauty_providers(business_name, slug), beauty_services(title), client_id")
        .eq("status", status as any)
        .order("slot_start", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const statuses = ["pending_payment", "confirmed", "in_progress", "completed", "cancelled", "disputed"];

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {(bookings ?? []).map((b: any) => (
          <Link key={b.id} to={`/beauty/bookings/${b.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/40">
            <StatusPill status={b.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{b.beauty_services?.title ?? "—"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.beauty_providers?.business_name} · {new Date(b.slot_start).toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs font-semibold">
              {formatCurrency(b.price_xof ?? 0, (b.currency ?? "XOF") as any)}
            </div>
          </Link>
        ))}
        {!bookings?.length && <div className="py-8 text-center text-sm text-muted-foreground">Aucun booking dans cet état.</div>}
      </div>
    </Card>
  );
}

/* ─────────────────────────  Disputes  ───────────────────────── */

function DisputesPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"open" | "investigating" | "resolved" | "rejected">("open");

  const { data: disputes } = useQuery({
    queryKey: ["superadmin-beauty-disputes", status],
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_disputes")
        .select("id, booking_id, opened_by, reason, resolution, status, created_at, beauty_bookings(price_xof, currency, beauty_providers(business_name))")
        .eq("status", status as any)
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function resolve(id: string, newStatus: "investigating" | "resolved" | "rejected") {
    const resolution = newStatus !== "investigating"
      ? prompt(`Résolution (${newStatus}) :`) ?? ""
      : "";
    const { error } = await supabase
      .from("beauty_disputes")
      .update({
        status: newStatus as any,
        resolution: resolution || null,
        resolved_at: newStatus !== "investigating" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: `Litige → ${newStatus}` });
    qc.invalidateQueries({ queryKey: ["superadmin-beauty-disputes"] });
    qc.invalidateQueries({ queryKey: ["superadmin-beauty-stats"] });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {(["open", "investigating", "resolved", "rejected"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {(disputes ?? []).map((d: any) => (
          <div key={d.id} className="rounded-xl border border-border/60 p-3">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold">{d.beauty_bookings?.beauty_providers?.business_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString()} ·{" "}
                  {formatCurrency(d.beauty_bookings?.price_xof ?? 0, (d.beauty_bookings?.currency ?? "XOF") as any)}
                </div>
              </div>
              <StatusPill status={d.status} />
            </div>
            <p className="text-sm text-muted-foreground">{d.reason}</p>
            {d.resolution && <p className="mt-1 text-xs text-emerald-700">Résolution : {d.resolution}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/beauty/bookings/${d.booking_id}`}>
                <Button size="sm" variant="outline" className="gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> Voir le booking
                </Button>
              </Link>
              {d.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => resolve(d.id, "investigating")}>
                  Investiguer
                </Button>
              )}
              {d.status !== "resolved" && d.status !== "rejected" && (
                <>
                  <Button size="sm" onClick={() => resolve(d.id, "resolved")} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Résoudre
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "rejected")} className="gap-1 text-rose-600">
                    <XCircle className="h-3.5 w-3.5" /> Rejeter
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {!disputes?.length && <div className="py-8 text-center text-sm text-muted-foreground">Aucun litige.</div>}
      </div>
    </Card>
  );
}

/* ─────────────────────────  Shared  ───────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  pending_payment: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-primary/15 text-primary border-primary/30",
  suspended: "bg-rose-100 text-rose-800 border-rose-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  disputed: "bg-rose-100 text-rose-800 border-rose-200",
  open: "bg-rose-100 text-rose-800 border-rose-200",
  investigating: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-muted text-muted-foreground border-border",
};

function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", STATUS_COLORS[status] ?? "")}>
      {status}
    </Badge>
  );
}
