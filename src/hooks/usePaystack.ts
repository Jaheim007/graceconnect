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
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
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
  }: {
    email: string;
    amount: number;
    currency?: string;
    onSuccess: (reference: string) => void;
    onClose: () => void;
    metadata?: Record<string, unknown>;
  }) => {
    await loadPaystackScript();

    // Generate unique reference
    const ref = `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (!PAYSTACK_PUBLIC_KEY) {
      throw new Error('Paystack public key is not configured. Please set VITE_PAYSTACK_PUBLIC_KEY.');
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      // XOF is zero-decimal: amount * 100 to convert to Paystack's lowest unit
      amount: Math.round(amount * 100),
      currency,
      ref,
      callback: (response) => onSuccess(response.reference),
      onClose,
      metadata,
    });

    handler.openIframe();
  }, []);

  return { openPayment, hasKey: !!PAYSTACK_PUBLIC_KEY };
}
