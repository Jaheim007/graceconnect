import { createServerFn } from '@tanstack/react-start';

// Public by design: the payment reference is a high-entropy value only the
// buyer (and the provider) holds, and guests must be able to see their own
// receipt right after checkout. Input is format-validated before any query.
export const getPaymentByReference = createServerFn({ method: 'POST' })
  .inputValidator((input: { reference: string }) => {
    const reference = String(input?.reference || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{5,79}$/.test(reference)) {
      throw new Error('Invalid reference');
    }
    return { reference };
  })
  .handler(async ({ data }) => {
    const { lookupPaymentByReference } = await import('./paymentLookup.server');
    const payment = await lookupPaymentByReference(data.reference);
    return { payment };
  });
