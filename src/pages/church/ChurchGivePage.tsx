import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Church, HandHeart, Loader2, Info, ShieldCheck, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

const PRESETS: Record<string, number[]> = {
  XOF: [1000, 5000, 10000, 25000, 50000],
  XAF: [1000, 5000, 10000, 25000, 50000],
  EUR: [5, 10, 25, 50, 100],
  USD: [5, 10, 25, 50, 100],
};

type Type = 'tithe' | 'offering' | 'donation';

export default function ChurchGivePage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [params] = useSearchParams();
  const campaignId = params.get('campaign');
  const preselectType = (params.get('type') as Type | null) || 'offering';

  const [type, setType] = useState<Type>(preselectType);
  const [currency, setCurrency] = useState<'XOF' | 'XAF' | 'EUR' | 'USD'>('XOF');
  const [amount, setAmount] = useState<number>(currency === 'XOF' ? 5000 : 10);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: church, isLoading } = useQuery({
    enabled: !!slug,
    queryKey: ['church-give', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_providers')
        .select('id, slug, name, logo_url, cover_url, currency, status, city, country, denomination, bio')
        .eq('slug', slug!)
        .maybeSingle();
      return data;
    },
  });

  const { data: campaign } = useQuery({
    enabled: !!campaignId,
    queryKey: ['church-campaign-give', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('church_campaigns').select('id, title, description, currency, goal_amount, raised_amount').eq('id', campaignId!).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (church?.currency && ['XOF', 'XAF', 'EUR', 'USD'].includes(church.currency)) {
      setCurrency(church.currency as any);
      setAmount(PRESETS[church.currency][1] || 5000);
    }
    if (church) document.title = `${fr ? 'Faire un don' : 'Give'} · ${church.name}`;
  }, [church, fr]);

  useEffect(() => {
    if (campaign) setType('donation');
  }, [campaign]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!church) return <Navigate to="/church/discover" replace />;
  if (church.status === 'suspended') return <Navigate to="/church/discover" replace />;

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const canSubmit = finalAmount > 0 && (email.trim() || phone.trim()) && !submitting;
  const useStripe = currency === 'EUR' || currency === 'USD';

  const submit = async () => {
    if (!canSubmit) return;
    if (useStripe && !email.trim()) {
      toast.error(fr ? 'Email requis pour paiement carte' : 'Email required for card payments');
      return;
    }
    setSubmitting(true);
    try {
      const fnName = useStripe ? 'church-init-giving-stripe' : 'church-init-giving';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          church_slug: church.slug,
          giving_type: campaign ? 'campaign' : type,
          campaign_id: campaign?.id || null,
          amount: finalAmount,
          currency,
          donor_name: anon ? null : name.trim() || null,
          donor_email: email.trim() || null,
          donor_phone: phone.trim() || null,
          message: message.trim() || null,
          is_anonymous: anon,
          return_origin: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      const url = (data as any)?.checkout_url;
      if (!url) throw new Error((data as any)?.error || (fr ? 'Erreur de paiement' : 'Payment error'));
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || (fr ? 'Erreur' : 'Error'));
      setSubmitting(false);
    }
  };

  const typeLabel = (t: Type) =>
    t === 'tithe' ? (fr ? 'Dîme' : 'Tithe') : t === 'offering' ? (fr ? 'Offrande' : 'Offering') : (fr ? 'Don' : 'Donation');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero banner */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-muted">
        {church.cover_url ? (
          <img src={church.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild className="backdrop-blur bg-background/70 hover:bg-background/90">
            <Link to={`/church/${church.slug}`}><ArrowLeft className="mr-1 h-4 w-4" /> {fr ? 'Retour à l\'église' : 'Back to church'}</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 -mt-20 relative z-10 pb-16">
        {/* Church identity card */}
        <div className="rounded-3xl border bg-card shadow-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden ring-4 ring-background shrink-0">
              {church.logo_url
                ? <img src={church.logo_url} alt="" className="w-full h-full object-cover" />
                : <Church className="h-8 w-8 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
                <Heart className="h-3 w-3 fill-primary" /> {fr ? 'Faire un don à' : 'Give to'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mt-0.5">{church.name}</h1>
              {(church.city || church.denomination) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {[church.denomination, [church.city, church.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          {church.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-3">{church.bio}</p>
          )}
        </div>

        {campaign && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6">
            <p className="text-[11px] uppercase tracking-widest text-primary font-semibold mb-1">{fr ? 'Campagne en cours' : 'Active campaign'}</p>
            <p className="font-bold text-lg">{campaign.title}</p>
            {campaign.goal_amount && (
              <div className="mt-4">
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                       style={{ width: `${Math.min(100, (Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">{Number(campaign.raised_amount || 0).toLocaleString()}</span>
                  {' / '}{Number(campaign.goal_amount).toLocaleString()} {campaign.currency}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form card */}
        <div className="rounded-3xl border bg-card shadow-lg p-6 sm:p-8 space-y-7">
          {!campaign && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                {fr ? 'Type de don' : 'Gift type'}
              </Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as Type)} className="grid grid-cols-3 gap-2">
                {(['tithe', 'offering', 'donation'] as const).map((t) => (
                  <label key={t} className={`rounded-xl border-2 p-3.5 text-center cursor-pointer text-sm transition-all ${type === t ? 'border-primary bg-primary/5 font-semibold shadow-xs' : 'border-border hover:border-primary/40'}`}>
                    <RadioGroupItem value={t} className="sr-only" />
                    {typeLabel(t)}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fr ? 'Montant' : 'Amount'}</Label>
              <select value={currency} onChange={(e) => { const c = e.target.value as any; setCurrency(c); setAmount(PRESETS[c][1]); setCustomAmount(''); }} className="text-xs font-medium bg-muted border border-border rounded-lg px-2.5 py-1.5">
                {['XOF', 'XAF', 'EUR', 'USD'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESETS[currency].map((p) => (
                <button key={p} type="button" onClick={() => { setAmount(p); setCustomAmount(''); }}
                        className={`rounded-xl border-2 py-2.5 text-sm transition-all ${amount === p && !customAmount ? 'border-primary bg-primary/5 font-bold shadow-xs' : 'border-border hover:border-primary/40'}`}>
                  {p.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder={fr ? 'Montant personnalisé' : 'Custom amount'}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={100}
              className="h-11"
            />
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">{fr ? 'Votre nom' : 'Your name'}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={anon}
                     placeholder={anon ? (fr ? 'Anonyme' : 'Anonymous') : (fr ? 'Jean Kouadio' : 'John Doe')} className="h-11" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">{fr ? 'Email' : 'Email'}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">{fr ? 'Téléphone' : 'Phone'}</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225…" className="h-11" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {fr ? 'Email ou téléphone requis pour le reçu.' : 'Email or phone required for the receipt.'}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="msg" className="text-xs font-semibold">{fr ? 'Message (optionnel)' : 'Message (optional)'}</Label>
              <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                        placeholder={fr ? 'Une intention, une prière…' : 'An intention, a prayer…'} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
              <Checkbox checked={anon} onCheckedChange={(v) => setAnon(!!v)} />
              <span>{fr ? 'Faire un don anonyme' : 'Give anonymously'}</span>
            </label>
          </div>

          <Button onClick={submit} disabled={!canSubmit} size="lg"
                  className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20">
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <HandHeart className="mr-2 h-5 w-5" />}
            {fr ? `Donner ${finalAmount.toLocaleString()} ${currency}` : `Give ${finalAmount.toLocaleString()} ${currency}`}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {fr ? 'Paiement sécurisé' : 'Secure payment'}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {fr ? 'Reçu automatique' : 'Automatic receipt'}</span>
            <span>
              {useStripe
                ? (fr ? 'Carte via Stripe' : 'Card via Stripe')
                : (fr ? 'Mobile Money & Carte via GeniusPay' : 'Mobile Money & Card via GeniusPay')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
