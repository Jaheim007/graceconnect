import { CreditCard, Smartphone, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveGateway, isMoMoAvailable, gatewayLabel } from '@/lib/paymentRouting';
import type { PaymentMethod } from '@/hooks/usePaymentGateway';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  currency?: string;
  className?: string;
}

export function PaymentMethodSelector({ value, onChange, currency, className }: PaymentMethodSelectorProps) {
  const gateway = resolveGateway(currency);
  const showMoMo = gateway === 'paystack' && isMoMoAvailable(currency);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">Mode de paiement</p>

      {gateway === 'paystack' ? (
        // Paystack region: show MoMo + Card options (both processed by Paystack)
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
              <span className="text-[10px] opacity-70">Orange, MTN, M-Pesa…</span>
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
            <span className="text-[10px] opacity-70">Visa, Mastercard…</span>
          </button>
        </div>
      ) : (
        // Stripe region: card only (auto-selected)
        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 text-xs">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium text-primary">Carte bancaire internationale</p>
            <p className="text-[10px] opacity-70">Visa, Mastercard, Amex — via Stripe</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Paiement sécurisé par {gatewayLabel(gateway)}
      </p>
    </div>
  );
}
