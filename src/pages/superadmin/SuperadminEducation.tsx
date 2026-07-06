import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Ban, CheckCircle2, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SuperadminEducation() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <GraduationCap className="h-6 w-6 text-teal-500" /> Learn console
        </h1>
        <p className="text-sm text-muted-foreground">
          Verify, moderate, and monitor SiteViral Learn tutors, bookings, and disputes.
        </p>
      </header>
      <StatsRow />
      <Tabs defaultValue="tutors">
        <TabsList>
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="disputes"><Flag className="mr-1.5 h-3.5 w-3.5" />Disputes</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>
        <TabsContent value="tutors" className="mt-4"><TutorsPanel /></TabsContent>
        <TabsContent value="disputes" className="mt-4"><DisputesPanel /></TabsContent>
        <TabsContent value="violations" className="mt-4"><ViolationsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsRow() {
  const { data } = useQuery({
    queryKey: ["superadmin-education-stats"],
    queryFn: async () => {
      const [tutors, active, kyc, bookings, done, disputes] = await Promise.all([
        supabase.from("education_tutors").select("*", { count: "exact", head: true }),
        supabase.from("education_tutors").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("education_tutors").select("*", { count: "exact", head: true }).eq("kyc_status", "verified"),
        supabase.from("education_bookings").select("*", { count: "exact", head: true }),
        supabase.from("education_bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("education_disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        tutors: tutors.count ?? 0, active: active.count ?? 0, kyc: kyc.count ?? 0,
        bookings: bookings.count ?? 0, done: done.count ?? 0, disputes: disputes.count ?? 0,
      };
    },
  });
  const items = [
    { label: "Tutors", value: data?.tutors ?? 0 },
    { label: "Active", value: data?.active ?? 0 },
    { label: "KYC verified", value: data?.kyc ?? 0 },
    { label: "Sessions", value: data?.bookings ?? 0 },
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

function TutorsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "suspended">("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["superadmin-education-tutors", filter],
    queryFn: async () => {
      let q = supabase.from("education_tutors").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter === "verified") q = q.eq("kyc_status", "verified");
      else if (filter === "pending") q = q.eq("kyc_status", "pending");
      else if (filter === "suspended") q = q.eq("is_active", false);
      const { data } = await q;
      return data ?? [];
    },
  });

  const approve = async (id: string) => {
    const { error } = await supabase.from("education_tutors").update({ kyc_status: "verified", is_verified: true, is_active: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tutor approved"); qc.invalidateQueries({ queryKey: ["superadmin-education-tutors"] }); }
  };
  const suspend = async (id: string) => {
    const { error } = await supabase.from("education_tutors").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tutor suspended"); qc.invalidateQueries({ queryKey: ["superadmin-education-tutors"] }); }
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["all", "pending", "verified", "suspended"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-2">
          {rows.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold">{p.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.city ?? "—"} · {p.hourly_rate_xof} XOF/h · kyc: {p.kyc_status} · active: {p.is_active ? "✅" : "—"}
                </div>
              </div>
              {p.kyc_status !== "verified" && (
                <Button size="sm" onClick={() => approve(p.id)} className="bg-emerald-500 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                </Button>
              )}
              {p.is_active && (
                <Button size="sm" variant="outline" onClick={() => suspend(p.id)}>
                  <Ban className="h-4 w-4 mr-1" />Suspend
                </Button>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No tutors.</p>}
        </div>
      )}
    </div>
  );
}

function DisputesPanel() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["superadmin-education-disputes"],
    queryFn: async () => {
      const { data } = await supabase.from("education_disputes")
        .select("*, education_bookings(id, total_xof, education_tutors(display_name))")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  const resolve = async (id: string, resolution: string) => {
    const { error } = await supabase.from("education_disputes")
      .update({ status: "resolved", resolution }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Resolved"); qc.invalidateQueries({ queryKey: ["superadmin-education-disputes"] }); }
  };
  return (
    <div className="space-y-2">
      {rows.map((d: any) => (
        <div key={d.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm">
            <div>
              <div className="font-bold">{d.education_bookings?.education_tutors?.display_name} — {d.education_bookings?.total_xof} XOF</div>
              <div className="text-xs text-muted-foreground">status: {d.status}</div>
              <p className="mt-1 text-sm">{d.reason}</p>
            </div>
            {d.status === "open" && (
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => resolve(d.id, "refund_student")}>Refund student</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(d.id, "release_tutor")}>Release to tutor</Button>
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
    queryKey: ["superadmin-education-violations"],
    queryFn: async () => {
      const { data } = await supabase.from("education_chat_violations")
        .select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <div className="space-y-2">
      {rows.map((v: any) => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="font-bold">{(v.categories ?? []).join(", ") || "—"}</span>
            <span className="text-xs text-muted-foreground">severity: {v.severity}</span>
          </div>
          {v.raw_body && <p className="mt-1 text-xs text-muted-foreground">{v.raw_body}</p>}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No violations flagged.</p>}
    </div>
  );
}
