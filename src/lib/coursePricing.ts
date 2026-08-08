/**
 * Pricing floor for AI-generated courses.
 *
 * A course written by the AI can never be free: the credits were spent, and a
 * free AI course cannot be sold or promoted by ambassadors. The floor is per
 * currency and enforced both in the builder and server-side.
 */
export const MIN_AI_COURSE_PRICE: Record<string, number> = {
  XOF: 1000, XAF: 1000, NGN: 1500, GHS: 20, KES: 200, ZAR: 40,
  MAD: 20, TND: 5, USD: 2, EUR: 2, GBP: 2,
};

export function minAiCoursePrice(currency: string): number {
  return MIN_AI_COURSE_PRICE[currency] ?? MIN_AI_COURSE_PRICE.USD;
}
