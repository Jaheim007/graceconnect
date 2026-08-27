import { useEffect, useState } from 'react';
import { Link, Navigate } from '@/lib/router-compat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CalendarClock, Phone, Mail, Check, X, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

type Appointment = {
  id: string;
  requester_name: string;
  requester_phone: string | null;
  requester_email: string | null;
  subject: string;
  message: string | null;
  requested_at: string;
  duration_min: number;
  status: string;
  staff_note: string | null;
  created_at: string;
};

const STATUS_TABS = ['new', 'confirmed', 'declined', 'done'] as const;

export default function ChurchProAppointments() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>('new');
  const [editing, setEditing] = useState<Appointment | null>(null);

  useEffect(() => { document.title = fr ? 'Rendez-vous — SiteViral Church' : 'Appointments — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-appt', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: appts = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-appointments', church?.id, tab],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_appointments')
        .select('*')
        .eq('church_id', church!.id)
        .eq('status', tab)
        .order('requested_at', { ascending: tab === 'new' })
        .limit(200);
      return (data ?? []) as Appointment[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['church-appointments', church?.id] });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('church_appointments').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Statut mis à jour' : 'Status updated');
    invalidate();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/appointments" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> {fr ? 'Rendez-vous pastoraux' : 'Pastoral appointments'}</h1>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {fr ? { new: 'Nouveaux', confirmed: 'Confirmés', declined: 'Refusés', done: 'Terminés' }[s] : { new: 'New', confirmed: 'Confirmed', declined: 'Declined', done: 'Done' }[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : appts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <CalendarClock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucune demande' : 'No requests'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fr ? 'Les fidèles peuvent demander un rendez-vous depuis la page publique de votre église.' : 'Members can request an appointment from your public church page.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appts.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.requester_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                      {a.requester_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.requester_phone}</span>}
                      {a.requester_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.requester_email}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{new Date(a.requested_at).toLocaleString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> {a.duration_min} min</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{a.subject}</p>
                {a.message && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>}
                {a.staff_note && (
                  <div className="rounded-lg bg-muted/50 p-2 text-xs">
                    <p className="font-medium text-muted-foreground mb-0.5">{fr ? 'Note interne' : 'Internal note'}</p>
                    <p className="whitespace-pre-wrap">{a.staff_note}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-1 flex-wrap">
                  {tab === 'new' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(a.id, 'confirmed')}><Check className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Confirmer' : 'Confirm'}</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'declined')}><X className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Refuser' : 'Decline'}</Button>
                    </>
                  )}
                  {tab === 'confirmed' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'done')}><Check className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Marquer terminé' : 'Mark done'}</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Note' : 'Note'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NoteDialog appt={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
    </div>
  );
}

function NoteDialog({ appt, onClose, onSaved }: { appt: Appointment | null; onClose: () => void; onSaved: () => void }) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [note, setNote] = useState('');
  useEffect(() => { setNote(appt?.staff_note ?? ''); }, [appt]);

  const save = async () => {
    if (!appt) return;
    const { error } = await supabase.from('church_appointments').update({ staff_note: note.trim() || null }).eq('id', appt.id);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Note enregistrée' : 'Note saved');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{fr ? 'Note interne' : 'Internal note'}</DialogTitle></DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">{fr ? 'Note (visible uniquement par vous)' : 'Note (visible only to you)'}</Label>
          <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{fr ? 'Annuler' : 'Cancel'}</Button>
          <Button onClick={save}>{fr ? 'Enregistrer' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
