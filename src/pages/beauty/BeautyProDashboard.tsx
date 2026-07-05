import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, ArrowLeft, Plus, Trash2, Pencil, Loader2, Calendar,
  Scissors, Clock, ShieldCheck, MessageCircle, TrendingUp, Wallet, ChevronRight,
  Check, X, Ban, Image as ImageIcon, Video, Upload,
  Menu, Bell, Search, Settings as SettingsIcon, LogOut, Home, BarChart3,
  User, CreditCard, Star, ArrowUpRight, ArrowDownRight, ExternalLink, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { BEAUTY_CATEGORIES } from "@/lib/beautyCategories";
const CATEGORIES = BEAUTY_CATEGORIES;

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]; // 1..7 iso; we use 0..6 (Mon=0)

const STATUS_TONE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  refunded: "bg-muted text-muted-foreground",
  no_show: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  disputed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Paiement en attente",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  refunded: "Remboursé",
  no_show: "Absence",
  disputed: "Litige",
};

const NAV_SECTIONS: {
  label: string;
  items: { key: string; label: string; icon: any; badge?: string }[];
}[] = [
  {
    label: "Pilotage",
    items: [
      { key: "overview", label: "Vue d'ensemble", icon: Home },
      { key: "bookings", label: "Rendez-vous", icon: Calendar },
      { key: "stats", label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { key: "services", label: "Services", icon: Scissors },
      { key: "portfolio", label: "Portfolio", icon: ImageIcon },
      { key: "availability", label: "Disponibilités", icon: Clock },
    ],
  },
  {
    label: "Communication",
    items: [
      { key: "messages", label: "Messages", icon: MessageCircle },
      { key: "reviews", label: "Avis clients", icon: Star },
    ],
  },
  {
    label: "Compte",
    items: [
      { key: "settings", label: "Paramètres", icon: SettingsIcon },
      { key: "payouts", label: "Paiements & KYC", icon: CreditCard },
    ],
  },
];


export default function BeautyProDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") ?? "overview";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=${encodeURIComponent("/beauty/pro")}`);
    }
  }, [user, authLoading, navigate]);

  const { data: provider, isLoading: provLoading } = useQuery({
    queryKey: ["beauty-my-provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_providers")
        .select("*, beauty_provider_stats(*)")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const providerId = provider?.id as string | undefined;

  // Redirect to onboarding if no provider profile
  useEffect(() => {
    if (!provLoading && user && provider === null) {
      navigate("/beauty/pro/onboarding");
    }
  }, [provLoading, user, provider, navigate]);

  if (authLoading || provLoading || !provider) {
    return (
      <div className="min-h-dvh bg-background p-6 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const stats = (provider as any).beauty_provider_stats;

  return (
    <div className="beauty-scope min-h-dvh bg-gradient-to-b from-primary/5 via-background to-background pb-24">
      {/* Gradient hero header */}
      <header className="relative overflow-hidden beauty-gradient text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pt-5 pb-8">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/beauty")} className="flex items-center gap-2 text-white/90 hover:text-white text-sm">
              <ArrowLeft className="h-4 w-4" /> SiteViral Beauty
            </button>
            <Badge className={cn(
              "border-0 backdrop-blur bg-white/20 text-white hover:bg-white/25",
            )}>
              {provider.status === "active" ? "✓ Actif" :
               provider.status === "pending" ? "⏳ KYC en cours" : provider.status}
            </Badge>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/25">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <Scissors className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/70">Mon espace pro</div>
              <div className="text-2xl font-black truncate">{provider.business_name}</div>
              {provider.city && (
                <div className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                  <span className="opacity-70">📍</span> {provider.city}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 -mt-4">
        {provider.status !== "active" && (
          <Card className="mb-4 p-4 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 shadow-md">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-semibold">Ton profil est en attente de validation KYC.</div>
                <div className="text-muted-foreground mt-1">
                  Tu peux configurer tes services et disponibilités dès maintenant.
                  Ils seront visibles publiquement après validation.
                </div>
                <Button size="sm" variant="link" className="px-0 mt-1" asChild>
                  <Link to="/settings/kyc">Compléter le KYC →</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setSp({ tab: v })} className="mt-2">
          <TabsList className="grid grid-cols-5 w-full bg-card/80 backdrop-blur border shadow-sm">
            <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 mr-1 sm:hidden" /><span className="hidden sm:inline">Vue d'ensemble</span><span className="sm:hidden">Vue</span></TabsTrigger>
            <TabsTrigger value="services"><Scissors className="h-4 w-4 mr-1 sm:hidden" /><span className="hidden sm:inline">Services</span><span className="sm:hidden">Serv.</span></TabsTrigger>
            <TabsTrigger value="portfolio"><ImageIcon className="h-4 w-4 mr-1 sm:hidden" /><span className="hidden sm:inline">Portfolio</span><span className="sm:hidden">Photos</span></TabsTrigger>
            <TabsTrigger value="availability"><Clock className="h-4 w-4 mr-1 sm:hidden" /><span className="hidden sm:inline">Disponibilités</span><span className="sm:hidden">Dispo.</span></TabsTrigger>
            <TabsTrigger value="bookings"><Calendar className="h-4 w-4 mr-1 sm:hidden" /><span className="hidden sm:inline">Rendez-vous</span><span className="sm:hidden">RDV</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab providerId={providerId!} provider={provider} stats={stats} />
          </TabsContent>
          <TabsContent value="services" className="mt-6">
            <ServicesTab providerId={providerId!} providerCurrency={(provider as any).__payout_currency ?? "XOF"} />
          </TabsContent>
          <TabsContent value="portfolio" className="mt-6">
            <PortfolioTab providerId={providerId!} />
          </TabsContent>
          <TabsContent value="availability" className="mt-6">
            <AvailabilityTab providerId={providerId!} />
          </TabsContent>
          <TabsContent value="bookings" className="mt-6">
            <BookingsTab providerId={providerId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ───────────────────────── OVERVIEW ───────────────────────── */

function OverviewTab({ providerId, provider, stats }: { providerId: string; provider: any; stats: any }) {
  const { data: counts } = useQuery({
    queryKey: ["beauty-pro-counts", providerId],
    queryFn: async () => {
      const [pending, upcoming, unread] = await Promise.all([
        supabase.from("beauty_bookings").select("id", { count: "exact", head: true })
          .eq("provider_id", providerId).eq("status", "pending_payment"),
        supabase.from("beauty_bookings").select("id", { count: "exact", head: true })
          .eq("provider_id", providerId).in("status", ["confirmed", "in_progress"])
          .gte("slot_start", new Date().toISOString()),
        supabase.from("beauty_messages").select("id", { count: "exact", head: true })
          .is("read_at", null),
      ]);
      return {
        pending: pending.count ?? 0,
        upcoming: upcoming.count ?? 0,
        unread: unread.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="À venir" value={counts?.upcoming ?? 0} tone="rose" />
        <StatCard icon={Clock} label="En attente" value={counts?.pending ?? 0} tone="amber" />
        <StatCard icon={MessageCircle} label="Messages" value={counts?.unread ?? 0} tone="violet" />
        <StatCard icon={TrendingUp} label="Note" value={stats?.avg_rating?.toFixed(1) ?? "—"} tone="emerald" />
      </div>

      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl beauty-gradient text-white">
            <Wallet className="h-4 w-4" />
          </span>
          <div className="font-semibold">Profil public</div>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          Ton profil est visible à l'adresse <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/beauty/p/{provider.slug}</code>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" className="beauty-gradient text-white hover:opacity-90">
            <Link to={`/beauty/p/${provider.slug}`}>Voir mon profil</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/beauty/messages">Messages</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "primary" }: { icon: any; label: string; value: any; tone?: "primary" | "rose" | "amber" | "violet" | "emerald" }) {
  const tones: Record<string, string> = {
    primary: "from-primary/10 to-primary/5 text-primary",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-500 dark:text-rose-400",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-500 dark:text-violet-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <Card className={`p-4 bg-gradient-to-br ${tones[tone]} border-border/60`}>
      <Icon className="h-4 w-4 mb-2 opacity-80" />
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

/* ───────────────────────── SERVICES ───────────────────────── */

function ServicesTab({ providerId, providerCurrency }: { providerId: string; providerCurrency: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["beauty-pro-services", providerId],
    queryFn: async () => {
      const { data } = await supabase.from("beauty_services").select("*")
        .eq("provider_id", providerId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: payoutCurrency } = useQuery({
    queryKey: ["beauty-payout-currency"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "XOF";
      const { data } = await supabase.from("payout_profiles").select("payout_currency").eq("user_id", user.id).maybeSingle();
      return data?.payout_currency ?? "XOF";
    },
  });

  const currency = payoutCurrency ?? providerCurrency ?? "XOF";

  const openNew = () => { setEditing({ category: CATEGORIES[0], duration_min: 60, price_amount: 10000, currency, at_salon: true, at_home: false, active: true, allow_deposit: false }); setOpen(true); };
  const openEdit = (s: any) => { setEditing({ ...s, currency: s.currency ?? currency, price_amount: s.price_amount ?? s.price_xof }); setOpen(true); };

  const save = async () => {
    if (!editing?.title?.trim()) { toast.error("Titre requis"); return; }
    const payload = {
      provider_id: providerId,
      category: editing.category,
      title: editing.title.trim(),
      description: editing.description?.trim() || null,
      duration_min: Number(editing.duration_min) || 60,
      currency: editing.currency,
      price_amount: Number(editing.price_amount) || 0,
      price_xof: editing.currency === "XOF" ? Number(editing.price_amount) || 0 : 0,
      at_salon: !!editing.at_salon,
      at_home: !!editing.at_home,
      active: !!editing.active,
      allow_deposit: !!editing.allow_deposit,
      allow_full_escrow: true,
      deposit_pct: 20,
      allow_cash: false,
    };
    const { error } = editing.id
      ? await supabase.from("beauty_services").update(payload).eq("id", editing.id)
      : await supabase.from("beauty_services").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Service mis à jour" : "Service créé");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["beauty-pro-services", providerId] });
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    const { error } = await supabase.from("beauty_services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["beauty-pro-services", providerId] });
  };

  const toggleActive = async (s: any) => {
    await supabase.from("beauty_services").update({ active: !s.active }).eq("id", s.id);
    qc.invalidateQueries({ queryKey: ["beauty-pro-services", providerId] });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {services?.length ?? 0} service(s) · Devise: <b>{currency}</b>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nouveau</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !services?.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucun service. Crée ton premier service.
        </Card>
      ) : (
        services.map((s: any) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold">{s.title}</div>
                  <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                  {!s.active && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(s.price_amount ?? s.price_xof, s.currency)} · {s.duration_min} min ·
                  {s.at_salon && " Salon"}{s.at_home && " · Domicile"}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => toggleActive(s)}>
                  {s.active ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </div>
            </div>
          </Card>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier le service" : "Nouveau service"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Catégorie</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titre</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Durée (min)</Label>
                  <Input type="number" value={editing.duration_min} onChange={(e) => setEditing({ ...editing, duration_min: e.target.value })} />
                </div>
                <div>
                  <Label>Devise</Label>
                  <Select value={editing.currency} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prix</Label>
                  <Input type="number" value={editing.price_amount} onChange={(e) => setEditing({ ...editing, price_amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between rounded border p-2 text-sm">Salon<Switch checked={!!editing.at_salon} onCheckedChange={(v) => setEditing({ ...editing, at_salon: v })} /></label>
                <label className="flex items-center justify-between rounded border p-2 text-sm">Domicile<Switch checked={!!editing.at_home} onCheckedChange={(v) => setEditing({ ...editing, at_home: v })} /></label>
                <label className="flex items-center justify-between rounded border p-2 text-sm">Actif<Switch checked={!!editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /></label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────────────────────── AVAILABILITY ───────────────────────── */

function AvailabilityTab({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const { data: hours } = useQuery({
    queryKey: ["beauty-availability", providerId],
    queryFn: async () => {
      const { data } = await supabase.from("beauty_availability").select("*")
        .eq("provider_id", providerId).order("weekday").order("start_time");
      return data ?? [];
    },
  });
  const { data: blocks } = useQuery({
    queryKey: ["beauty-blocks", providerId],
    queryFn: async () => {
      const { data } = await supabase.from("beauty_availability_blocks").select("*")
        .eq("provider_id", providerId).gte("ends_at", new Date().toISOString()).order("starts_at");
      return data ?? [];
    },
  });

  const addSlot = async (weekday: number) => {
    const { error } = await supabase.from("beauty_availability").insert({
      provider_id: providerId, weekday, start_time: "09:00", end_time: "18:00",
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["beauty-availability", providerId] });
  };
  const updateSlot = async (id: string, patch: any) => {
    await supabase.from("beauty_availability").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["beauty-availability", providerId] });
  };
  const removeSlot = async (id: string) => {
    await supabase.from("beauty_availability").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["beauty-availability", providerId] });
  };

  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const addBlock = async () => {
    if (!blockStart || !blockEnd) return toast.error("Dates requises");
    const { error } = await supabase.from("beauty_availability_blocks").insert({
      provider_id: providerId,
      starts_at: new Date(blockStart).toISOString(),
      ends_at: new Date(blockEnd).toISOString(),
      reason: blockReason || null,
    });
    if (error) return toast.error(error.message);
    setBlockStart(""); setBlockEnd(""); setBlockReason("");
    qc.invalidateQueries({ queryKey: ["beauty-blocks", providerId] });
  };
  const removeBlock = async (id: string) => {
    await supabase.from("beauty_availability_blocks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["beauty-blocks", providerId] });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="font-semibold mb-3">Horaires hebdomadaires</div>
        <div className="space-y-3">
          {WEEKDAYS.map((day, idx) => {
            const dayHours = hours?.filter((h: any) => h.weekday === idx) ?? [];
            return (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{day}</div>
                  <Button size="sm" variant="ghost" onClick={() => addSlot(idx)}>
                    <Plus className="h-3 w-3 mr-1" />Créneau
                  </Button>
                </div>
                {dayHours.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Fermé</div>
                ) : (
                  <div className="space-y-2">
                    {dayHours.map((h: any) => (
                      <div key={h.id} className="flex items-center gap-2">
                        <Input type="time" defaultValue={h.start_time.slice(0, 5)}
                          onBlur={(e) => updateSlot(h.id, { start_time: e.target.value })}
                          className="w-28" />
                        <span className="text-muted-foreground">→</span>
                        <Input type="time" defaultValue={h.end_time.slice(0, 5)}
                          onBlur={(e) => updateSlot(h.id, { end_time: e.target.value })}
                          className="w-28" />
                        <Button size="icon" variant="ghost" onClick={() => removeSlot(h.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-3 flex items-center gap-2">
          <Ban className="h-4 w-4" />Congés / indisponibilités
        </div>
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          <div>
            <Label className="text-xs">Début</Label>
            <Input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Fin</Label>
            <Input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Raison (optionnel)</Label>
            <div className="flex gap-2">
              <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Vacances…" />
              <Button size="icon" onClick={addBlock}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        {!blocks?.length ? (
          <div className="text-xs text-muted-foreground">Aucune indisponibilité prévue.</div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <div>{new Date(b.starts_at).toLocaleString("fr-FR")} → {new Date(b.ends_at).toLocaleString("fr-FR")}</div>
                  {b.reason && <div className="text-xs text-muted-foreground">{b.reason}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeBlock(b.id)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ───────────────────────── BOOKINGS INBOX ───────────────────────── */

function BookingsTab({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const navigate = useNavigate();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["beauty-pro-bookings", providerId, filter],
    queryFn: async () => {
      let q = supabase.from("beauty_bookings")
        .select("id, status, slot_start, slot_end, price_amount, currency, address, location_type, client_id, beauty_services(title)")
        .eq("provider_id", providerId)
        .order("slot_start", { ascending: filter === "past" ? false : true })
        .limit(50);
      if (filter === "upcoming") q = q.gte("slot_start", new Date().toISOString()).in("status", ["confirmed", "in_progress", "pending_payment"]);
      if (filter === "past") q = q.lt("slot_start", new Date().toISOString());
      const { data } = await q;
      return data ?? [];
    },
  });

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("beauty_bookings").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marqué comme terminé");
    qc.invalidateQueries({ queryKey: ["beauty-pro-bookings", providerId, filter] });
  };
  const cancel = async (id: string) => {
    if (!confirm("Annuler cette réservation ?")) return;
    const { error } = await supabase.from("beauty_bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["beauty-pro-bookings", providerId, filter] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "upcoming" ? "À venir" : f === "past" ? "Passées" : "Toutes"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !bookings?.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucune réservation.
        </Card>
      ) : (
        bookings.map((b: any) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold">{b.beauty_services?.title ?? "Service"}</div>
                  <Badge className={cn("text-[10px]", STATUS_TONE[b.status] ?? "bg-muted")}>{b.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(b.slot_start).toLocaleString("fr-FR")} · {b.location_type} · {formatCurrency(b.price_amount ?? 0, b.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Client #{b.client_id?.slice(0, 6)}{b.address ? ` · ${b.address}` : ""}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {b.status === "confirmed" && (
                  <Button size="sm" variant="outline" onClick={() => markComplete(b.id)}><Check className="h-3 w-3 mr-1" />Terminé</Button>
                )}
                {["confirmed", "pending_payment"].includes(b.status) && (
                  <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => cancel(b.id)}><X className="h-3 w-3 mr-1" />Annuler</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => navigate(`/beauty/bookings/${b.id}`)}>
                  Détails <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ---------------- Portfolio Tab ----------------
function PortfolioTab({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading } = useQuery({
    queryKey: ["beauty-pro-media", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_provider_media")
        .select("*")
        .eq("provider_id", providerId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const photos = (media ?? []).filter((m: any) => m.kind === "photo");
  const videos = (media ?? []).filter((m: any) => m.kind === "video");

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `beauty/portfolio/${providerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("org-uploads")
          .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (upErr) {
          toast.error(`Upload: ${upErr.message}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("org-uploads").getPublicUrl(path);
        await supabase.from("beauty_provider_media").insert({
          provider_id: providerId,
          kind: "photo",
          url: pub.publicUrl,
        } as any);
      }
      qc.invalidateQueries({ queryKey: ["beauty-pro-media", providerId] });
      toast.success("Photos ajoutées");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addVideo = async () => {
    if (!videoUrl.trim()) return;
    setAddingVideo(true);
    // Reuse embed helper
    const { getVideoEmbedUrl } = await import("@/lib/editorUpload");
    const embed = getVideoEmbedUrl(videoUrl.trim());
    if (!embed) {
      toast.error("Lien vidéo non reconnu (YouTube / Vimeo / TikTok / Instagram)");
      setAddingVideo(false);
      return;
    }
    const { error } = await supabase.from("beauty_provider_media").insert({
      provider_id: providerId,
      kind: "video",
      url: videoUrl.trim(),
      embed_url: embed,
      caption: videoCaption || null,
    } as any);
    setAddingVideo(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVideoUrl("");
    setVideoCaption("");
    qc.invalidateQueries({ queryKey: ["beauty-pro-media", providerId] });
  };

  const remove = async (id: string) => {
    await supabase.from("beauty_provider_media").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["beauty-pro-media", providerId] });
  };

  return (
    <div className="space-y-6">
      {/* Photos */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h3 className="font-bold">Photos ({photos.length})</h3>
          </div>
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-1 h-4 w-4" />Ajouter</>}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !photos.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-xl">
            Ajoute des photos de tes réalisations, ton salon, avant/après.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p: any) => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => remove(p.id)}
                  className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition grid place-items-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Videos */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Vidéos ({videos.length})</h3>
        </div>
        <div className="space-y-2 mb-4">
          <Input
            placeholder="Colle un lien YouTube, TikTok, Instagram, Vimeo…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Input
            placeholder="Légende (optionnelle)"
            value={videoCaption}
            onChange={(e) => setVideoCaption(e.target.value)}
          />
          <Button onClick={addVideo} disabled={!videoUrl.trim() || addingVideo} size="sm">
            {addingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" />Ajouter la vidéo</>}
          </Button>
        </div>
        {!videos.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-xl">
            Aucune vidéo pour l'instant.
          </p>
        ) : (
          <div className="space-y-3">
            {videos.map((v: any) => (
              <div key={v.id} className="rounded-xl border overflow-hidden">
                {v.embed_url && (
                  <div className="aspect-video bg-black">
                    <iframe src={v.embed_url} className="h-full w-full" allowFullScreen title={v.caption ?? ""} />
                  </div>
                )}
                <div className="flex items-center justify-between p-2 bg-card">
                  <span className="text-xs text-muted-foreground truncate">{v.caption ?? v.url}</span>
                  <Button variant="ghost" size="icon" onClick={() => remove(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
