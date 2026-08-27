import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { OtpInput, OtpResult } from './otp.server';

function validate(input: OtpInput): OtpInput {
  if (!input?.booking_id) throw new Error('booking_id required');
  return {
    action: String(input.action || ''),
    booking_id: String(input.booking_id),
    code: input.code ? String(input.code) : undefined,
  };
}

export const homeOtp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<OtpResult> => {
    const { runHomeOtp } = await import('./otp.server');
    return runHomeOtp(data, context.userId);
  });

export const eventsOtp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<OtpResult> => {
    const { runEventsOtp } = await import('./otp.server');
    return runEventsOtp(data, context.userId);
  });

export const educationOtp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<OtpResult> => {
    const { runEducationOtp } = await import('./otp.server');
    return runEducationOtp(data, context.userId);
  });
