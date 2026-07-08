import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

/**
 * Goal ids surfaced in StartOfferingPage. Kept internal to the app —
 * the user only sees the human labels, never these ids.
 */
export type StartGoalId =
  | 'sell_digital'
  | 'receive_appointments'
  | 'offer_beauty'
  | 'offer_home'
  | 'offer_tutoring'
  | 'receive_donations'
  | 'custom_orders'
  | 'accept_payments'
  | 'create_events'
  | 'ai_books'
  | 'ai_formations'
  | 'show_location'
  | 'receive_reviews'
  | 'use_affiliation';

export interface InferredConfig {
  siteviral_type: SiteviralType;
  enabled_features: SiteviralFeatureKey[];
}

/**
 * Type inference — priority order, first match wins.
 * Events is NEVER a type trigger on its own.
 * Digital products is the safe default.
 */
function inferType(goals: Set<StartGoalId>): SiteviralType {
  if (goals.has('offer_beauty')) return 'beauty';
  if (goals.has('offer_home')) return 'artisans_home_services';
  if (goals.has('offer_tutoring')) return 'tutors_home_teachers';
  const hasService = goals.has('offer_beauty') || goals.has('offer_home') || goals.has('offer_tutoring');
  if (goals.has('receive_donations') && !hasService) return 'church';
  return 'digital_products';
}

/**
 * Feature inference — additive union. KYC & affiliation are treated as
 * baseline provider foundations whenever money or a service is involved.
 */
export function inferSiteviralConfig(goalIds: StartGoalId[]): InferredConfig {
  const goals = new Set(goalIds);
  const features = new Set<SiteviralFeatureKey>();

  const isService =
    goals.has('offer_beauty') || goals.has('offer_home') || goals.has('offer_tutoring');

  // A. Sell digital products
  if (goals.has('sell_digital')) {
    features.add('digital_products');
    features.add('product_comments');
    features.add('payment');
    features.add('kyc');
    features.add('affiliation');
  }

  // B. Receive donations / offerings / gifts
  if (goals.has('receive_donations')) {
    features.add('donation_gifts');
    features.add('payment');
    features.add('kyc');
    features.add('affiliation');
  }

  // C/D/E. Service provider bundles
  if (isService) {
    features.add('appointment');
    features.add('order_generator');
    features.add('payment');
    features.add('location');
    features.add('reviews');
    features.add('kyc');
    features.add('affiliation');
  }

  // F. Receive appointments (alone)
  if (goals.has('receive_appointments')) {
    features.add('appointment');
  }

  // G. Create custom orders
  if (goals.has('custom_orders')) {
    features.add('order_generator');
    features.add('payment');
    features.add('kyc');
  }

  // H. Create events
  if (goals.has('create_events')) {
    features.add('events');
    // Money/KYC only when the provider explicitly opts into paid flow.
    if (goals.has('accept_payments')) {
      features.add('payment');
      features.add('kyc');
    }
  }

  // I. Books with AI
  if (goals.has('ai_books')) {
    features.add('ai_book_creation');
    features.add('digital_products');
  }

  // J. Formations with AI
  if (goals.has('ai_formations')) {
    features.add('ai_formation_creation');
    features.add('digital_products');
  }

  // Standalone toggles
  if (goals.has('accept_payments')) {
    features.add('payment');
    features.add('kyc');
  }
  if (goals.has('show_location')) features.add('location');
  if (goals.has('receive_reviews')) features.add('reviews');
  if (goals.has('use_affiliation')) features.add('affiliation');

  return {
    siteviral_type: inferType(goals),
    enabled_features: Array.from(features),
  };
}
