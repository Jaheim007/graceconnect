import { CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMoMoAvailable, isPaystackCurrency } from '@/lib/paymentRouting';
import type { PaymentMethod } from '@/hooks/usePaymentGateway';
import { useI18n } from '@/i18n/I18nContext';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  currency?: string;
  className?: string;
  paystackEnabled?: boolean;
}

export function PaymentMethodSelector({ value, onChange, currency, className, paystackEnabled = true }: PaymentMethodSelectorProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const moMoRegionAvailable = isMoMoAvailable(currency);
  const showMoMo = moMoRegionAvailable && paystackEnabled;
  const showApplePay = paystackEnabled && isPaystackCurrency(currency || '');
  const effectiveValue: PaymentMethod = (showMoMo || showApplePay) ? value : 'card';

  const methodCount = [showMoMo, showApplePay, true].filter(Boolean).length;
  const gridCols = methodCount === 3 ? 'grid-cols-3' : methodCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">{isFr ? 'Mode de paiement' : 'Payment method'}</p>

      <div className={cn('grid gap-2', gridCols)}>
        {showMoMo && (
          <button
            type="button"
            onClick={() => onChange('mobile_money')}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs',
              effectiveValue === 'mobile_money'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-primary/40 text-muted-foreground'
            )}
          >
            <Smartphone className="h-5 w-5" />
            <span>Mobile Money</span>
            <span className="text-[10px] opacity-70">Orange, MTN, Wave…</span>
          </button>
        )}

        {showApplePay && (
          <button
            type="button"
            onClick={() => onChange('apple_pay')}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs',
              effectiveValue === 'apple_pay'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-primary/40 text-muted-foreground'
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>Apple Pay</span>
            <span className="text-[10px] opacity-70">Via Stripe</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange('card')}
          className={cn(
            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs',
            effectiveValue === 'card'
              ? 'border-primary bg-primary/5 text-primary font-medium'
              : 'border-border hover:border-primary/40 text-muted-foreground',
            !showMoMo && !showApplePay && 'col-span-1'
          )}
        >
          <CreditCard className="h-5 w-5" />
          <span>{isFr ? 'Carte bancaire' : 'Bank card'}</span>
          <span className="text-[10px] opacity-70">Visa, Mastercard… (Stripe)</span>
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {!showMoMo && moMoRegionAvailable
          ? (isFr ? 'Mobile Money temporairement indisponible. Utilisez Carte bancaire.' : 'Mobile Money temporarily unavailable. Use bank card.')
          : (isFr ? `Paiement sécurisé par ${effectiveValue === 'mobile_money' ? 'GeniusPay' : effectiveValue === 'apple_pay' ? 'Stripe' : 'Stripe'}` : `Secure payment via ${effectiveValue === 'mobile_money' ? 'GeniusPay' : effectiveValue === 'apple_pay' ? 'Stripe' : 'Stripe'}`)}
      </p>
    </div>
  );
}
