import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { callFn } from '@/lib/api';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell, Send, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Zap
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

export default function SuperadminPush() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<PushLog[]>([]);

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
      // Create a notification for all users with push subscriptions
      const { data: subs } = await db.from('push_subscriptions')
        .select('user_id')
        .limit(500);
      
      const uniqueUserIds = [...new Set((subs || []).map(s => s.user_id))];
      
      // Insert notifications for each user — the DB trigger will send push + email
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

  return (
    <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      initial="hidden" animate="visible" className="space-y-6">

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Push Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Envoyez des notifications push natives · {subCount} abonné(s) enregistré(s)
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1.5 px-3 py-1.5">
          <Zap className="h-3 w-3" /> Web Push (VAPID)
        </Badge>
      </motion.div>

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
