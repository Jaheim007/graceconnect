import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { callFn } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const COUNTRIES = [
  { code: 'CI', label: 'Côte d\'Ivoire', currency: 'XOF' },
  { code: 'GH', label: 'Ghana', currency: 'GHS' },
  { code: 'NG', label: 'Nigeria', currency: 'NGN' },
  { code: 'KE', label: 'Kenya', currency: 'KES' },
  { code: 'ZA', label: 'Afrique du Sud', currency: 'ZAR' },
];

const MOMO_PROVIDERS: Record<string, { code: string; label: string }[]> = {
  CI: [
    { code: 'orange-ci', label: 'Orange Money' },
    { code: 'mtn-ci', label: 'MTN MoMo' },
    { code: 'moov-ci', label: 'Moov Money' },
  ],
  GH: [
    { code: 'mtn-gh', label: 'MTN MoMo' },
    { code: 'vod-gh', label: 'Vodafone Cash' },
    { code: 'tgo-gh', label: 'AirtelTigo Money' },
  ],
  KE: [{ code: 'mpesa', label: 'M-Pesa' }],
};

interface Props {
  hasRecipient: boolean;
  currentMethod?: string | null;
  currentCountry?: string | null;
}

export default function PartnerPayoutConfig({ hasRecipient, currentMethod, currentCountry }: Props) {
  const qc = useQueryClient();
  const [country, setCountry] = useState(currentCountry || 'CI');
  const [method, setMethod] = useState<'mobile_money' | 'bank'>(currentMethod === 'bank' ? 'bank' : 'mobile_money');
  const [provider, setProvider] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  const momoProviders = MOMO_PROVIDERS[country] || [];
  const hasMomo = momoProviders.length > 0;

  const handleSubmit = async () => {
    if (!accountNumber || !accountName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (method === 'mobile_money' && !provider) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }
    if (method === 'bank' && !bankCode) {
      toast.error('Veuillez entrer le code banque');
      return;
    }

    setLoading(true);
    try {
      await callFn('create-transfer-recipient-partner', {
        country,
        method,
        provider: method === 'mobile_money' ? provider : undefined,
        bank_code: method === 'bank' ? bankCode : undefined,
        account_number: accountNumber,
        account_name: accountName,
      }, true);
      toast.success('Méthode de paiement configurée !');
      qc.invalidateQueries({ queryKey: ['my-partner'] });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la configuration');
    } finally {
      setLoading(false);
    }
  };

  if (hasRecipient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Méthode de paiement configurée
          </CardTitle>
          <CardDescription>
            Votre méthode de paiement ({currentMethod === 'bank' ? 'Virement bancaire' : 'Mobile Money'} — {currentCountry}) est active.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Configurer votre méthode de paiement
        </CardTitle>
        <CardDescription>Pour recevoir vos versements, configurez votre compte bancaire ou Mobile Money.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Pays</Label>
            <Select value={country} onValueChange={v => { setCountry(v); setProvider(''); setMethod(MOMO_PROVIDERS[v]?.length ? 'mobile_money' : 'bank'); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label} ({c.currency})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Méthode</Label>
            <Select value={method} onValueChange={v => setMethod(v as 'mobile_money' | 'bank')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {hasMomo && <SelectItem value="mobile_money">Mobile Money</SelectItem>}
                <SelectItem value="bank">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {method === 'mobile_money' && hasMomo && (
          <div className="space-y-1.5">
            <Label>Fournisseur</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue placeholder="Choisir un fournisseur" /></SelectTrigger>
              <SelectContent>
                {momoProviders.map(p => <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {method === 'bank' && (
          <div className="space-y-1.5">
            <Label>Code banque</Label>
            <Input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="Ex: 058, 033" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Numéro de compte / téléphone</Label>
            <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={method === 'mobile_money' ? '07XXXXXXXX' : 'Numéro de compte'} />
          </div>
          <div className="space-y-1.5">
            <Label>Nom du titulaire</Label>
            <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Nom complet" />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Enregistrer la méthode de paiement
        </Button>
      </CardContent>
    </Card>
  );
}
