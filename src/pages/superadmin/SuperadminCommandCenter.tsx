import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Terminal, Zap, Shield, AlertTriangle, TrendingUp, Users, DollarSign,
  FileCheck, ShieldAlert, Mail, Bell, RefreshCw, ArrowRight, Activity,
  BarChart3, Megaphone, Settings, Wallet, Handshake, Download, Bot,
  CheckCircle2, Clock, XCircle, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  badge?: string;
}

export default function SuperadminCommandCenter() {
  const navigate = useNavigate();
  const weekAgo = subDays(new Date(), 7).toISOString();
  const [triggeringMode, setTriggeringMode] = useState<string | null>(null);

  // Aggregate critical stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['command-center-stats'],
    queryFn: async () => {
      const [
        { count: pendingKyc },
        { count: pendingReports },
        { count: pendingPayouts },
        { count: newOrgsWeek },
        { count: newUsersWeek },
        { data: recentSales },
        { data: recentDonations },
        { count: suspendedOrgs },
      ] = await Promise.all([
        db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('payout_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('organizations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        db.from('product_purchases').select('amount').eq('status', 'completed').gte('completed_at', weekAgo),
        db.from('donations').select('amount').eq('status', 'completed').gte('completed_at', weekAgo),
        db.from('organizations').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
      ]);

      const salesGMV = (recentSales || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
      const donationsGMV = (recentDonations || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);

      return {
        pendingKyc: pendingKyc || 0,
        pendingReports: pendingReports || 0,
        pendingPayouts: pendingPayouts || 0,
        newOrgsWeek: newOrgsWeek || 0,
        newUsersWeek: newUsersWeek || 0,
        weekGMV: salesGMV + donationsGMV,
        suspendedOrgs: suspendedOrgs || 0,
      };
    },
    staleTime: 60_000,
  });

  // Autopilot runs
  const { data: autopilotRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['autopilot-runs'],
    queryFn: async () => {
      const { data } = await db
        .from('ops_autopilot_runs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const triggerAutopilot = async (mode: 'daily' | 'weekly') => {
    setTriggeringMode(mode);
    try {
      const { data, error } = await supabase.functions.invoke('ops-autopilot', {
        body: { mode },
      });
      if (error) throw error;
      toast.success(`Autopilot ${mode} exécuté : ${data?.actions || 0} actions, ${data?.notifications || 0} notifications`);
      refetchRuns();
    } catch (e: any) {
      toast.error('Erreur : ' + (e.message || 'Échec'));
    } finally {
      setTriggeringMode(null);
    }
  };

  const quickActions: QuickAction[] = [
    { label: 'KYC Review', icon: FileCheck, path: '/superadmin/kyc', color: 'text-amber-500', badge: stats?.pendingKyc ? `${stats.pendingKyc}` : undefined },
    { label: 'Reports', icon: Megaphone, path: '/superadmin/reports', color: 'text-rose-500', badge: stats?.pendingReports ? `${stats.pendingReports}` : undefined },
    { label: 'Payouts', icon: Wallet, path: '/superadmin/settlements', color: 'text-emerald-500', badge: stats?.pendingPayouts ? `${stats.pendingPayouts}` : undefined },
    { label: 'Risk & AML', icon: ShieldAlert, path: '/superadmin/risk', color: 'text-red-500' },
    { label: 'Modération', icon: Shield, path: '/superadmin/moderation', color: 'text-violet-500' },
    { label: 'Users', icon: Users, path: '/superadmin/users', color: 'text-blue-500' },
    { label: 'Organizations', icon: BarChart3, path: '/superadmin/orgs', color: 'text-indigo-500' },
    { label: 'Activity', icon: Activity, path: '/superadmin/activity', color: 'text-sky-500' },
    { label: 'Emails', icon: Mail, path: '/superadmin/emails', color: 'text-pink-500' },
    { label: 'Push Notifs', icon: Bell, path: '/superadmin/push', color: 'text-orange-500' },
    { label: 'Partners', icon: Handshake, path: '/superadmin/partners', color: 'text-teal-500' },
    { label: 'Exports', icon: Download, path: '/superadmin/exports', color: 'text-cyan-500' },
    { label: 'Settings', icon: Settings, path: '/superadmin/settings', color: 'text-muted-foreground' },
  ];

  const alerts = [
    stats?.pendingKyc && stats.pendingKyc > 0 && { level: 'warning' as const, text: `${stats.pendingKyc} KYC en attente de review`, path: '/superadmin/kyc' },
    stats?.pendingReports && stats.pendingReports > 0 && { level: 'danger' as const, text: `${stats.pendingReports} signalement(s) non traité(s)`, path: '/superadmin/reports' },
    stats?.pendingPayouts && stats.pendingPayouts > 0 && { level: 'info' as const, text: `${stats.pendingPayouts} demande(s) de paiement en attente`, path: '/superadmin/settlements' },
    stats?.suspendedOrgs && stats.suspendedOrgs > 0 && { level: 'danger' as const, text: `${stats.suspendedOrgs} organisation(s) suspendue(s)`, path: '/superadmin/orgs' },
  ].filter(Boolean) as { level: string; text: string; path: string }[];

  const getRunStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
          <Terminal className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Command Center</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div key={i} variants={fadeUp}>
              <button
                onClick={() => navigate(alert.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left',
                  alert.level === 'danger' && 'bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10',
                  alert.level === 'warning' && 'bg-amber-500/5 border-amber-500/20 text-amber-600 hover:bg-amber-500/10',
                  alert.level === 'info' && 'bg-blue-500/5 border-blue-500/20 text-blue-600 hover:bg-blue-500/10',
                )}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{alert.text}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* KPI Summary */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'GMV 7j', value: formatCurrency(stats?.weekGMV || 0, 'XOF'), icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Nouvelles orgs', value: stats?.newOrgsWeek || 0, icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Nouveaux users', value: stats?.newUsersWeek || 0, icon: Users, color: 'text-violet-500' },
          { label: 'Actions urgentes', value: alerts.length, icon: Zap, color: alerts.length > 0 ? 'text-amber-500' : 'text-emerald-500' },
        ].map((kpi, i) => (
          <motion.div key={i} variants={fadeUp}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-lg font-bold">{typeof kpi.value === 'number' ? kpi.value : kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Ops Autopilot Panel */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Ops Autopilot
              <Badge variant="secondary" className="text-[9px] px-1.5">6 départements</Badge>
            </CardTitle>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => triggerAutopilot('daily')}
                disabled={!!triggeringMode}
              >
                {triggeringMode === 'daily' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Daily
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => triggerAutopilot('weekly')}
                disabled={!!triggeringMode}
              >
                {triggeringMode === 'weekly' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Weekly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Departments covered */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { label: 'Growth', icon: '🚀', desc: 'TTFV, activation, rétention' },
              { label: 'Support', icon: '🛟', desc: 'SLA, KYC, signalements' },
              { label: 'Communauté', icon: '👥', desc: 'Leaderboard, onboarding' },
              { label: 'Marketing', icon: '📣', desc: 'Pages, analytics' },
              { label: 'Partenariats', icon: '🤝', desc: 'Churn, niveaux' },
              { label: 'Contenu', icon: '✍️', desc: 'Blog, qualité' },
            ].map((dept) => (
              <div key={dept.label} className="text-center p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="text-lg">{dept.icon}</div>
                <div className="text-[10px] font-medium">{dept.label}</div>
              </div>
            ))}
          </div>

          {/* Recent runs */}
          {autopilotRuns && autopilotRuns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dernières exécutions</p>
              {autopilotRuns.slice(0, 5).map((run: any) => (
                <div key={run.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-background/60 border border-border/30">
                  {getRunStatusIcon(run.status)}
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {run.run_mode}
                  </Badge>
                  <span className="flex-1 text-muted-foreground truncate">
                    {run.alerts_generated} alertes · {run.notifications_sent} notifs · {(run.actions_taken as any[])?.length || 0} actions
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(!autopilotRuns || autopilotRuns.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Aucune exécution encore. Cliquez sur "Daily" ou "Weekly" pour lancer l'autopilot.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Actions rapides
        </h2>
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <motion.div key={action.path} variants={fadeUp}>
              <button
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <action.icon className={cn('h-4 w-4 shrink-0', action.color)} />
                <span className="text-xs font-medium flex-1">{action.label}</span>
                {action.badge && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{action.badge}</Badge>
                )}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
