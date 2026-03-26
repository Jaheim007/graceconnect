import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import {
  CheckCircle, AlertTriangle, XCircle, Activity, Database, Shield,
  Mail, Zap, RefreshCw, Loader2, ExternalLink, ArrowRight, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SystemStatus = 'healthy' | 'warning' | 'critical';

interface SystemCheck {
  key: string;
  name: string;
  icon: React.ReactNode;
  status: SystemStatus;
  detail: string;
  value?: number;
}

// Explanations & actions per check key
function getCheckMeta(key: string, status: SystemStatus, value: number | undefined, isFr: boolean) {
  const meta: Record<string, {
    explanation: { healthy: string; warning: string; critical: string };
    actions: Array<{ label: string; route?: string; external?: string; variant?: 'default' | 'destructive' | 'outline' }>;
  }> = {
    database: {
      explanation: {
        healthy: isFr
          ? 'La base de données répond rapidement (< 500ms). Tout est normal.'
          : 'Database is responding quickly (< 500ms). Everything is normal.',
        warning: isFr
          ? 'La latence est élevée (500ms–2s). Les utilisateurs peuvent ressentir de la lenteur. Vérifiez les requêtes lourdes ou les index manquants.'
          : 'Latency is high (500ms–2s). Users may experience slowness. Check for heavy queries or missing indexes.',
        critical: isFr
          ? 'La base de données est très lente (> 2s) ou inaccessible. Les utilisateurs sont fortement impactés. Action immédiate requise.'
          : 'Database is very slow (> 2s) or unreachable. Users are severely impacted. Immediate action required.',
      },
      actions: [
        { label: isFr ? 'Voir Supabase Dashboard' : 'View Supabase Dashboard', external: `https://supabase.com/dashboard/project/xzgpzbrgsxtcsktiprik`, variant: 'outline' as const },
      ],
    },
    auth: {
      explanation: {
        healthy: isFr
          ? 'Le service d\'authentification fonctionne correctement. Les utilisateurs peuvent se connecter sans problème.'
          : 'Authentication service is working properly. Users can log in without issues.',
        warning: isFr
          ? 'Le service d\'authentification est lent. Les connexions peuvent prendre plus de temps que d\'habitude.'
          : 'Authentication service is slow. Logins may take longer than usual.',
        critical: isFr
          ? 'Le service d\'authentification est en panne. Les utilisateurs ne peuvent PAS se connecter. Vérifiez le statut Supabase.'
          : 'Authentication service is down. Users CANNOT log in. Check Supabase status.',
      },
      actions: [
        { label: isFr ? 'Voir les utilisateurs' : 'View users', route: '/superadmin/users', variant: 'outline' as const },
        { label: isFr ? 'Statut Supabase' : 'Supabase Status', external: 'https://status.supabase.com', variant: 'outline' as const },
      ],
    },
    emails: {
      explanation: {
        healthy: isFr
          ? 'Tous les emails ont été envoyés avec succès dans les dernières 24h. Aucun échec détecté.'
          : 'All emails were sent successfully in the last 24h. No failures detected.',
        warning: isFr
          ? `${value || 0} email(s) ont échoué dans les dernières 24h. Quelques utilisateurs n'ont peut-être pas reçu leurs emails (confirmations, réinitialisations, etc.).`
          : `${value || 0} email(s) failed in the last 24h. Some users may not have received their emails (confirmations, resets, etc.).`,
        critical: isFr
          ? `${value || 0} emails ont échoué en 24h ! Beaucoup d'utilisateurs ne reçoivent pas leurs emails. Vérifiez la configuration du domaine email et les logs.`
          : `${value || 0} emails failed in 24h! Many users are not receiving emails. Check email domain configuration and logs.`,
      },
      actions: [
        { label: isFr ? 'Voir les logs emails' : 'View email logs', route: '/superadmin/emails', variant: 'outline' as const },
        { label: isFr ? 'Voir le dashboard emails' : 'View email dashboard', external: `https://supabase.com/dashboard/project/xzgpzbrgsxtcsktiprik/functions`, variant: 'outline' as const },
      ],
    },
    kyc: {
      explanation: {
        healthy: isFr
          ? 'Aucune vérification d\'identité en attente depuis plus de 7 jours. Tout est à jour.'
          : 'No identity verifications pending for more than 7 days. Everything is up to date.',
        warning: isFr
          ? `${value || 0} vérification(s) sont en attente depuis plus de 7 jours. Les créateurs concernés ne peuvent pas retirer leurs fonds tant que leur identité n'est pas vérifiée.`
          : `${value || 0} verification(s) pending for 7+ days. Affected creators cannot withdraw funds until verified.`,
        critical: isFr
          ? `${value || 0} vérifications bloquées depuis 7+ jours ! Des créateurs ne peuvent pas recevoir leurs paiements. Traitez-les immédiatement.`
          : `${value || 0} verifications blocked for 7+ days! Creators cannot receive payments. Process them immediately.`,
      },
      actions: [
        { label: isFr ? 'Traiter les vérifications' : 'Process verifications', route: '/superadmin/kyc', variant: status === 'critical' ? 'destructive' as const : 'default' as const },
      ],
    },
    payouts: {
      explanation: {
        healthy: isFr
          ? 'Peu ou pas de demandes de retrait en attente. Les créateurs reçoivent leurs paiements dans les temps.'
          : 'Few or no pending withdrawal requests. Creators are receiving payments on time.',
        warning: isFr
          ? `${value || 0} demandes de retrait en attente. Les créateurs attendent leurs fonds. Traitez-les bientôt pour maintenir la confiance.`
          : `${value || 0} pending withdrawal requests. Creators are waiting for funds. Process them soon to maintain trust.`,
        critical: isFr
          ? `${value || 0} retraits en attente ! Les créateurs sont frustrés. Traitez-les en priorité absolue.`
          : `${value || 0} pending withdrawals! Creators are frustrated. Process them as top priority.`,
      },
      actions: [
        { label: isFr ? 'Traiter les retraits' : 'Process withdrawals', route: '/superadmin/settlements', variant: status === 'critical' ? 'destructive' as const : 'default' as const },
      ],
    },
    reports: {
      explanation: {
        healthy: isFr
          ? 'Aucun signalement de contenu en attente. La plateforme est propre.'
          : 'No content reports pending. Platform is clean.',
        warning: isFr
          ? `${value || 0} signalement(s) en attente de modération. Du contenu potentiellement problématique attend votre examen.`
          : `${value || 0} report(s) pending moderation. Potentially problematic content awaits your review.`,
        critical: isFr
          ? `${value || 0} signalements non traités ! Du contenu inapproprié est peut-être visible. Modérez immédiatement.`
          : `${value || 0} unresolved reports! Inappropriate content may be visible. Moderate immediately.`,
      },
      actions: [
        { label: isFr ? 'Modérer le contenu' : 'Moderate content', route: '/superadmin/moderation', variant: status === 'critical' ? 'destructive' as const : 'default' as const },
      ],
    },
    edge_functions: {
      explanation: {
        healthy: isFr
          ? 'Les Edge Functions répondent rapidement (< 3s). L\'IA, les paiements et les automatisations fonctionnent normalement.'
          : 'Edge Functions are responding quickly (< 3s). AI, payments, and automations are working normally.',
        warning: isFr
          ? `Latence élevée (${value || 0}ms). Les fonctions IA, les paiements et les webhooks peuvent être lents. Cela peut être temporaire ou indiquer une surcharge.`
          : `High latency (${value || 0}ms). AI, payment, and webhook functions may be slow. This may be temporary or indicate overload.`,
        critical: isFr
          ? 'Les Edge Functions sont en panne ! L\'IA, les paiements et les automatisations ne fonctionnent pas. Vérifiez les logs Supabase.'
          : 'Edge Functions are down! AI, payments, and automations are not working. Check Supabase logs.',
      },
      actions: [
        { label: isFr ? 'Voir les logs' : 'View logs', external: `https://supabase.com/dashboard/project/xzgpzbrgsxtcsktiprik/functions`, variant: 'outline' as const },
      ],
    },
  };

  const m = meta[key];
  if (!m) return { explanation: '', actions: [] };
  return {
    explanation: m.explanation[status],
    actions: m.actions,
  };
}

export default function SuperadminHealthDashboard() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: checks, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['superadmin-health'],
    queryFn: async (): Promise<SystemCheck[]> => {
      const results: SystemCheck[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Database connectivity
      try {
        const start = performance.now();
        await db.from('organizations').select('id', { count: 'exact', head: true });
        const latency = Math.round(performance.now() - start);
        results.push({
          key: 'database',
          name: isFr ? 'Base de données' : 'Database',
          icon: <Database className="h-4 w-4" />,
          status: latency < 500 ? 'healthy' : latency < 2000 ? 'warning' : 'critical',
          detail: `${isFr ? 'Latence' : 'Latency'}: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ key: 'database', name: isFr ? 'Base de données' : 'Database', icon: <Database className="h-4 w-4" />, status: 'critical', detail: isFr ? 'Connexion échouée' : 'Connection failed' });
      }

      // 2. Auth service
      try {
        const start = performance.now();
        await supabase.auth.getSession();
        const latency = Math.round(performance.now() - start);
        results.push({
          key: 'auth',
          name: isFr ? 'Authentification' : 'Authentication',
          icon: <Shield className="h-4 w-4" />,
          status: latency < 500 ? 'healthy' : 'warning',
          detail: `${isFr ? 'Latence' : 'Latency'}: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ key: 'auth', name: isFr ? 'Authentification' : 'Authentication', icon: <Shield className="h-4 w-4" />, status: 'critical', detail: isFr ? 'Service indisponible' : 'Service unavailable' });
      }

      // 3. Failed emails (24h)
      const { count: failedEmails } = await db
        .from('email_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', oneDayAgo.toISOString());
      results.push({
        key: 'emails',
        name: 'Emails',
        icon: <Mail className="h-4 w-4" />,
        status: (failedEmails || 0) === 0 ? 'healthy' : (failedEmails || 0) < 10 ? 'warning' : 'critical',
        detail: `${failedEmails || 0} ${isFr ? 'échec(s) en 24h' : 'failure(s) in 24h'}`,
        value: failedEmails || 0,
      });

      // 4. Pending KYC > 7 days
      const { count: staleKyc } = await db
        .from('kyc_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('submitted_at', sevenDaysAgo.toISOString());
      results.push({
        key: 'kyc',
        name: isFr ? 'Vérifications en retard' : 'Overdue verifications',
        icon: <Shield className="h-4 w-4" />,
        status: (staleKyc || 0) === 0 ? 'healthy' : (staleKyc || 0) < 5 ? 'warning' : 'critical',
        detail: `${staleKyc || 0} ${isFr ? 'soumission(s) > 7 jours' : 'submission(s) > 7 days'}`,
        value: staleKyc || 0,
      });

      // 5. Pending payouts
      const { count: pendingPayouts } = await db
        .from('payout_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      results.push({
        key: 'payouts',
        name: isFr ? 'Retraits en attente' : 'Pending withdrawals',
        icon: <Activity className="h-4 w-4" />,
        status: (pendingPayouts || 0) < 5 ? 'healthy' : (pendingPayouts || 0) < 20 ? 'warning' : 'critical',
        detail: `${pendingPayouts || 0} ${isFr ? 'demande(s)' : 'request(s)'}`,
        value: pendingPayouts || 0,
      });

      // 6. Content reports
      const { count: openReports } = await db
        .from('content_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      results.push({
        key: 'reports',
        name: isFr ? 'Signalements' : 'Reports',
        icon: <AlertTriangle className="h-4 w-4" />,
        status: (openReports || 0) === 0 ? 'healthy' : (openReports || 0) < 10 ? 'warning' : 'critical',
        detail: `${openReports || 0} ${isFr ? 'en attente' : 'pending'}`,
        value: openReports || 0,
      });

      // 7. Edge Functions
      try {
        const start = performance.now();
        await supabase.functions.invoke('platform-health-check', { body: { ping: true } });
        const latency = Math.round(performance.now() - start);
        results.push({
          key: 'edge_functions',
          name: 'Edge Functions',
          icon: <Zap className="h-4 w-4" />,
          status: latency < 3000 ? 'healthy' : 'warning',
          detail: `${isFr ? 'Latence' : 'Latency'}: ${latency}ms`,
          value: latency,
        });
      } catch {
        results.push({ key: 'edge_functions', name: 'Edge Functions', icon: <Zap className="h-4 w-4" />, status: 'warning', detail: isFr ? 'Vérification échouée' : 'Check failed' });
      }

      return results;
    },
    staleTime: 60_000,
  });

  const statusIcon = (s: SystemStatus) => {
    switch (s) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const statusBadge = (s: SystemStatus) => {
    switch (s) {
      case 'healthy': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{isFr ? 'Opérationnel' : 'Operational'}</Badge>;
      case 'warning': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">{isFr ? 'Attention' : 'Warning'}</Badge>;
      case 'critical': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{isFr ? 'Critique' : 'Critical'}</Badge>;
    }
  };

  const overallStatus: SystemStatus = !checks ? 'healthy'
    : checks.some(c => c.status === 'critical') ? 'critical'
    : checks.some(c => c.status === 'warning') ? 'warning'
    : 'healthy';

  const healthScore = !checks ? 100 : Math.round(
    (checks.filter(c => c.status === 'healthy').length / checks.length) * 100
  );

  const criticalCount = checks?.filter(c => c.status === 'critical').length || 0;
  const warningCount = checks?.filter(c => c.status === 'warning').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🏥 Platform Health</h1>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Surveillez et corrigez les problèmes en temps réel' : 'Monitor and fix issues in real-time'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isFr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Overall score with summary */}
      <div className={`rounded-2xl border p-6 space-y-3 ${
        overallStatus === 'healthy' ? 'border-emerald-500/30 bg-emerald-500/5' :
        overallStatus === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
        'border-destructive/30 bg-destructive/5'
      }`}>
        <div className="text-center space-y-1">
          <p className="text-5xl font-black">{healthScore}</p>
          <p className="text-sm text-muted-foreground">{isFr ? 'Score de santé / 100' : 'Health score / 100'}</p>
          {statusBadge(overallStatus)}
        </div>

        {/* Summary explanation */}
        <div className="mt-3 p-3 rounded-xl bg-background/60 border border-border/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {overallStatus === 'healthy' && (isFr
                ? 'Tous les systèmes fonctionnent normalement. Aucune action requise.'
                : 'All systems are operating normally. No action required.'
              )}
              {overallStatus === 'warning' && (isFr
                ? `${warningCount} système(s) nécessite(nt) votre attention. Cliquez sur chaque carte pour voir les détails et les actions recommandées.`
                : `${warningCount} system(s) need your attention. Click each card for details and recommended actions.`
              )}
              {overallStatus === 'critical' && (isFr
                ? `⚠️ ${criticalCount} problème(s) critique(s) détecté(s) ! Des utilisateurs sont potentiellement impactés. Cliquez sur les cartes rouges ci-dessous pour agir immédiatement.`
                : `⚠️ ${criticalCount} critical issue(s) detected! Users may be affected. Click the red cards below to take immediate action.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* System checks */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {checks?.map((check) => {
            const isExpanded = expanded === check.key;
            const meta = getCheckMeta(check.key, check.status, check.value, isFr);

            return (
              <div key={check.key} className={`rounded-xl border transition-colors ${
                check.status === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                check.status === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                'border-border bg-card'
              }`}>
                {/* Header row - clickable */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : check.key)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    check.status === 'critical' ? 'bg-destructive/10' :
                    check.status === 'warning' ? 'bg-amber-500/10' :
                    'bg-muted'
                  }`}>
                    {check.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{check.name}</p>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {statusBadge(check.status)}
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Expandable detail panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {/* Explanation */}
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{meta.explanation}</p>
                        </div>

                        {/* Action buttons */}
                        {meta.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {meta.actions.map((action, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant={action.variant || 'default'}
                                className="gap-1.5 text-xs h-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (action.route) navigate(action.route);
                                  if (action.external) window.open(action.external, '_blank');
                                }}
                              >
                                {action.route ? <ArrowRight className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isFr ? 'Légende' : 'Legend'}</p>
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {isFr ? 'Opérationnel — Aucune action' : 'Operational — No action'}</span>
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> {isFr ? 'Attention — Surveiller' : 'Warning — Monitor'}</span>
          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> {isFr ? 'Critique — Agir maintenant' : 'Critical — Act now'}</span>
        </div>
      </div>
    </div>
  );
}
