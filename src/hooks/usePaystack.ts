// Hook to load Paystack inline script and open the popup
import { useCallback } from 'react';

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => { openIframe: () => void };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // in kobo (XOF is zero-decimal so multiply by 100)
  currency?: string;
  ref?: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
  subaccount?: string; // Subaccount code for split payments
  transaction_charge?: number; // Platform fee in kobo
  bearer?: 'account' | 'subaccount'; // Who bears Paystack fees
}

// Automatically select test or live key based on VITE_PAYSTACK_MODE env var
const PAYSTACK_MODE = (import.meta.env.VITE_PAYSTACK_MODE as string) || 'live';
const PAYSTACK_PUBLIC_KEY = PAYSTACK_MODE === 'test'
  ? (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY_TEST as string | undefined)
  : (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined);

if (!PAYSTACK_PUBLIC_KEY) {
  console.warn(`[usePaystack] No Paystack key found for mode "${PAYSTACK_MODE}". Payments will fail.`);
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script. Check your internet connection.'));
    document.body.appendChild(script);
  });
}

export function usePaystack() {
  const openPayment = useCallback(async ({
    email,
    amount,
    currency = 'XOF',
    onSuccess,
    onClose,
    metadata,
    subaccount,
    platformFeeAmount,
  }: {
    email: string;
    amount: number;
    currency?: string;
    onSuccess: (reference: string) => void;
    onClose: () => void;
    metadata?: Record<string, unknown>;
    /** Paystack subaccount code for split payment */
    subaccount?: string;
    /** Platform fee in currency units (NOT kobo). Will be converted to kobo internally. */
    platformFeeAmount?: number;
  }) => {
    await loadPaystackScript();

    // Generate unique reference
    const ref = `SV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (!PAYSTACK_PUBLIC_KEY) {
      throw new Error('Paystack public key is not configured. Please set VITE_PAYSTACK_PUBLIC_KEY.');
    }

    const config: PaystackConfig = {
      key: PAYSTACK_PUBLIC_KEY,
      email,
      // XOF is zero-decimal: amount * 100 to convert to Paystack's lowest unit
      amount: Math.round(amount * 100),
      currency,
      ref,
      callback: (response) => onSuccess(response.reference),
      onClose,
      metadata,
    };

    // Split payment: route funds to org subaccount, keep platform fee
    if (subaccount) {
      config.subaccount = subaccount;
      // transaction_charge = platform fee in kobo (what Siteviral keeps)
      if (platformFeeAmount && platformFeeAmount > 0) {
        config.transaction_charge = Math.round(platformFeeAmount * 100);
      }
      // Subaccount bears Paystack processing fees
      config.bearer = 'subaccount';
    }

    const handler = window.PaystackPop.setup(config);
    handler.openIframe();
  }, []);

  return { openPayment, hasKey: !!PAYSTACK_PUBLIC_KEY };
}
