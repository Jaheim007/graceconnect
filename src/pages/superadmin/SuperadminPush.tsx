import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Bell, Send, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Zap,
  Rocket, Users, Package, ShoppingCart, Link2, Eye
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

interface PushLog {
  id: string;
  title: string;
  message: string;
  status: 'success' | 'error';
  recipients: number;
  error?: string;
  sentAt: Date;
}

interface CampaignResult {
  total_users: number;
  emails_sent: number;
  emails_failed: number;
  notifications_created: number;
  segments: { ghost: number; no_product: number; no_sales: number; ambassador: number };
}

export default function SuperadminPush() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<PushLog[]>([]);

  // Reactivation campaign state
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignPreview, setCampaignPreview] = useState<any>(null);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [selectedSegment, setSelectedSegment] = useState('all');

  const sendPush = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    const logEntry: PushLog = {
      id: crypto.randomUUID(),
      title: title.trim(),
      message: message.trim(),
      status: 'success',
      recipients: 0,
      sentAt: new Date(),
    };
    try {
      const { data: subs } = await db.from('push_subscriptions')
        .select('user_id')
        .limit(500);
      const uniqueUserIds = [...new Set((subs || []).map(s => s.user_id))];
      for (const userId of uniqueUserIds) {
        await db.from('user_notifications').insert({
          user_id: userId,
          title: title.trim(),
          body: message.trim(),
          notification_type: 'broadcast',
        });
      }
      logEntry.recipients = uniqueUserIds.length;
      logEntry.status = 'success';
      toast({ title: `✅ Notification envoyée à ${logEntry.recipients} utilisateur(s)` });
    } catch (err: any) {
      logEntry.status = 'error';
      logEntry.error = err.message || 'Unknown error';
      toast({ title: 'Erreur d\'envoi', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
      setLogs(prev => [logEntry, ...prev]);
    }
  };

  const { data: subCount = 0 } = useQuery({
    queryKey: ['sa-push-sub-count'],
    queryFn: async () => {
      const { count } = await db.from('push_subscriptions').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const handleCampaignPreview = async () => {
    setCampaignLoading(true);
    setCampaignResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('reactivation-campaign', {
        body: { dry_run: true, segment: selectedSegment },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setCampaignPreview(data);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleCampaignLaunch = async () => {
    setCampaignLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('reactivation-campaign', {
        body: { dry_run: false, segment: selectedSegment },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setCampaignResult(data.summary);
      setCampaignPreview(null);
      toast({ title: '🚀 Campagne de réactivation lancée !' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setCampaignLoading(false);
    }
  };

  const segmentInfo = [
    { key: 'ghost', label: 'Fantômes (0 action)', icon: Users, color: 'text-red-500' },
    { key: 'no_product', label: 'Org sans produit', icon: Package, color: 'text-orange-500' },
    { key: 'no_sales', label: 'Publié, 0 vente', icon: ShoppingCart, color: 'text-yellow-500' },
    { key: 'ambassador', label: 'Liens inactifs', icon: Link2, color: 'text-blue-500' },
  ];

  return (
    <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      initial="hidden" animate="visible" className="space-y-6">

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Push & Réactivation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Notifications push · Campagne de réactivation segmentée · {subCount} abonné(s)
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1.5 px-3 py-1.5">
          <Zap className="h-3 w-3" /> Web Push + Email
        </Badge>
      </motion.div>

      {/* ═══ REACTIVATION CAMPAIGN ═══ */}
      <motion.div variants={fadeUp} className="bg-card border border-primary/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Campagne de Réactivation
          </h2>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            Email + Notification in-app
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Envoie un email personnalisé + notification in-app à chaque utilisateur selon son segment d'activité.
        </p>

        {/* Segment selector */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm" variant={selectedSegment === 'all' ? 'default' : 'outline'}
            className="text-[11px] h-8"
            onClick={() => setSelectedSegment('all')}
          >
            Tous les segments
          </Button>
          {segmentInfo.map(s => (
            <Button
              key={s.key} size="sm"
              variant={selectedSegment === s.key ? 'default' : 'outline'}
              className="text-[11px] h-8 gap-1"
              onClick={() => setSelectedSegment(s.key)}
            >
              <s.icon className={cn('h-3 w-3', selectedSegment !== s.key && s.color)} />
              {s.label}
            </Button>
          ))}
        </div>

        {/* Preview / Launch */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"
            disabled={campaignLoading} onClick={handleCampaignPreview}>
            {campaignLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            Prévisualiser
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary"
            disabled={campaignLoading || !campaignPreview} onClick={handleCampaignLaunch}>
            {campaignLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
            🚀 Lancer la campagne
          </Button>
        </div>

        {/* Preview results */}
        {campaignPreview && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">Prévisualisation — {campaignPreview.summary?.total || 0} utilisateurs ciblés</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {segmentInfo.map(s => (
                <div key={s.key} className="bg-card rounded-lg p-3 text-center border border-border">
                  <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
                  <p className="text-lg font-bold">{campaignPreview.summary?.[s.key] || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign result */}
        {campaignResult && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Campagne envoyée !
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{campaignResult.total_users}</p>
                <p className="text-[10px] text-muted-foreground">Utilisateurs ciblés</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{campaignResult.emails_sent}</p>
                <p className="text-[10px] text-muted-foreground">Emails envoyés</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-500">{campaignResult.emails_failed}</p>
                <p className="text-[10px] text-muted-foreground">Emails échoués</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-500">{campaignResult.notifications_created}</p>
                <p className="text-[10px] text-muted-foreground">Notifications créées</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ BROADCAST PUSH ═══ */}
      <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" /> Envoyer une notification broadcast
        </h2>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Titre</label>
          <Input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="🔔 Nouvelle annonce SiteViral" className="h-9 text-sm" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Message</label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Ceci est un message broadcast..." rows={3} className="text-sm" />
        </div>

        <Button className="gap-1.5" disabled={!title.trim() || !message.trim() || sending} onClick={sendPush}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer la notification
        </Button>
      </motion.div>

      {/* ═══ HISTORY ═══ */}
      <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Historique d'envoi
          </h2>
          {logs.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setLogs([])} className="text-xs gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Effacer
            </Button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Aucun envoi effectué pour cette session.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all',
                  log.status === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-destructive/20 bg-destructive/5'
                )}>
                  <div className="shrink-0 mt-0.5">
                    {log.status === 'success'
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{log.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.message}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {log.status === 'success' ? (
                        <span className="text-[10px] text-emerald-600 font-medium">{log.recipients} destinataire(s)</span>
                      ) : (
                        <span className="text-[10px] text-destructive font-medium">{log.error}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(log.sentAt, 'HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </motion.div>
  );
}