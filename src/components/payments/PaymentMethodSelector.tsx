import { useState } from 'react';
import { CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/hooks/usePaymentGateway';

const MOBILE_MONEY_COUNTRIES = ['CI', 'GH', 'KE', 'SN', 'CM', 'BF', 'ML', 'TG', 'BJ', 'NE'];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  currency?: string;
  className?: string;
}

export function PaymentMethodSelector({ value, onChange, currency, className }: PaymentMethodSelectorProps) {
  // Show MoMo option for African currencies
  const africanCurrencies = ['XOF', 'XAF', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'RWF'];
  const showMoMo = !currency || africanCurrencies.includes(currency.toUpperCase());

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">Mode de paiement</p>
      <div className="grid grid-cols-2 gap-2">
        {showMoMo && (
          <button
            type="button"
            onClick={() => onChange('mobile_money')}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs',
              value === 'mobile_money'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-primary/40 text-muted-foreground'
            )}
          >
            <Smartphone className="h-5 w-5" />
            <span>Mobile Money</span>
            <span className="text-[10px] opacity-70">
              Orange, MTN, M-Pesa…
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange('card')}
          className={cn(
            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs',
            value === 'card'
              ? 'border-primary bg-primary/5 text-primary font-medium'
              : 'border-border hover:border-primary/40 text-muted-foreground',
            !showMoMo && 'col-span-2'
          )}
        >
          <CreditCard className="h-5 w-5" />
          <span>Carte bancaire</span>
          <span className="text-[10px] opacity-70">
            Visa, Mastercard, etc.
          </span>
        </button>
      </div>
    </div>
  );
}
