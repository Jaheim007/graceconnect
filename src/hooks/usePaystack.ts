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
  amount: number; // in subunits
  currency?: string;
  ref?: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
  subaccount?: string; // Subaccount code for split payments
  transaction_charge?: number; // Platform fee in subunits
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

let paystackScriptPromise: Promise<void> | null = null;

function loadPaystackScript(timeoutMs = 12000): Promise<void> {
  if (window.PaystackPop?.setup) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;

  paystackScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paystack-inline="true"]');
    const script = existingScript ?? document.createElement('script');
    const createdNow = !existingScript;

    const cleanup = (onLoad: () => void, onError: () => void, timer: number) => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      window.clearTimeout(timer);
    };

    const fail = (message: string, onLoad: () => void, onError: () => void, timer: number) => {
      cleanup(onLoad, onError, timer);
      paystackScriptPromise = null;
      if (createdNow) script.remove();
      reject(new Error(message));
    };

    const onLoad = () => {
      script.setAttribute('data-loaded', 'true');
      cleanup(onLoad, onError, timer);
      if (!window.PaystackPop?.setup) {
        paystackScriptPromise = null;
        reject(new Error('Paystack loaded but API is unavailable.'));
        return;
      }
      resolve();
    };

    const onError = () => {
      fail('Failed to load Paystack script. Check your internet connection.', onLoad, onError, timer);
    };

    const timer = window.setTimeout(() => {
      fail('Paystack is taking too long to load. Please retry in a moment.', onLoad, onError, timer);
    }, timeoutMs);

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (createdNow) {
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.dataset.paystackInline = 'true';
      document.body.appendChild(script);
    }
  });

  return paystackScriptPromise;
}

function forcePaystackIframeOnTop() {
  let attempts = 0;
  const timer = window.setInterval(() => {
    document.querySelectorAll<HTMLIFrameElement>('iframe[src*="paystack"], iframe[title*="Paystack"], iframe[name*="paystack"]').forEach((iframe) => {
      iframe.style.zIndex = '2147483647';
      iframe.style.position = iframe.style.position || 'fixed';
    });

    attempts += 1;
    if (attempts >= 10) window.clearInterval(timer);
  }, 200);
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
    /** Platform fee in currency units. Will be converted to subunits internally. */
    platformFeeAmount?: number;
  }) => {
    await loadPaystackScript();

    // Validate currency is Paystack-supported before opening popup
    const PAYSTACK_SUPPORTED = new Set(['NGN', 'GHS', 'ZAR', 'KES', 'XOF', 'EGP', 'RWF', 'XAF']);
    if (!PAYSTACK_SUPPORTED.has(currency.toUpperCase())) {
      throw new Error(`La devise ${currency} n'est pas supportée par Mobile Money. Veuillez utiliser Carte bancaire.`);
    }

    // Generate unique reference
    const ref = `SV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (!PAYSTACK_PUBLIC_KEY) {
      throw new Error('Paystack public key is not configured. Please set VITE_PAYSTACK_PUBLIC_KEY.');
    }

    const config: PaystackConfig = {
      key: PAYSTACK_PUBLIC_KEY,
      email,
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
      if (platformFeeAmount && platformFeeAmount > 0) {
        config.transaction_charge = Math.round(platformFeeAmount * 100);
      }
      // Subaccount bears Paystack processing fees
      config.bearer = 'subaccount';
    }

    const handler = window.PaystackPop.setup(config);
    handler.openIframe();
    forcePaystackIframeOnTop();
  }, []);

  return { openPayment, hasKey: !!PAYSTACK_PUBLIC_KEY };
}

