import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Church, HandHeart, Loader2, Info } from 'lucide-react';
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
      const { data } = await supabase.from('church_providers').select('id, slug, name, logo_url, currency, status').eq('slug', slug!).maybeSingle();
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


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/church/${church.slug}`}><ArrowLeft className="mr-1 h-4 w-4" /> {fr ? 'Retour' : 'Back'}</Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            {church.logo_url ? <img src={church.logo_url} alt="" className="w-full h-full object-cover" /> : <Church className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{fr ? 'Faire un don à' : 'Give to'}</p>
            <h1 className="text-xl font-bold">{church.name}</h1>
          </div>
        </div>

        {campaign && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6">
            <p className="text-xs text-primary font-medium mb-1">{fr ? 'Campagne' : 'Campaign'}</p>
            <p className="font-semibold">{campaign.title}</p>
            {campaign.goal_amount && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number(campaign.raised_amount || 0).toLocaleString()} / {Number(campaign.goal_amount).toLocaleString()} {campaign.currency}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {!campaign && (
            <div>
              <Label className="text-xs mb-2 block">{fr ? 'Type de don' : 'Gift type'}</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as Type)} className="grid grid-cols-3 gap-2">
                {(['tithe', 'offering', 'donation'] as const).map((t) => (
                  <label key={t} className={`rounded-xl border p-3 text-center cursor-pointer text-sm ${type === t ? 'border-primary bg-primary/5 font-medium' : 'border-border'}`}>
                    <RadioGroupItem value={t} className="sr-only" />
                    {t === 'tithe' ? (fr ? 'Dîme' : 'Tithe') : t === 'offering' ? (fr ? 'Offrande' : 'Offering') : (fr ? 'Don' : 'Donation')}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">{fr ? 'Montant' : 'Amount'}</Label>
              <select value={currency} onChange={(e) => { const c = e.target.value as any; setCurrency(c); setAmount(PRESETS[c][1]); setCustomAmount(''); }} className="text-xs bg-transparent border border-border rounded-md px-2 py-1">
                {['XOF', 'XAF', 'EUR', 'USD'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {PRESETS[currency].map((p) => (
                <button key={p} type="button" onClick={() => { setAmount(p); setCustomAmount(''); }} className={`rounded-lg border p-2 text-sm ${amount === p && !customAmount ? 'border-primary bg-primary/5 font-semibold' : 'border-border'}`}>
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
            />
          </div>

          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">{fr ? 'Votre nom' : 'Your name'}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={anon} placeholder={anon ? (fr ? 'Anonyme' : 'Anonymous') : ''} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">{fr ? 'Email' : 'Email'}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">{fr ? 'Téléphone' : 'Phone'}</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225…" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-start gap-1"><Info className="h-3 w-3 shrink-0 mt-0.5" /> {fr ? 'Email ou téléphone requis pour le reçu.' : 'Email or phone required for the receipt.'}</p>
            <div className="space-y-1.5">
              <Label htmlFor="msg" className="text-xs">{fr ? 'Message (optionnel)' : 'Message (optional)'}</Label>
              <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={anon} onCheckedChange={(v) => setAnon(!!v)} /> {fr ? 'Faire un don anonyme' : 'Give anonymously'}
            </label>
          </div>

          <Button onClick={submit} disabled={!canSubmit} size="lg" className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandHeart className="mr-2 h-4 w-4" />}
            {fr ? `Donner ${finalAmount.toLocaleString()} ${currency}` : `Give ${finalAmount.toLocaleString()} ${currency}`}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            {useStripe
              ? (fr ? 'Paiement carte international sécurisé via Stripe' : 'Secure international card payment via Stripe')
              : (fr ? 'Mobile Money & Carte via GeniusPay' : 'Mobile Money & Card via GeniusPay')}
          </p>
        </div>
      </div>
    </div>
  );
}
