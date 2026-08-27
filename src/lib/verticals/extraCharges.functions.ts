import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { ExtraChargeInput, ExtraChargeResult } from './extraCharges.server';

function validate(input: ExtraChargeInput): ExtraChargeInput {
  const action = String(input?.action || '');
  if (!action) throw new Error('action required');
  return {
    action,
    booking_id: input.booking_id ? String(input.booking_id) : undefined,
    extra_charge_id: input.extra_charge_id ? String(input.extra_charge_id) : undefined,
    amount: input.amount != null ? Number(input.amount) : undefined,
    description: input.description ? String(input.description) : undefined,
    label: input.label ? String(input.label) : undefined,
    reason: input.reason ? String(input.reason) : undefined,
    return_origin: input.return_origin ? String(input.return_origin) : undefined,
  };
}

export const beautyExtraCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<ExtraChargeResult> => {
    const { runBeautyExtraCharge } = await import('./extraCharges.server');
    return runBeautyExtraCharge(data, context.userId);
  });

export const homeExtraCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<ExtraChargeResult> => {
    const { runHomeExtraCharge } = await import('./extraCharges.server');
    return runHomeExtraCharge(data, context.userId);
  });

export const eventsExtraCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<ExtraChargeResult> => {
    const { runEventsExtraCharge } = await import('./extraCharges.server');
    return runEventsExtraCharge(data, context.userId);
  });

export const educationExtraCharge = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<ExtraChargeResult> => {
    const { runEducationExtraCharge } = await import('./extraCharges.server');
    return runEducationExtraCharge(data, context.userId);
  });
