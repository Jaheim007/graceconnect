import { useState } from 'react';
import { Building2, Loader2, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultCurrency?: string;
  submitting?: boolean;
  onConfirm: (values: { name: string; currency: string }) => void;
}

/**
 * Asked once, right before the first publication, when the author has no
 * platform yet: name + currency. No auto-created "undefined" workspace.
 */
export function PlatformSetupDialog({
  open,
  onOpenChange,
  defaultName = '',
  defaultCurrency = 'XOF',
  submitting,
  onConfirm,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [name, setName] = useState(defaultName);
  const [currency, setCurrency] = useState(defaultCurrency);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && !!currency;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{isFr ? 'Nomme ta plateforme' : 'Name your platform'}</DialogTitle>
          <DialogDescription>
            {isFr
              ? "C'est la boutique qui accueillera ton livre. Tu pourras tout modifier plus tard."
              : 'This is the store that will host your book. You can change everything later.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{isFr ? 'Nom de la plateforme' : 'Platform name'}</label>
            <Input
              value={name}
              autoFocus
              maxLength={60}
              placeholder={isFr ? 'Ex : Éditions Grâce' : 'e.g. Grace Editions'}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{isFr ? 'Devise de vente' : 'Selling currency'}</label>
            <CurrencySelector value={currency} onChange={(c) => setCurrency(c)} className="h-10" />
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 mt-2"
          disabled={!valid || submitting}
          onClick={() => onConfirm({ name: trimmed, currency })}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {isFr ? 'Créer et publier' : 'Create and publish'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
