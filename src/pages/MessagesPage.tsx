import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Send, Pin, Trash2, MessageCircle, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MessagesPage() {
  const { user } = useAuth();
  const { currentOrg, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const orgId = selectedOrgId || userOrgs[0]?.id;

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['org-messages', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('org_messages')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!data?.length) return [];
      // Resolve profiles
      const uids = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await db.from('profiles').select('id, display_name, avatar_url').in('id', uids);
      const pm: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { pm[p.id] = p; });
      return data.map((m: any) => ({ ...m, profile: pm[m.sender_id] }));
    },
    enabled: !!orgId,
    refetchInterval: 5000, // Poll every 5s for "real-time" feel
  });

  // Send message
  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      if (!orgId || !user) throw new Error('Not ready');
      const { error } = await db.from('org_messages').insert({
        organization_id: orgId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg('');
      qc.invalidateQueries({ queryKey: ['org-messages', orgId] });
    },
  });

  // Delete message
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await db.from('org_messages').delete().eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-messages', orgId] }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMut.mutate(msg.trim());
  };

  const pinnedMessages = messages.filter((m: any) => m.is_pinned);

  return (
    <>
      <SEOHead title={locale === 'fr' ? 'Messages' : 'Messages'} description="Internal messaging" />
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        {/* Org selector */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">{locale === 'fr' ? 'Messages' : 'Messages'}</h1>
          <div className="flex gap-1 ml-auto overflow-x-auto">
            {userOrgs.map((o) => (
              <Button
                key={o.id}
                variant={orgId === o.id ? 'default' : 'ghost'}
                size="sm"
                className="text-xs h-7 shrink-0"
                onClick={() => setSelectedOrgId(o.id)}
              >
                <Hash className="h-3 w-3 mr-1" />{o.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Pinned messages */}
        {pinnedMessages.length > 0 && (
          <div className="px-3 py-2 bg-primary/5 border-b border-border space-y-1">
            {pinnedMessages.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <Pin className="h-3 w-3 text-primary shrink-0" />
                <span className="font-medium">{m.profile?.display_name || 'User'}:</span>
                <span className="text-muted-foreground truncate">{m.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!orgId ? (
            <EmptyState title={locale === 'fr' ? 'Rejoignez une organisation' : 'Join an organization'} description={locale === 'fr' ? 'Vous devez être membre d\'une organisation pour accéder aux messages.' : 'You must be a member of an organization to access messages.'} />
          ) : messages.length === 0 && !isLoading ? (
            <EmptyState title={locale === 'fr' ? 'Aucun message' : 'No messages yet'} description={locale === 'fr' ? 'Soyez le premier à écrire !' : 'Be the first to write!'} />
          ) : (
            <AnimatePresence>
              {messages.map((m: any) => {
                const isOwn = m.sender_id === user?.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold">{(m.profile?.display_name || '?')[0]}</span>
                      )}
                    </div>
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium">{m.profile?.display_name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), 'HH:mm')}</span>
                        {m.is_pinned && <Pin className="h-2.5 w-2.5 text-primary" />}
                      </div>
                      <div className={`rounded-2xl px-3 py-2 text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {m.content}
                      </div>
                      {isOwn && (
                        <button onClick={() => deleteMut.mutate(m.id)} className="text-[10px] text-muted-foreground hover:text-destructive mt-0.5">
                          <Trash2 className="h-3 w-3 inline" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {orgId && (
          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder={locale === 'fr' ? 'Écrire un message...' : 'Write a message...'}
                className="flex-1"
                disabled={sendMut.isPending}
              />
              <Button type="submit" size="icon" disabled={!msg.trim() || sendMut.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
