import { useEffect, useState } from 'react';
import { Link, Navigate } from '@/lib/router-compat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Calendar, Plus, MapPin, Video, Trash2, Eye, EyeOff, Ticket, Users, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';
import { askConfirm } from '@/components/ui/confirm-dialog';

export default function ChurchProEvents() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [attendeesFor, setAttendeesFor] = useState<any | null>(null);

  useEffect(() => { document.title = fr ? 'Événements & billets — SiteViral Church' : 'Events & tickets — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-ev', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, slug').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: events = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-events-mgr', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_events')
        .select('*')
        .eq('church_id', church!.id)
        .order('starts_at', { ascending: false });
      return data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['church-events-mgr', church?.id] });

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/events" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {fr ? 'Événements & billets' : 'Events & tickets'}</h1>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Nouveau' : 'New'}</Button>
        </div>

        {isLoading ? <Spin /> : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucun événement' : 'No events'}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{fr ? 'Cultes, veillées, conférences, retraites — gratuits ou avec billets.' : 'Services, vigils, conferences, retreats — free or ticketed.'}</p>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Créer un événement' : 'Create event'}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e: any) => {
              const past = new Date(e.starts_at).getTime() < Date.now();
              const paid = (e.price_cents ?? 0) > 0;
              const publicUrl = `${window.location.origin}/church/${church.slug}/events/${e.id}`;
              return (
                <div key={e.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
                  <div className="text-center shrink-0 min-w-[3.5rem]">
                    <div className="text-xs text-muted-foreground uppercase">{new Date(e.starts_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { month: 'short' })}</div>
                    <div className="text-2xl font-bold">{new Date(e.starts_at).getDate()}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(e.starts_at).toLocaleTimeString(fr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{e.title}</p>
                      <span className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${e.status === 'published' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {e.status === 'published' ? (fr ? 'Publié' : 'Published') : (fr ? 'Brouillon' : 'Draft')}
                      </span>
                      {e.require_ticket && (
                        <span className="text-[10px] uppercase rounded-full bg-primary/15 text-primary px-2 py-0.5 inline-flex items-center gap-1">
                          <Ticket className="h-3 w-3" /> {paid ? `${(e.price_cents/100).toFixed(0)} ${e.currency || 'XAF'}` : (fr ? 'Gratuit' : 'Free')}
                        </span>
                      )}
                      {e.capacity && (
                        <span className="text-[10px] uppercase rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                          {e.tickets_sold || 0}/{e.capacity}
                        </span>
                      )}
                      {past && <span className="text-[10px] uppercase rounded-full bg-muted text-muted-foreground px-2 py-0.5">{fr ? 'Passé' : 'Past'}</span>}
                    </div>
                    {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</p>}
                    {e.stream_url && <p className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" /> <a href={e.stream_url} target="_blank" rel="noopener" className="text-primary underline truncate">{e.stream_url}</a></p>}
                    {e.description && <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {e.require_ticket && (
                        <Button size="sm" variant="outline" onClick={() => setAttendeesFor(e)}>
                          <Users className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Participants' : 'Attendees'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success(fr ? 'Lien copié' : 'Link copied'); }}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Copier le lien' : 'Copy link'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const next = e.status === 'published' ? 'draft' : 'published';
                        await supabase.from('church_events').update({ status: next }).eq('id', e.id);
                        invalidate();
                      }}>
                        {e.status === 'published' ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Dépublier' : 'Unpublish'}</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Publier' : 'Publish'}</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!(await askConfirm(fr ? 'Supprimer cet événement ?' : 'Delete this event?'))) return;
                        await supabase.from('church_events').delete().eq('id', e.id);
                        invalidate();
                      }}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewEventDialog
        open={open}
        onOpenChange={setOpen}
        churchId={church.id}
        onCreated={() => { invalidate(); setOpen(false); }}
      />
      <AttendeesDialog event={attendeesFor} onClose={() => setAttendeesFor(null)} />
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function NewEventDialog({ open, onOpenChange, churchId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; churchId: string; onCreated: () => void;
}) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [requireTicket, setRequireTicket] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (asPublished: boolean) => {
    if (!title.trim() || !startsAt) return;
    setSaving(true);
    const priceNum = requireTicket && price ? Math.round(parseFloat(price) * 100) : 0;
    const capNum = capacity ? parseInt(capacity, 10) : null;
    const { error } = await supabase.from('church_events').insert({
      church_id: churchId,
      title: title.trim(),
      description: description.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      location: location.trim() || null,
      stream_url: streamUrl.trim() || null,
      status: asPublished ? 'published' : 'draft',
      require_ticket: requireTicket,
      price_cents: priceNum,
      currency,
      capacity: capNum,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(asPublished ? (fr ? 'Événement publié' : 'Event published') : (fr ? 'Brouillon enregistré' : 'Draft saved'));
    setTitle(''); setDescription(''); setStartsAt(''); setEndsAt(''); setLocation(''); setStreamUrl('');
    setRequireTicket(false); setPrice(''); setCurrency('XAF'); setCapacity('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fr ? 'Nouvel événement' : 'New event'}</DialogTitle>
          <DialogDescription>{fr ? 'Culte, veillée, retraite, conférence…' : 'Service, vigil, retreat, conference…'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Titre' : 'Title'} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Début' : 'Starts'} *</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Fin (optionnel)' : 'Ends (optional)'}</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Lieu' : 'Location'}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={fr ? 'Ex: Église centrale' : 'e.g. Main sanctuary'} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Lien de diffusion (YouTube, Zoom…)' : 'Live stream link (YouTube, Zoom…)'}</Label>
            <Input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Description' : 'Description'}</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5"><Ticket className="h-4 w-4 text-primary" /> {fr ? 'Inscription avec billet' : 'Ticket registration'}</p>
                <p className="text-[11px] text-muted-foreground">{fr ? 'Les participants doivent réserver leur place' : 'Attendees must reserve a seat'}</p>
              </div>
              <Switch checked={requireTicket} onCheckedChange={setRequireTicket} />
            </div>
            {requireTicket && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs">{fr ? 'Prix' : 'Price'}</Label>
                  <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs">{fr ? 'Devise' : 'Currency'}</Label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 border border-input bg-background rounded-md px-2 text-sm">
                    <option value="XAF">XAF</option>
                    <option value="XOF">XOF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs">{fr ? 'Capacité' : 'Capacity'}</Label>
                  <Input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="∞" />
                </div>
                {parseFloat(price || '0') === 0 && (
                  <p className="col-span-3 text-[11px] text-muted-foreground">{fr ? 'Prix à 0 = inscription gratuite avec billet' : 'Price 0 = free registration with ticket'}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => submit(false)} disabled={saving || !title.trim() || !startsAt}>
            {fr ? 'Enregistrer' : 'Save draft'}
          </Button>
          <Button onClick={() => submit(true)} disabled={saving || !title.trim() || !startsAt}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Publier' : 'Publish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttendeesDialog({ event, onClose }: { event: any | null; onClose: () => void }) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { data: tickets = [], isLoading } = useQuery({
    enabled: !!event?.id,
    queryKey: ['church-event-tickets', event?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_event_tickets')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {event?.title}</DialogTitle>
          <DialogDescription>{fr ? `${tickets.length} inscription(s)` : `${tickets.length} registration(s)`}</DialogDescription>
        </DialogHeader>
        {isLoading ? <Spin /> : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{fr ? 'Aucune inscription pour le moment.' : 'No registrations yet.'}</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t: any) => (
              <div key={t.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium">{t.buyer_name} {t.qty > 1 && <span className="text-xs text-muted-foreground">×{t.qty}</span>}</p>
                  <span className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${t.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : t.status === 'pending' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[t.buyer_email, t.buyer_phone].filter(Boolean).join(' · ')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  #{t.ticket_code.slice(0, 8)} · {new Date(t.created_at).toLocaleString(fr ? 'fr-FR' : 'en-US')}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
