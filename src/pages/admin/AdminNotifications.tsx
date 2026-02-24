import { useState, useMemo } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { callFn } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Bell, Send, Plus, Users, BarChart3, Loader2, X, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminNotifications() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const orgId = currentOrg?.id;
  const [tab, setTab] = useState('send');
  const [showNew, setShowNew] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<string>('all');

  // Push subscribers count
  const { data: pushSubs = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['admin-push-subs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('push_subscriptions').select('id, created_at, user_id')
        .eq('organization_id', orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Sent notifications (org-scoped from user_notifications)
  const { data: sentNotifs = [], isLoading: loadingSent } = useQuery({
    queryKey: ['admin-sent-notifs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('user_notifications').select('id, title, body, notification_type, created_at, is_read')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Send push notification
  const sendPush = useMutation({
    mutationFn: async () => {
      if (!orgId || !title.trim() || !body.trim()) throw new Error(locale === 'fr' ? 'Titre et contenu requis' : 'Title and body required');
      // Use the send-push edge function
      return callFn('send-push', {
        organization_id: orgId,
        title: title.trim(),
        body: body.trim(),
        audience,
      }, true);
    },
    onSuccess: (data: any) => {
      toast({ title: `🔔 ${data?.sent || 0} ${locale === 'fr' ? 'notification(s) envoyée(s)' : 'notification(s) sent'}` });
      setTitle(''); setBody(''); setShowNew(false);
      qc.invalidateQueries({ queryKey: ['admin-sent-notifs', orgId] });
    },
    onError: (e: any) => toast({ title: locale === 'fr' ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' }),
  });

  // Analytics
  const totalSent = sentNotifs.length;
  const readCount = sentNotifs.filter((n: any) => n.is_read).length;
  const readRate = totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

  // Group by type
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sentNotifs.forEach((n: any) => {
      const type = n.notification_type || 'system';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sentNotifs]);

  return (
    <AdminPageShell
      title={locale === 'fr' ? 'Notifications Push' : 'Push Notifications'}
      subtitle={locale === 'fr' ? 'Envoyez et analysez vos notifications' : 'Send and analyze your notifications'}
      backRoute="/admin"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="send" className="gap-1.5"><Send className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Envoyer' : 'Send'}</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Historique' : 'History'}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Appareils enregistrés' : 'Registered devices'}</p>
              </div>
              <p className="text-xl font-bold">{pushSubs.length}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Envoyées (30j)' : 'Sent (30d)'}</p>
              </div>
              <p className="text-xl font-bold">{totalSent}</p>
            </div>
          </div>

          {/* Send form */}
          {showNew ? (
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{locale === 'fr' ? 'Nouvelle notification' : 'New notification'}</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNew(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">{locale === 'fr' ? 'Titre' : 'Title'} *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={locale === 'fr' ? 'Nouvelle mise à jour !' : 'New update!'} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{locale === 'fr' ? 'Message' : 'Message'} *</Label>
                  <Textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                    placeholder={locale === 'fr' ? 'Découvrez nos nouveaux contenus...' : 'Check out our new content...'} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{locale === 'fr' ? 'Audience' : 'Audience'}</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{locale === 'fr' ? 'Tous les abonnés' : 'All subscribers'} ({pushSubs.length})</SelectItem>
                      <SelectItem value="members">{locale === 'fr' ? 'Membres uniquement' : 'Members only'}</SelectItem>
                      <SelectItem value="admins">{locale === 'fr' ? 'Admins uniquement' : 'Admins only'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => sendPush.mutate()} disabled={!title.trim() || !body.trim() || sendPush.isPending} className="gap-1.5">
                {sendPush.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {locale === 'fr' ? 'Envoyer maintenant' : 'Send now'}
              </Button>
            </motion.div>
          ) : (
            <Button onClick={() => setShowNew(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> {locale === 'fr' ? 'Nouvelle notification' : 'New notification'}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingSent ? <SkeletonRow count={5} /> : sentNotifs.length === 0 ? (
            <EmptyState variant="generic" title={locale === 'fr' ? 'Aucune notification envoyée' : 'No notifications sent'} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {sentNotifs.map((n: any) => (
                <motion.div key={n.id} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    n.is_read ? 'bg-primary/10' : 'bg-muted')}>
                    {n.is_read ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="text-[10px]">{n.notification_type || 'system'}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalSent}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Total envoyées' : 'Total sent'}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{readCount}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Lues' : 'Read'}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{readRate}%</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Taux de lecture' : 'Read rate'}</p>
            </div>
          </div>

          {/* Type breakdown */}
          {typeBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm">{locale === 'fr' ? 'Par type' : 'By type'}</h3>
              {typeBreakdown.map(([type, count]) => {
                const pct = totalSent > 0 ? Math.round((count / totalSent) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{type}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}