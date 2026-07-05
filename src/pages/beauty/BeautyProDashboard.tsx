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
    <div className="beauty-scope min-h-dvh bg-muted/40 dark:bg-background flex">
      {/* Desktop sidebar */}
      <ProSidebar provider={provider} tab={tab} onNavigate={(k) => setSp({ tab: k })} className="hidden lg:flex" />

      {/* Mobile sidebar */}
      <Sheet>
        <SheetContent side="left" className="p-0 w-72">
          <ProSidebar provider={provider} tab={tab} onNavigate={(k) => setSp({ tab: k })} className="flex w-full border-none" />
        </SheetContent>
        {/* Trigger lives inside TopBar */}
        <TopBar provider={provider} navigate={navigate}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </TopBar>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {/* Page title */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {NAV_SECTIONS.flatMap(s => s.items).find(i => i.key === tab)?.label ?? "Vue d'ensemble"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenue <span className="font-semibold text-foreground">{provider.business_name}</span> — voici l'état de ton activité.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/beauty/p/${provider.slug}`} target="_blank"><ExternalLink className="h-4 w-4 mr-1.5" />Voir profil public</Link>
              </Button>
            </div>
          </div>

          {provider.status !== "active" && (
            <Card className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm flex-1">
                  <div className="font-semibold">Ton profil est en attente de validation KYC.</div>
                  <div className="text-muted-foreground mt-1">
                    Configure tes services et disponibilités dès maintenant. Ils seront visibles publiquement après validation.
                  </div>
                </div>
                <Button size="sm" variant="default" asChild>
                  <Link to="/settings/kyc">Compléter le KYC</Link>
                </Button>
              </div>
            </Card>
          )}

          {tab === "overview"     && <OverviewTab providerId={providerId!} provider={provider} stats={stats} onNavigate={(k) => setSp({ tab: k })} />}
          {tab === "services"     && <ServicesTab providerId={providerId!} providerCurrency={(provider as any).__payout_currency ?? "XOF"} />}
          {tab === "portfolio"    && <PortfolioTab providerId={providerId!} />}
          {tab === "availability" && <AvailabilityTab providerId={providerId!} />}
          {tab === "bookings"     && <BookingsTab providerId={providerId!} />}
          {tab === "stats"        && <StatsTab providerId={providerId!} />}
          {tab === "messages"     && <ExternalRedirectPanel to="/beauty/messages" title="Messagerie" description="Ouvre la messagerie SiteViral Beauty dans un espace dédié." icon={MessageCircle} />}
          {tab === "reviews"      && <ExternalRedirectPanel to={`/beauty/p/${provider.slug}?tab=reviews`} title="Avis clients" description="Consulte les avis publiés sur ton profil public." icon={Star} />}
          {tab === "settings"     && <SettingsTab provider={provider} />}
          {tab === "payouts"      && <PayoutsTab />}
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────── SHELL ───────────────────────── */

function ProSidebar({ provider, tab, onNavigate, className }: {
  provider: any; tab: string; onNavigate: (k: string) => void; className?: string;
}) {
  const navigate = useNavigate();
  return (
    <aside className={cn(
      "w-64 shrink-0 border-r bg-card flex-col",
      className
    )}>
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b">
        <span className="grid h-9 w-9 place-items-center rounded-xl beauty-gradient text-white shadow-sm">
          <Scissors className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-black tracking-tight">SiteViral</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Beauty Pro</div>
        </div>
      </div>

      {/* Business summary */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full beauty-gradient text-white text-sm font-black shrink-0">
            {provider.business_name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{provider.business_name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{provider.city ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3">
          <Badge className={cn(
            "text-[10px] font-bold border-0",
            provider.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
            provider.status === "pending" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            {provider.status === "active" ? "✓ Actif" : provider.status === "pending" ? "⏳ KYC en cours" : provider.status}
          </Badge>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = tab === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active && "text-primary")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3 space-y-1">
        <button
          onClick={() => navigate("/beauty")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à SiteViral Beauty
        </button>
      </div>
    </aside>
  );
}

function TopBar({ provider, navigate, children }: { provider: any; navigate: any; children?: React.ReactNode }) {
  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:hidden">
      {children}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg beauty-gradient text-white shrink-0">
          <Scissors className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-black truncate">{provider.business_name}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Beauty Pro</div>
        </div>
      </div>
      <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
    </header>
  );
}

/* ───────────────────────── OVERVIEW ───────────────────────── */

function OverviewTab({ providerId, provider, stats, onNavigate }: { providerId: string; provider: any; stats: any; onNavigate: (k: string) => void }) {
  const { data: counts } = useQuery({
    queryKey: ["beauty-pro-counts", providerId],
    queryFn: async () => {
      const [pending, upcoming, unread, completed30] = await Promise.all([
        supabase.from("beauty_bookings").select("id", { count: "exact", head: true })
          .eq("provider_id", providerId).eq("status", "pending_payment"),
        supabase.from("beauty_bookings").select("id", { count: "exact", head: true })
          .eq("provider_id", providerId).in("status", ["confirmed", "in_progress"])
          .gte("slot_start", new Date().toISOString()),
        supabase.from("beauty_messages").select("id", { count: "exact", head: true })
          .is("read_at", null),
        supabase.from("beauty_bookings").select("id", { count: "exact", head: true })
          .eq("provider_id", providerId).eq("status", "completed")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      return {
        pending: pending.count ?? 0,
        upcoming: upcoming.count ?? 0,
        unread: unread.count ?? 0,
        completed30: completed30.count ?? 0,
      };
    },
  });

  const { data: revenueSeries } = useQuery({
    queryKey: ["beauty-pro-revenue-30", providerId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("beauty_bookings")
        .select("total_amount, currency, created_at, status")
        .eq("provider_id", providerId)
        .in("status", ["completed", "confirmed", "in_progress"])
        .gte("created_at", since);
      // Bucket by day
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      (data ?? []).forEach((b: any) => {
        const key = String(b.created_at).slice(0, 10);
        if (key in buckets) buckets[key] += Number(b.total_amount ?? 0);
      });
      return Object.entries(buckets).map(([date, value]) => ({
        date: date.slice(5),
        value,
      }));
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["beauty-pro-upcoming", providerId],
    queryFn: async () => {
      const { data } = await supabase.from("beauty_bookings")
        .select("id, slot_start, status, total_amount, currency, client_id, service_id, beauty_services(title)")
        .eq("provider_id", providerId)
        .in("status", ["confirmed", "in_progress", "pending_payment"])
        .gte("slot_start", new Date().toISOString())
        .order("slot_start", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["beauty-pro-activity", providerId],
    queryFn: async () => {
      const { data } = await supabase.from("beauty_bookings")
        .select("id, status, updated_at, created_at, total_amount, currency, beauty_services(title)")
        .eq("provider_id", providerId)
        .order("updated_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const totalRevenue = (revenueSeries ?? []).reduce((s, d) => s + d.value, 0);
  const currency = (provider as any).__payout_currency ?? "XOF";

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard tone="rose" icon={Calendar} label="Rendez-vous à venir" value={counts?.upcoming ?? 0} sub="Prochains 30 jours" />
        <KpiCard tone="amber" icon={Clock} label="En attente de paiement" value={counts?.pending ?? 0} sub="À finaliser côté client" />
        <KpiCard tone="emerald" icon={TrendingUp} label="Terminés (30j)" value={counts?.completed30 ?? 0} sub="Prestations complétées" />
        <KpiCard tone="violet" icon={Star} label="Note moyenne" value={stats?.avg_rating?.toFixed(1) ?? "—"} sub={`${stats?.total_reviews ?? 0} avis clients`} />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Chiffre d'affaires · 30 derniers jours</div>
              <div className="text-2xl font-black mt-1">{formatCurrency(totalRevenue, currency)}</div>
            </div>
            <Badge variant="outline" className="text-[10px]">Escrow inclus</Badge>
          </div>
          <div className="h-56 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={40} />
                <ReTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => formatCurrency(Number(v), currency)}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Activité récente</div>
          </div>
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0",
                    a.status === "completed" ? "bg-emerald-500" :
                    a.status === "confirmed" ? "bg-blue-500" :
                    a.status === "cancelled" || a.status === "no_show" ? "bg-rose-500" :
                    "bg-amber-500"
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.beauty_services?.title ?? "Réservation"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {STATUS_LABEL[a.status] ?? a.status} · {new Date(a.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="text-xs font-semibold shrink-0">{formatCurrency(Number(a.total_amount ?? 0), a.currency ?? currency)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Aucune activité pour l'instant.</div>
          )}
        </Card>
      </div>

      {/* Upcoming appointments table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Prochains rendez-vous</div>
            <div className="text-sm text-muted-foreground mt-0.5">Les {(upcoming ?? []).length} suivants</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>
            Tout voir <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        {upcoming && upcoming.length > 0 ? (
          <div className="border-t">
            <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b bg-muted/40">
              <div className="col-span-5">Service</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2 text-right">Montant</div>
            </div>
            {upcoming.map((b: any) => (
              <div key={b.id} className="grid grid-cols-12 gap-3 px-5 py-3 text-sm border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                <div className="col-span-5 min-w-0">
                  <div className="font-medium truncate">{b.beauty_services?.title ?? "Prestation"}</div>
                  <div className="text-[11px] text-muted-foreground">#{b.id.slice(0, 8)}</div>
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {new Date(b.slot_start).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="col-span-2">
                  <Badge className={cn("border-0 text-[10px]", STATUS_TONE[b.status])}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                </div>
                <div className="col-span-2 text-right font-semibold">
                  {formatCurrency(Number(b.total_amount ?? 0), b.currency ?? currency)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t px-5 py-10 text-center text-sm text-muted-foreground">
            Aucun rendez-vous à venir. Partage ton <Link to={`/beauty/p/${provider.slug}`} className="text-primary underline">profil public</Link> pour recevoir des réservations.
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction icon={Scissors} title="Gérer mes services" description="Ajoute, modifie ou active tes prestations." onClick={() => onNavigate("services")} />
        <QuickAction icon={Clock} title="Mes disponibilités" description="Configure tes horaires et créneaux bloqués." onClick={() => onNavigate("availability")} />
        <QuickAction icon={ImageIcon} title="Enrichir mon portfolio" description="Ajoute des photos avant/après pour rassurer." onClick={() => onNavigate("portfolio")} />
      </div>
    </div>
  );
}

function KpiCard({ tone, icon: Icon, label, value, sub }: {
  tone: "rose" | "amber" | "emerald" | "violet" | "primary";
  icon: any; label: string; value: any; sub?: string;
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-primary/15", text: "text-primary" },
    rose: { bg: "bg-rose-500/15", text: "text-rose-500 dark:text-rose-400" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
    violet: { bg: "bg-violet-500/15", text: "text-violet-500 dark:text-violet-400" },
  };
  const t = tones[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn("grid h-12 w-12 place-items-center rounded-full shrink-0", t.bg)}>
          <Icon className={cn("h-5 w-5", t.text)} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
          <div className="text-2xl font-black leading-tight">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }: { icon: any; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg beauty-gradient text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div className="font-semibold">{title}</div>
        <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

function ExternalRedirectPanel({ to, title, description, icon: Icon }: { to: string; title: string; description: string; icon: any }) {
  return (
    <Card className="p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl beauty-gradient text-white mb-4">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 mb-5 max-w-md mx-auto">{description}</p>
      <Button asChild className="beauty-gradient text-white">
        <Link to={to}>Ouvrir <ChevronRight className="h-4 w-4 ml-1" /></Link>
      </Button>
    </Card>
  );
}

function StatsTab({ providerId }: { providerId: string }) {
  return (
    <Card className="p-8 text-center">
      <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <h2 className="text-xl font-black">Statistiques avancées</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Cohortes clients, taux de complétion, revenus par service et fidélisation. Disponible bientôt.
      </p>
    </Card>
  );
}

function SettingsTab({ provider }: { provider: any }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `/beauty/p/${provider.slug}`;
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${publicUrl}` : publicUrl;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </span>
          <div>
            <div className="font-bold">Profil professionnel</div>
            <div className="text-xs text-muted-foreground">Nom, bio, ville, photo</div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Nom" value={provider.business_name} />
          <Row label="Ville" value={provider.city ?? "—"} />
          <Row label="Adresse" value={provider.address ?? "—"} />
          <Row label="Spécialités" value={(provider.specialties ?? []).join(", ") || "—"} />
          <Row label="En salon" value={provider.at_salon_ok ? "Oui" : "Non"} />
          <Row label="À domicile" value={provider.home_service_ok ? "Oui" : "Non"} />
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" disabled>Modifier <Pencil className="h-3.5 w-3.5 ml-1.5" /></Button>
          <span className="text-[11px] text-muted-foreground self-center">Édition détaillée bientôt disponible.</span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ExternalLink className="h-4 w-4" />
          </span>
          <div>
            <div className="font-bold">Profil public</div>
            <div className="text-xs text-muted-foreground">Lien partageable</div>
          </div>
        </div>
        <div className="text-xs bg-muted px-3 py-2 rounded-lg break-all">{fullUrl}</div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1"
            onClick={() => { navigator.clipboard.writeText(fullUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Copié" : "Copier"}
          </Button>
          <Button size="sm" asChild className="flex-1 beauty-gradient text-white">
            <Link to={publicUrl} target="_blank">Ouvrir</Link>
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <div className="font-bold">Notifications</div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Configure les alertes email et in-app.</p>
        <Button size="sm" variant="outline" asChild className="w-full">
          <Link to="/notifications/preferences">Ouvrir les préférences</Link>
        </Button>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="font-bold">Sécurité & compte</div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Mot de passe, sessions, suppression du compte.</p>
        <Button size="sm" variant="outline" asChild className="w-full">
          <Link to="/settings">Ouvrir les paramètres</Link>
        </Button>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="font-bold">Statut du compte</div>
        </div>
        <Link to="/account/trust" className="text-xs text-primary underline">Voir mon score de confiance →</Link>
      </Card>
    </div>
  );
}

function PayoutsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold">KYC</div>
            <div className="text-xs text-muted-foreground">Vérification d'identité obligatoire</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Le KYC est indispensable pour recevoir tes paiements. Prévoit une pièce d'identité et un justificatif de domicile.
        </p>
        <Button asChild className="w-full beauty-gradient text-white">
          <Link to="/settings/kyc">Compléter le KYC</Link>
        </Button>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold">Paiements</div>
            <div className="text-xs text-muted-foreground">Devise, compte de réception, historique</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Payout minimum 10 000 XOF (≈ 15 EUR / 16 USD). Fonds débloqués 24-48h après la prestation confirmée.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/settings/payouts">Gérer mes paiements</Link>
        </Button>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-right max-w-[60%] truncate">{value}</div>
    </div>
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
