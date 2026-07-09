import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { MARKET_CATS, type MarketModule } from '@/lib/marketplaceCats';

/** URL ?activity=<value> → vertical key in marketplaceCats. */
const ACTIVITY_URL_TO_CAT_KEY: Record<string, string> = {
  digital: 'digital',
  home: 'artisans',
  artisans: 'artisans',
  beauty: 'beauty',
  church: 'church',
  influencer: 'influencers',
  influencers: 'influencers',
  sport: 'sport',
  learn: 'tutors',
  tutors: 'tutors',
  music: 'music',
  general: 'general',
};

/** Vertical key → siteviral_type. */
const CAT_KEY_TO_TYPE: Record<string, SiteviralType> = {
  digital: 'digital_products',
  artisans: 'artisans_home_services',
  beauty: 'beauty',
  church: 'church',
  influencers: 'influencers',
  sport: 'sport',
  tutors: 'tutors_home_teachers',
  music: 'instrumentists',
  general: 'services',
};

const MODULE_TO_FEATURE: Record<MarketModule, SiteviralFeatureKey | null> = {
  booking: 'appointment',
  digitalSales: 'digital_products',
  orderGen: 'order_generator',
  donations: 'donation_gifts',
  payments: 'payment',
  aiBooks: 'ai_book_creation',
  aiContent: 'ai_formation_creation',
  comments: 'product_comments',
  location: 'location',
  events: 'events',
  reviews: 'reviews',
  kyc: 'kyc',
  affiliate: 'affiliation',
};

export interface ActivityConfig {
  activityKey: string;                       // marketplace cat key
  siteviral_type: SiteviralType;
  enabled_features: SiteviralFeatureKey[];
  modules: MarketModule[];
  labelFr: string;
  labelEn: string;
}

/** Resolve any input (url param or cat key) to a full config. */
export function resolveActivity(input?: string | null): ActivityConfig {
  const raw = (input || 'general').toLowerCase();
  const key = ACTIVITY_URL_TO_CAT_KEY[raw] || raw;
  const cat = MARKET_CATS.find((c) => c.key === key) || MARKET_CATS.find((c) => c.key === 'general')!;
  const features = new Set<SiteviralFeatureKey>();
  for (const m of cat.modules) {
    const f = MODULE_TO_FEATURE[m];
    if (f) features.add(f);
  }
  return {
    activityKey: cat.key,
    siteviral_type: CAT_KEY_TO_TYPE[cat.key] || 'services',
    enabled_features: Array.from(features),
    modules: cat.modules,
    labelFr: cat.fr,
    labelEn: cat.en,
  };
}
