// Hook to load Paystack inline script (v2) and open the popup
import { useCallback } from 'react';

declare global {
  interface Window {
    PaystackPop: {
      // v1 legacy
      setup: (config: PaystackConfigV1) => { openIframe: () => void };
      // v2 constructor
      new (): PaystackPopInstance;
    };
  }
}

interface PaystackPopInstance {
  checkout(config: PaystackConfigV2): Promise<void>;
  paymentRequest(config: PaystackPaymentRequestConfig): Promise<void>;
}

interface PaystackConfigV1 {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  transaction_charge?: number;
  bearer?: 'account' | 'subaccount';
  channels?: string[];
}

interface PaystackConfigV2 {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  onSuccess: (response: { reference: string }) => void;
  onCancel: () => void;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  transaction_charge?: number;
  bearer?: 'account' | 'subaccount';
  channels?: string[];
}

interface PaystackPaymentRequestConfig extends PaystackConfigV2 {
  container: string;
  loadPaystackCheckoutButton?: string;
  style?: Record<string, unknown>;
  onError?: () => void;
  onElementsMount?: (elements: { applePay: boolean } | null) => void;
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
  if (window.PaystackPop) return Promise.resolve();
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
      if (!window.PaystackPop) {
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
      // Use v2 of InlineJS — required for Apple Pay support
      script.src = 'https://js.paystack.co/v2/inline.js';
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
    channels,
    useApplePay = false,
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
    /** Restrict to specific Paystack channels (e.g. ['apple_pay']) */
    channels?: string[];
    /** Use Apple Pay via v2 checkout() method */
    useApplePay?: boolean;
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

    // Use v2 checkout() method — supports Apple Pay natively on Safari/iOS
    const pop = new window.PaystackPop();

    const config: PaystackConfigV2 = {
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amount * 100),
      currency,
      ref,
      onSuccess: (response) => onSuccess(response.reference),
      onCancel: onClose,
      metadata,
    };

    // Restrict to specific channels (e.g. Apple Pay only)
    if (channels && channels.length > 0) {
      config.channels = channels;
    }

    // Split payment: route funds to org subaccount, keep platform fee
    if (subaccount) {
      config.subaccount = subaccount;
      if (platformFeeAmount && platformFeeAmount > 0) {
        config.transaction_charge = Math.round(platformFeeAmount * 100);
      }
      // Subaccount bears Paystack processing fees
      config.bearer = 'subaccount';
    }

    await pop.checkout(config);
    forcePaystackIframeOnTop();
  }, []);

  return { openPayment, hasKey: !!PAYSTACK_PUBLIC_KEY };
}
