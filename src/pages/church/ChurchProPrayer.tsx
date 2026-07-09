import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Heart, Check, Archive, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

const STATUSES = ['new', 'praying', 'answered', 'archived'] as const;
type Status = typeof STATUSES[number];

export default function ChurchProPrayer() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();

  useEffect(() => { document.title = fr ? 'Boîte de prière — SiteViral Church' : 'Prayer inbox — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-prayer', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, name').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: requests = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-prayer-requests', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_prayer_requests')
        .select('*')
        .eq('church_id', church!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from('church_prayer_requests').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['church-prayer-requests', church?.id] });
  };

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/prayer" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  const counts: Record<Status, number> = { new: 0, praying: 0, answered: 0, archived: 0 };
  for (const r of requests) counts[(r.status as Status) || 'new']++;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> {fr ? 'Boîte de prière' : 'Prayer inbox'}</h1>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-xl border border-border bg-card p-3">
              <p className="text-lg font-bold">{counts[s]}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label(s, fr)}</p>
            </div>
          ))}
        </div>

        {isLoading ? <Spin /> : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Heart className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucune demande pour le moment' : 'No requests yet'}</p>
            <p className="text-xs text-muted-foreground mt-1">{fr ? 'Les demandes soumises depuis votre page apparaîtront ici.' : 'Requests submitted from your page will appear here.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const status = (r.status as Status) || 'new';
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{r.requester_name || (fr ? 'Anonyme' : 'Anonymous')}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(fr ? 'fr-FR' : 'en-US')}
                        {r.is_private && ` · ${fr ? 'Privé' : 'Private'}`}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 ${badgeCls(status)}`}>{label(status, fr)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.message}</p>
                  {r.requester_contact && (
                    <p className="text-xs text-muted-foreground">{fr ? 'Contact' : 'Contact'}: {r.requester_contact}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {status !== 'praying' && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'praying')}><Sparkles className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'En prière' : 'Praying'}</Button>}
                    {status !== 'answered' && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'answered')}><Check className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Exaucée' : 'Answered'}</Button>}
                    {status !== 'archived' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'archived')}><Archive className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Archiver' : 'Archive'}</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function label(s: Status, fr: boolean) {
  const map: Record<Status, [string, string]> = {
    new: ['Nouvelles', 'New'],
    praying: ['En prière', 'Praying'],
    answered: ['Exaucées', 'Answered'],
    archived: ['Archivées', 'Archived'],
  };
  return fr ? map[s][0] : map[s][1];
}

function badgeCls(s: Status) {
  switch (s) {
    case 'new': return 'bg-primary/15 text-primary';
    case 'praying': return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'answered': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    default: return 'bg-muted text-muted-foreground';
  }
}
