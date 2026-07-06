import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PartyPopper, Ban, CheckCircle2, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SuperadminEvents() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <PartyPopper className="h-6 w-6 text-fuchsia-500" /> Events console
        </h1>
        <p className="text-sm text-muted-foreground">
          Verify, moderate, and monitor SiteViral Events vendors, bookings, and disputes.
        </p>
      </header>
      <StatsRow />
      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Vendors</TabsTrigger>
          <TabsTrigger value="disputes"><Flag className="mr-1.5 h-3.5 w-3.5" />Disputes</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="mt-4"><ProvidersPanel /></TabsContent>
        <TabsContent value="disputes" className="mt-4"><DisputesPanel /></TabsContent>
        <TabsContent value="violations" className="mt-4"><ViolationsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsRow() {
  const { data } = useQuery({
    queryKey: ["superadmin-events-stats"],
    queryFn: async () => {
      const [providers, active, kyc, bookings, done, disputes] = await Promise.all([
        supabase.from("events_providers").select("*", { count: "exact", head: true }),
        supabase.from("events_providers").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("events_providers").select("*", { count: "exact", head: true }).not("kyc_verified_at", "is", null),
        supabase.from("events_bookings").select("*", { count: "exact", head: true }),
        supabase.from("events_bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("events_disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        providers: providers.count ?? 0, active: active.count ?? 0, kyc: kyc.count ?? 0,
        bookings: bookings.count ?? 0, done: done.count ?? 0, disputes: disputes.count ?? 0,
      };
    },
  });
  const items = [
    { label: "Vendors", value: data?.providers ?? 0 },
    { label: "Active", value: data?.active ?? 0 },
    { label: "KYC verified", value: data?.kyc ?? 0 },
    { label: "Bookings", value: data?.bookings ?? 0 },
    { label: "Completed", value: data?.done ?? 0 },
    { label: "Open disputes", value: data?.disputes ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-3">
          <p className="text-xl font-bold">{s.value}</p>
          <p className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ProvidersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["superadmin-events-providers", filter],
    queryFn: async () => {
      let q = supabase.from("events_providers").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "active") patch.kyc_verified_at = new Date().toISOString();
    const { error } = await supabase.from("events_providers").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Vendor ${status}`);
      qc.invalidateQueries({ queryKey: ["superadmin-events-providers"] });
    }
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["all", "pending", "active", "suspended"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-2">
          {rows.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold">{p.business_name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.city ?? "—"} · {(p.categories ?? []).join(", ")} · status: {p.status} · kyc: {p.kyc_verified_at ? "✅" : "—"}
                </div>
              </div>
              {p.status !== "active" && (
                <Button size="sm" onClick={() => setStatus(p.id, "active")} className="bg-emerald-500 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                </Button>
              )}
              {p.status !== "suspended" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "suspended")}>
                  <Ban className="h-4 w-4 mr-1" />Suspend
                </Button>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No vendors.</p>}
        </div>
      )}
    </div>
  );
}

function DisputesPanel() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["superadmin-events-disputes"],
    queryFn: async () => {
      const { data } = await supabase.from("events_disputes")
        .select("*, events_bookings(id, price, currency, events_providers(business_name))")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  const resolve = async (id: string, resolution: string) => {
    const { error } = await supabase.from("events_disputes")
      .update({ status: "resolved", resolution }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Resolved"); qc.invalidateQueries({ queryKey: ["superadmin-events-disputes"] }); }
  };
  return (
    <div className="space-y-2">
      {rows.map((d: any) => (
        <div key={d.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm">
            <div>
              <div className="font-bold">{d.events_bookings?.events_providers?.business_name} — {d.events_bookings?.price} {d.events_bookings?.currency}</div>
              <div className="text-xs text-muted-foreground">status: {d.status}</div>
              <p className="mt-1 text-sm">{d.reason}</p>
            </div>
            {d.status === "open" && (
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => resolve(d.id, "refund_client")}>Refund client</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(d.id, "release_vendor")}>Release to vendor</Button>
              </div>
            )}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No disputes.</p>}
    </div>
  );
}

function ViolationsPanel() {
  const { data: rows = [] } = useQuery({
    queryKey: ["superadmin-events-violations"],
    queryFn: async () => {
      const { data } = await supabase.from("events_chat_violations")
        .select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <div className="space-y-2">
      {rows.map((v: any) => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="font-bold">{v.category}</span>
            <span className="text-xs text-muted-foreground">severity: {v.severity}</span>
          </div>
          {v.original_text && <p className="mt-1 text-xs text-muted-foreground">{v.original_text}</p>}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No violations flagged.</p>}
    </div>
  );
}
