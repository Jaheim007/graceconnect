import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  HelpCircle, MessageCircle, Clock, Send, XCircle,
  User, ArrowLeft, Loader2, MailCheck, RefreshCw, Mail, Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/15 text-amber-600',
  closed: 'bg-muted text-muted-foreground',
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function SuperadminSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['sa-support-tickets', filter],
    queryFn: async () => {
      let q = db.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q;
      return data || [];
    },
  });

  // Fetch user profiles for display names
  const { data: profiles = {} } = useQuery({
    queryKey: ['sa-ticket-profiles', tickets.map((t: any) => t.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(tickets.map((t: any) => t.user_id))];
      if (!userIds.length) return {};
      const { data } = await db.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.id] = p; });
      return map;
    },
    enabled: tickets.length > 0,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ ticketId, newStatus }: { ticketId: string; newStatus: string }) => {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (response.trim()) {
        updates.admin_response = response.trim();
        updates.responded_by = user?.id;
        updates.responded_at = new Date().toISOString();
      }
      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
        updates.closed_by = user?.id;
      }
      const { error } = await db.from('support_tickets').update(updates).eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Ticket mis à jour' });
      setResponse('');
      setSelectedTicket(null);
      qc.invalidateQueries({ queryKey: ['sa-support-tickets'] });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const openCount = tickets.filter((t: any) => t.status === 'open').length;

  // Get screenshot URLs from ticket (support both old single and new array format)
  const getScreenshotUrls = (ticket: any): string[] => {
    if (ticket.screenshot_urls?.length) return ticket.screenshot_urls;
    if (ticket.screenshot_url) return [ticket.screenshot_url];
    return [];
  };

  if (selectedTicket) {
    const profile = profiles[selectedTicket.user_id];
    const screenshotUrls = getScreenshotUrls(selectedTicket);
    const userName = (selectedTicket as any).user_name || profile?.display_name || 'Utilisateur';
    const userEmail = (selectedTicket as any).user_email || '';

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
        <button onClick={() => { setSelectedTicket(null); setResponse(''); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux tickets
        </button>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {selectedTicket.ticket_number && (
                    <Badge variant="outline" className="text-[10px] font-mono">{selectedTicket.ticket_number}</Badge>
                  )}
                  <Badge className={cn('text-[10px] border-0 capitalize', STATUS_COLORS[selectedTicket.status] || STATUS_COLORS.open)}>
                    {selectedTicket.status === 'closed' ? 'Fermé' : 'Ouvert'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{selectedTicket.category}</Badge>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(selectedTicket.created_at), 'dd MMM yyyy HH:mm')}
              </p>
            </div>

            {/* User details card */}
            <div className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{userName}</p>
                {userEmail && (
                  <a href={`mailto:${userEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {userEmail}
                  </a>
                )}
              </div>
              {userEmail && (
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
                  <a href={`mailto:${userEmail}?subject=Re: ${selectedTicket.subject} (${selectedTicket.ticket_number || ''})`}>
                    <Mail className="h-3.5 w-3.5" /> Envoyer un email
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-4">
            <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
          </div>

          {/* Screenshots */}
          {screenshotUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Captures d'écran ({screenshotUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {screenshotUrls.map((url: string, i: number) => (
                  <TicketScreenshot
                    key={i}
                    storedUrl={url}
                    alt={`Screenshot ${i + 1}`}
                    onClick={(signed) => setPreviewImage(signed)}
                    className="max-h-40 rounded-xl border border-border object-cover hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </div>
            </div>
          )}

          {selectedTicket.admin_response && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                <MailCheck className="h-3 w-3" /> Réponse admin
              </p>
              <p className="text-sm whitespace-pre-wrap">{selectedTicket.admin_response}</p>
              {selectedTicket.responded_at && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(selectedTicket.responded_at), 'dd MMM yyyy HH:mm')}
                </p>
              )}
            </div>
          )}

          {selectedTicket.status !== 'closed' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Votre réponse (optionnel)</label>
                <Textarea value={response} onChange={e => setResponse(e.target.value)}
                  placeholder="Tapez votre réponse au ticket..." rows={4} className="text-sm" />
              </div>

              <div className="flex flex-wrap gap-2">
                {response.trim() && (
                  <Button size="sm" className="gap-1.5"
                    disabled={respondMutation.isPending}
                    onClick={() => respondMutation.mutate({ ticketId: selectedTicket.id, newStatus: 'open' })}>
                    {respondMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Répondre
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5"
                  disabled={respondMutation.isPending}
                  onClick={() => respondMutation.mutate({ ticketId: selectedTicket.id, newStatus: 'closed' })}>
                  <XCircle className="h-4 w-4" /> Fermer le ticket
                </Button>
              </div>
            </>
          )}

          {selectedTicket.status === 'closed' && (
            <p className="text-xs text-muted-foreground italic">
              Ce ticket a été fermé{selectedTicket.closed_at ? ` le ${format(new Date(selectedTicket.closed_at), 'dd MMM yyyy HH:mm', { locale: fr })}` : ''}.
            </p>
          )}
        </div>

        {/* Image preview dialog */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-2">
            {previewImage && <img src={previewImage} alt="Preview" className="w-full rounded-lg" />}
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Support & Tickets
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {openCount} ouvert(s) · {tickets.length} total
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(['all', 'open', 'closed'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)} className="text-xs capitalize">
            {f === 'all' ? 'Tous' : f === 'open' ? `Ouverts (${openCount})` : 'Fermés'}
          </Button>
        ))}
      </motion.div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-10 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun ticket {filter !== 'all' ? `avec le statut "${filter}"` : ''}</p>
        </motion.div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2">
            {tickets.map((t: any) => {
              const profile = profiles[t.user_id];
              const userName = t.user_name || profile?.display_name || 'Utilisateur';
              const userEmail = t.user_email || '';
              const screenshotCount = (t.screenshot_urls?.length || (t.screenshot_url ? 1 : 0));
              return (
                <motion.div key={t.id} variants={fadeUp}
                  onClick={() => setSelectedTicket(t)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                    t.status === 'open' ? 'bg-amber-500' : 'bg-muted-foreground/40'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{t.subject}</p>
                      {t.ticket_number && <Badge variant="outline" className="text-[9px] font-mono shrink-0">{t.ticket_number}</Badge>}
                      {screenshotCount > 0 && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                          <ImageIcon className="h-3 w-3" /> {screenshotCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {userName}</span>
                      {userEmail && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {userEmail}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(t.created_at), 'dd MMM HH:mm', { locale: fr })}</span>
                      <span>·</span>
                      <span className="capitalize">{t.category}</span>
                    </p>
                  </div>
                  <Badge className={cn('text-[10px] border-0 capitalize shrink-0', STATUS_COLORS[t.status] || STATUS_COLORS.open)}>
                    {t.status === 'closed' ? 'Fermé' : 'Ouvert'}
                  </Badge>
                  {t.admin_response && <MailCheck className="h-4 w-4 text-primary/60 shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
