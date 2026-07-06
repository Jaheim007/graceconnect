import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Church, HandHeart, MapPin, Mic, Calendar, Heart, ShieldCheck, Loader2, Globe, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { getDenominationLabel } from '@/lib/churchDenominations';
import { toast } from 'sonner';

export default function ChurchPublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const { data: church, isLoading } = useQuery({
    enabled: !!slug,
    queryKey: ['church-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('church_providers')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isOwner = !!(user && church && church.user_id === user.id);
  const isOwnerPreview = isOwner && !church?.payout_verified;

  const { data: sermons = [] } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-public-sermons', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_sermons')
        .select('id, title, description, cover_url, duration_s, published_at, preacher, is_free, price, currency')
        .eq('church_id', church!.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  const { data: events = [] } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-public-events', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_events')
        .select('id, title, starts_at, location, stream_url')
        .eq('church_id', church!.id)
        .eq('status', 'published')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (church) document.title = `${church.name} — SiteViral Church`;
  }, [church]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!church) return <Navigate to="/church/discover" replace />;
  // Only suspended churches are hidden from non-owners; pending/active are public.
  if (church.status === 'suspended' && !isOwner) return <Navigate to="/church/discover" replace />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {isOwnerPreview && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
          {fr ? 'Aperçu privé — visible seulement par vous jusqu\'à la validation du KYC.' : 'Private preview — only visible to you until KYC is approved.'}{' '}
          <Link to="/church/pro/kyc" className="underline font-medium">{fr ? 'Compléter le KYC' : 'Complete KYC'}</Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative">
        <div className="h-40 md:h-56 bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
          {church.cover_url && <img src={church.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="mx-auto max-w-4xl px-4 -mt-12 relative">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-2xl border-4 border-background bg-muted shrink-0 overflow-hidden">
              {church.logo_url ? (
                <img src={church.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Church className="h-9 w-9 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{church.name}</h1>
                {church.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> {fr ? 'Vérifiée' : 'Verified'}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getDenominationLabel(church.denomination, locale)}
                {(church.city || church.country) && ` · ${[church.city, church.country].filter(Boolean).join(', ')}`}
              </p>
            </div>
          </div>
          {church.bio && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{church.bio}</p>}
        </div>
      </section>

      {/* Give CTA */}
      <section className="mx-auto max-w-4xl px-4 mt-6">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <HandHeart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{fr ? 'Soutenez notre église' : 'Support our church'}</p>
              <p className="text-xs text-muted-foreground">{fr ? 'Dîmes, offrandes, campagnes · Mobile Money & Carte' : 'Tithes, offerings, campaigns · Mobile Money & Card'}</p>
            </div>
          </div>
          <Button size="lg" disabled={isOwnerPreview}>
            <HandHeart className="mr-2 h-4 w-4" />
            {fr ? 'Faire un don' : 'Give'}
          </Button>
        </div>
        {isOwnerPreview && (
          <p className="text-xs text-muted-foreground mt-2 text-center">{fr ? 'Le module de don sera actif après validation du KYC.' : 'The giving module activates after KYC approval.'}</p>
        )}
      </section>

      {/* Sermons */}
      <section className="mx-auto max-w-4xl px-4 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Mic className="h-4 w-4 text-primary" /> {fr ? 'Prédications' : 'Sermons'}</h2>
        </div>
        {sermons.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-6 text-center">
            {fr ? 'Aucune prédication publiée pour le moment.' : 'No sermons published yet.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {sermons.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="h-24 bg-muted">{s.cover_url && <img src={s.cover_url} alt="" className="w-full h-full object-cover" />}</div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{s.title}</h3>
                  {s.preacher && <p className="text-xs text-muted-foreground mt-1">{s.preacher}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 mt-10">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Calendar className="h-4 w-4 text-primary" /> {fr ? 'À venir' : 'Upcoming'}</h2>
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
                <div className="text-center shrink-0 min-w-[3.5rem]">
                  <div className="text-xs text-muted-foreground uppercase">{new Date(e.starts_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { month: 'short' })}</div>
                  <div className="text-2xl font-bold">{new Date(e.starts_at).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{e.title}</p>
                  {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {e.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prayer request */}
      <section className="mx-auto max-w-4xl px-4 mt-10">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Heart className="h-4 w-4 text-primary" /> {fr ? 'Demande de prière' : 'Prayer request'}</h2>
        <PrayerRequestForm churchId={church.id} disabled={isOwnerPreview} />
      </section>

      {/* Contact */}
      {(church.phone || church.email || church.website) && (
        <section className="mx-auto max-w-4xl px-4 mt-10">
          <h2 className="text-lg font-semibold mb-4">{fr ? 'Contact' : 'Contact'}</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
            {church.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {church.address}</p>}
            {church.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {church.phone}</p>}
            {church.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {church.email}</p>}
            {church.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={church.website} target="_blank" rel="noopener" className="text-primary underline">{church.website}</a></p>}
          </div>
        </section>
      )}
    </div>
  );
}

function PrayerRequestForm({ churchId, disabled }: { churchId: string; disabled?: boolean }) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('church_prayer_requests').insert({
      church_id: churchId,
      requester_name: name.trim() || null,
      message: message.trim(),
      is_private: true,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setDone(true);
    setMessage('');
    setName('');
    toast.success(fr ? 'Merci, votre demande a été transmise au pasteur.' : 'Thank you, your request was sent to the pastor.');
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center">
        <Heart className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {fr ? 'Votre demande a été reçue. Nous prions avec vous.' : 'Your request was received. We pray with you.'}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setDone(false)} className="mt-2">
          {fr ? 'Envoyer une autre demande' : 'Send another request'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="prayer-name" className="text-xs">{fr ? 'Votre prénom (optionnel)' : 'Your first name (optional)'}</Label>
        <Input id="prayer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={fr ? 'Anonyme' : 'Anonymous'} disabled={disabled} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="prayer-msg" className="text-xs">{fr ? 'Votre requête' : 'Your request'}</Label>
        <Textarea id="prayer-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required disabled={disabled}
          placeholder={fr ? 'Partagez votre requête, elle restera privée entre vous et le pasteur.' : 'Share your request; it stays private between you and the pastor.'} />
      </div>
      <Button type="submit" disabled={submitting || disabled} className="w-full">
        <Heart className="mr-2 h-4 w-4" />
        {submitting ? '...' : (fr ? 'Envoyer ma demande' : 'Send my request')}
      </Button>
    </form>
  );
}
