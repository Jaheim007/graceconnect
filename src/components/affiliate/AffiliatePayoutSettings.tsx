import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Smartphone, Building2, Shield, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const COUNTRY_CONFIG: Record<string, { label: string; currency: string; momo_providers: { code: string; label: string }[]; supports_bank: boolean }> = {
  CI: { label: "Côte d'Ivoire", currency: 'XOF', momo_providers: [{ code: 'orange-ci', label: 'Orange Money' }, { code: 'mtn-ci', label: 'MTN MoMo' }, { code: 'moov-ci', label: 'Moov Money' }], supports_bank: false },
  GH: { label: 'Ghana', currency: 'GHS', momo_providers: [{ code: 'mtn-gh', label: 'MTN MoMo' }, { code: 'vod-gh', label: 'Vodafone Cash' }, { code: 'tgo-gh', label: 'AirtelTigo Money' }], supports_bank: true },
  NG: { label: 'Nigeria', currency: 'NGN', momo_providers: [], supports_bank: true },
  KE: { label: 'Kenya', currency: 'KES', momo_providers: [{ code: 'mpesa', label: 'M-Pesa' }], supports_bank: true },
  ZA: { label: 'South Africa', currency: 'ZAR', momo_providers: [], supports_bank: true },
  RW: { label: 'Rwanda', currency: 'RWF', momo_providers: [{ code: 'mtn-rw', label: 'MTN MoMo' }], supports_bank: true },
};

const schema = z.object({
  country: z.string().min(1),
  method: z.enum(['mobile_money', 'bank']),
  provider: z.string().optional(),
  bank_code: z.string().optional(),
  account_number: z.string().min(5).max(30),
  account_name: z.string().min(2).max(100),
}).refine(data => {
  if (data.method === 'mobile_money') return !!data.provider;
  return !!data.bank_code;
}, { path: ['provider'] });

type FormData = z.infer<typeof schema>;

export default function AffiliatePayoutSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [saving, setSaving] = useState(false);
  const [existingRecipient, setExistingRecipient] = useState<{
    recipient_code: string | null; method: string | null; country: string | null;
    provider: string | null; account_number: string | null; account_name: string | null;
    locked: boolean; currency: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: '', method: 'mobile_money', provider: '', bank_code: '', account_number: '', account_name: '' },
  });

  const watchCountry = form.watch('country');
  const watchMethod = form.watch('method');
  const countryConfig = watchCountry ? COUNTRY_CONFIG[watchCountry] : null;
  const hasMomo = countryConfig && countryConfig.momo_providers.length > 0;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await db.from('payout_profiles').select('paystack_recipient_code, payout_method, payout_country, payout_provider, payout_account_number, payout_account_name, recipient_locked, payout_currency').eq('user_id', user.id).maybeSingle();
      if (data?.paystack_recipient_code) {
        setExistingRecipient({
          recipient_code: data.paystack_recipient_code, method: data.payout_method, country: data.payout_country,
          provider: data.payout_provider, account_number: data.payout_account_number, account_name: data.payout_account_name,
          locked: data.recipient_locked ?? false, currency: data.payout_currency,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    form.setValue('provider', '');
    form.setValue('bank_code', '');
    if (countryConfig) {
      form.setValue('method', countryConfig.momo_providers.length > 0 ? 'mobile_money' : 'bank');
    }
  }, [watchCountry]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('create-transfer-recipient', {
        body: {
          country: data.country, method: data.method,
          provider: data.method === 'mobile_money' ? data.provider : undefined,
          bank_code: data.method === 'bank' ? data.bank_code : undefined,
          account_number: data.account_number, account_name: data.account_name,
        },
      });
      if (error) throw new Error(error.message);
      if (res?.error) throw new Error(res.detail || res.error);
      await refreshProfile();
      setExistingRecipient({
        recipient_code: res.recipient_code, method: data.method, country: data.country,
        provider: data.provider || null, account_number: data.account_number,
        account_name: data.account_name, locked: false, currency: res.currency,
      });
      toast({ title: isFr ? '✅ Méthode de paiement configurée' : '✅ Payment method configured', description: isFr ? 'Vous pouvez maintenant demander des retraits.' : 'You can now request withdrawals.' });
    } catch (err: unknown) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: err instanceof Error ? err.message : (isFr ? 'Échec de la configuration' : 'Configuration failed'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <Card className="border-border"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  if (existingRecipient?.recipient_code) {
    const countryLabel = existingRecipient.country ? COUNTRY_CONFIG[existingRecipient.country]?.label || existingRecipient.country : '—';
    const methodLabel = existingRecipient.method === 'mobile_money' ? 'Mobile Money' : (isFr ? 'Virement bancaire' : 'Bank transfer');
    const providerLabel = existingRecipient.provider
      ? COUNTRY_CONFIG[existingRecipient.country || '']?.momo_providers.find(p => p.code === existingRecipient.provider)?.label || existingRecipient.provider
      : null;

    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{isFr ? 'Méthode de paiement' : 'Payment method'}</CardTitle>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {isFr ? 'Configurée' : 'Configured'}
            </Badge>
          </div>
          <CardDescription>{isFr ? 'Vos retraits seront envoyés sur ce compte.' : 'Your withdrawals will be sent to this account.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">{isFr ? 'Pays' : 'Country'}</span><p className="font-medium">{countryLabel}</p></div>
            <div><span className="text-muted-foreground">{isFr ? 'Devise' : 'Currency'}</span><p className="font-medium">{existingRecipient.currency}</p></div>
            <div><span className="text-muted-foreground">{isFr ? 'Méthode' : 'Method'}</span><p className="font-medium">{methodLabel}</p></div>
            {providerLabel && <div><span className="text-muted-foreground">{isFr ? 'Opérateur' : 'Provider'}</span><p className="font-medium">{providerLabel}</p></div>}
            <div><span className="text-muted-foreground">{isFr ? 'Numéro' : 'Number'}</span><p className="font-medium">****{existingRecipient.account_number?.slice(-4)}</p></div>
            <div><span className="text-muted-foreground">{isFr ? 'Nom' : 'Name'}</span><p className="font-medium">{existingRecipient.account_name}</p></div>
          </div>
          {existingRecipient.locked && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
              <Shield className="h-4 w-4 shrink-0" />
              <span>{isFr ? 'Méthode verrouillée après un paiement. Contactez le support pour modifier.' : 'Method locked after a payment. Contact support to change.'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{isFr ? 'Configurer votre méthode de paiement' : 'Set up your payment method'}</CardTitle>
          </div>
          <CardDescription>{isFr ? 'Pour recevoir vos commissions d\'affiliation, configurez votre compte de retrait.' : 'To receive your affiliate commissions, set up your withdrawal account.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isFr ? 'Pays' : 'Country'}</Label>
              <Select value={watchCountry} onValueChange={v => form.setValue('country', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder={isFr ? 'Sélectionnez votre pays' : 'Select your country'} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRY_CONFIG).map(([code, c]) => (
                    <SelectItem key={code} value={code}>{c.label} ({c.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {countryConfig && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isFr ? 'Méthode de paiement' : 'Payment method'}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {hasMomo && (
                      <button type="button" onClick={() => form.setValue('method', 'mobile_money')}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${watchMethod === 'mobile_money' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}>
                        <Smartphone className="h-4 w-4" /> Mobile Money
                      </button>
                    )}
                    {countryConfig.supports_bank && (
                      <button type="button" onClick={() => form.setValue('method', 'bank')}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${watchMethod === 'bank' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}>
                        <Building2 className="h-4 w-4" /> {isFr ? 'Banque' : 'Bank'}
                      </button>
                    )}
                  </div>
                </div>

                {watchMethod === 'mobile_money' && hasMomo && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isFr ? 'Opérateur' : 'Provider'}</Label>
                    <Select value={form.watch('provider')} onValueChange={v => form.setValue('provider', v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder={isFr ? 'Sélectionnez l\'opérateur' : 'Select provider'} /></SelectTrigger>
                      <SelectContent>
                        {countryConfig.momo_providers.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {watchMethod === 'bank' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isFr ? 'Code banque' : 'Bank code'}</Label>
                    <Input {...form.register('bank_code')} placeholder="Ex: 057 (Zenith Bank)" />
                    <p className="text-[10px] text-muted-foreground">{isFr ? 'Consultez la liste Paystack pour votre pays' : 'Check the Paystack list for your country'}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{watchMethod === 'mobile_money' ? (isFr ? 'Numéro de téléphone' : 'Phone number') : (isFr ? 'Numéro de compte' : 'Account number')}</Label>
                  <Input {...form.register('account_number')} placeholder={watchMethod === 'mobile_money' ? '07XXXXXXXX' : '0123456789'} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isFr ? 'Nom du titulaire' : 'Account holder name'}</Label>
                  <Input {...form.register('account_name')} placeholder={isFr ? 'Nom complet' : 'Full name'} />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>{isFr ? 'Après votre premier paiement, cette méthode sera verrouillée pour des raisons de sécurité. Assurez-vous que les informations sont correctes.' : 'After your first payment, this method will be locked for security. Make sure the information is correct.'}</span>
                </div>

                <Button type="submit" disabled={saving} className="w-full h-11">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {isFr ? 'Configuration en cours...' : 'Configuring...'}</> : (isFr ? 'Configurer le paiement' : 'Set up payment')}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
