import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type {
  BookingResult,
  CreateBookingInput,
  VerifyBookingInput,
  VerifyResult,
} from './bookings.server';

function validateCreate(input: CreateBookingInput): CreateBookingInput {
  const str = (v: unknown) => (v == null || v === '' ? undefined : String(v));
  return {
    offer_id: str(input?.offer_id),
    service_id: str(input?.service_id),
    slot_start: str(input?.slot_start),
    slot_end: str(input?.slot_end),
    location_type: str(input?.location_type),
    address: str(input?.address) ?? null,
    notes: str(input?.notes) ?? null,
    scheduled_at: str(input?.scheduled_at),
    mode: str(input?.mode),
    location_address: str(input?.location_address) ?? null,
    meeting_url: str(input?.meeting_url) ?? null,
    return_origin: str(input?.return_origin),
  };
}

function validateVerify(input: VerifyBookingInput): VerifyBookingInput {
  const bookingId = String(input?.booking_id || '');
  if (!bookingId) throw new Error('booking_id required');
  return {
    booking_id: bookingId,
    session_id: input?.session_id ? String(input.session_id) : undefined,
  };
}

export const beautyCreateBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCreate)
  .handler(async ({ data, context }): Promise<BookingResult> => {
    const { createBeautyBooking } = await import('./bookings.server');
    return createBeautyBooking(data, context.userId);
  });

export const homeCreateBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCreate)
  .handler(async ({ data, context }): Promise<BookingResult> => {
    const { createHomeBooking } = await import('./bookings.server');
    return createHomeBooking(data, context.userId);
  });

export const eventsCreateBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCreate)
  .handler(async ({ data, context }): Promise<BookingResult> => {
    const { createEventsBooking } = await import('./bookings.server');
    return createEventsBooking(data, context.userId);
  });

export const educationCreateBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCreate)
  .handler(async ({ data, context }): Promise<BookingResult> => {
    const { createEducationBooking } = await import('./bookings.server');
    return createEducationBooking(data, context.userId);
  });

export const beautyVerifyBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateVerify)
  .handler(async ({ data }): Promise<VerifyResult> => {
    const { verifyBeautyBooking } = await import('./bookings.server');
    return verifyBeautyBooking(data);
  });

export const homeVerifyBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateVerify)
  .handler(async ({ data }): Promise<VerifyResult> => {
    const { verifyHomeBooking } = await import('./bookings.server');
    return verifyHomeBooking(data);
  });

export const eventsVerifyBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateVerify)
  .handler(async ({ data }): Promise<VerifyResult> => {
    const { verifyEventsBooking } = await import('./bookings.server');
    return verifyEventsBooking(data);
  });

export const educationVerifyBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateVerify)
  .handler(async ({ data }): Promise<VerifyResult> => {
    const { verifyEducationBooking } = await import('./bookings.server');
    return verifyEducationBooking(data);
  });
