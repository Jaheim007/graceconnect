import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Calendar, MapPin, Ticket, Users, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

export default function ChurchEventRegisterPage() {
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>();
  const { user } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const { data, isLoading } = useQuery({
    enabled: !!slug && !!eventId,
    queryKey: ['church-event-public', slug, eventId],
    queryFn: async () => {
      const { data: church } = await supabase
        .from('church_providers')
        .select('id, slug, name, logo_url')
        .eq('slug', slug!)
        .maybeSingle();
      if (!church) return null;
      const { data: event } = await supabase
        .from('church_events')
        .select('*')
        .eq('id', eventId!)
        .eq('church_id', church.id)
        .eq('status', 'published')
        .maybeSingle();
      return { church, event };
    },
  });

  useEffect(() => {
    if (data?.event) document.title = `${data.event.title} — ${data.church.name}`;
  }, [data]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user, email]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data?.church) return <Navigate to="/church/discover" replace />;
  if (!data.event) return <Navigate to={`/church/${slug}`} replace />;

  const { church, event } = data;
  const priceCents = event.price_cents ?? 0;
  const paid = priceCents > 0;
  const soldOut = event.capacity && (event.tickets_sold ?? 0) >= event.capacity;
  const total = priceCents * qty / 100;

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error(fr ? 'Nom requis' : 'Name required');
    if (paid && !email.trim()) return toast.error(fr ? 'Email requis pour paiement' : 'Email required for payment');
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('church-buy-event-ticket', {
        body: {
          event_id: event.id,
          buyer_name: name.trim(),
          buyer_email: email.trim() || undefined,
          buyer_phone: phone.trim() || undefined,
          buyer_user_id: user?.id ?? null,
          qty,
          return_origin: window.location.origin,
        },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      if (paid && (res as any)?.checkout_url) {
        window.location.href = (res as any).checkout_url;
        return;
      }
      setTicket((res as any).ticket);
    } catch (err: any) {
      toast.error(err?.message || (fr ? 'Erreur' : 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (ticket) {
    return <TicketConfirmation ticket={ticket} event={event} church={church} paid={paid} />;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to={`/church/${slug}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <p className="text-xs text-muted-foreground">{church.name}</p>
            <h1 className="text-xl font-bold">{event.title}</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <div className="text-xs text-muted-foreground uppercase">{new Date(event.starts_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { month: 'short' })}</div>
              <div className="text-3xl font-bold">{new Date(event.starts_at).getDate()}</div>
              <div className="text-xs">{new Date(event.starts_at).toLocaleTimeString(fr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {event.location && <p className="text-sm flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {event.location}</p>}
              <p className="text-sm flex items-center gap-1"><Ticket className="h-3.5 w-3.5 text-primary" /> {paid ? `${(priceCents/100).toFixed(0)} ${event.currency}` : (fr ? 'Entrée gratuite' : 'Free entry')}</p>
              {event.capacity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {(event.capacity - (event.tickets_sold ?? 0))} {fr ? 'places restantes' : 'seats left'}</p>
              )}
            </div>
          </div>
          {event.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>}
        </div>

        {soldOut ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 text-center">
            <p className="font-semibold text-amber-900 dark:text-amber-100">{fr ? 'Complet' : 'Sold out'}</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">{fr ? 'Toutes les places sont réservées.' : 'All seats are booked.'}</p>
          </div>
        ) : (
          <form onSubmit={register} className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="font-semibold">{fr ? 'Réserver ma place' : 'Reserve my seat'}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Votre nom' : 'Your name'} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{fr ? 'Téléphone' : 'Phone'}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email {paid && '*'}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required={paid} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Nombre de places' : 'Number of seats'}</Label>
              <Input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} />
            </div>
            {paid && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
                <p className="font-medium">{fr ? 'Paiement sécurisé' : 'Secure payment'}</p>
                <p className="mt-0.5 text-muted-foreground">{fr ? `Total : ${total.toFixed(0)} ${event.currency}. Vous serez redirigé vers la page de paiement.` : `Total: ${total.toFixed(0)} ${event.currency}. You'll be redirected to the payment page.`}</p>
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              <Ticket className="mr-2 h-4 w-4" />
              {submitting ? '...' : (fr ? 'Confirmer ma réservation' : 'Confirm my registration')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function TicketConfirmation({ ticket, event, church, paid }: any) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full rounded-3xl border-2 border-primary/30 bg-card p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{fr ? 'Réservation confirmée' : 'Registration confirmed'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{event.title}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1 text-left">
          <p><span className="text-muted-foreground">{fr ? 'Nom :' : 'Name:'}</span> <span className="font-medium">{ticket.buyer_name}</span></p>
          <p><span className="text-muted-foreground">{fr ? 'Places :' : 'Seats:'}</span> <span className="font-medium">{ticket.qty}</span></p>
          <p><span className="text-muted-foreground">{fr ? 'Date :' : 'Date:'}</span> <span className="font-medium">{new Date(event.starts_at).toLocaleString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span></p>
          {event.location && <p><span className="text-muted-foreground">{fr ? 'Lieu :' : 'Location:'}</span> <span className="font-medium">{event.location}</span></p>}
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{fr ? 'Code du billet' : 'Ticket code'}</p>
          <p className="font-mono font-bold text-lg select-all">{ticket.ticket_code.slice(0, 8).toUpperCase()}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => { navigator.clipboard.writeText(ticket.ticket_code); toast.success(fr ? 'Copié' : 'Copied'); }}>
            <Copy className="mr-1.5 h-3 w-3" /> {fr ? 'Copier le code complet' : 'Copy full code'}
          </Button>
        </div>
        {paid && (
          <p className="text-xs text-amber-700 dark:text-amber-400">{fr ? 'Paiement à effectuer à l\'entrée le jour de l\'événement.' : 'Payment due at entry on the day of the event.'}</p>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link to={`/church/${church.slug}`}>{fr ? 'Retour à l\'église' : 'Back to church'}</Link>
        </Button>
      </div>
    </div>
  );
}
