import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, Music, Megaphone, Briefcase, Dumbbell, type LucideIcon } from 'lucide-react';

/**
 * Functionality modules a vertical exposes. Used by per-vertical dashboards
 * to gate which tiles/features appear.
 */
export type MarketModule =
  | 'booking'          // Appointment / booking
  | 'digitalSales'     // Digital product sales
  | 'orderGen'         // Custom order / quote generator
  | 'donations'        // Offerings / donations / gifts
  | 'payments'         // MoMo + card
  | 'aiBooks'          // AI book creation
  | 'aiContent'        // AI info / content creation
  | 'comments'         // Comments on digital products
  | 'location'         // Location / map / area
  | 'events'           // Events + tickets
  | 'reviews'          // Reviews on person / establishment
  | 'kyc'              // KYC (always on)
  | 'affiliate';       // Affiliation (always on)

export type MarketCat = {
  key: string;
  icon: LucideIcon;
  fr: string; en: string;
  findRoute: string;
  proposeRoute: string;
  gradient: string;
  /** Full modules from the SiteViral capability matrix. */
  modules: MarketModule[];
};

const BASE: MarketModule[] = ['orderGen', 'payments', 'kyc', 'affiliate'];

export const MARKET_CATS: MarketCat[] = [
  {
    key: 'digital',
    icon: ShoppingBag,
    fr: 'Produits digitaux', en: 'Digital products',
    findRoute: '/discover?type=digital',
    proposeRoute: '/create-org?world=digital',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    modules: [...BASE, 'digitalSales', 'donations', 'aiBooks', 'aiContent', 'comments', 'events'],
  },
  {
    key: 'artisans',
    icon: Wrench,
    fr: 'Artisans / Services à domicile', en: 'Artisans / Home services',
    findRoute: '/home/discover',
    proposeRoute: '/create-org?world=home',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    modules: [...BASE, 'booking', 'aiContent', 'location', 'reviews'],
  },
  {
    key: 'beauty',
    icon: Scissors,
    fr: 'Beauté', en: 'Beauty',
    findRoute: '/beauty/search',
    proposeRoute: '/create-org?world=beauty',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    modules: [...BASE, 'booking', 'digitalSales', 'aiBooks', 'aiContent', 'comments', 'location', 'events', 'reviews'],
  },
  {
    key: 'church',
    icon: Church,
    fr: 'Églises', en: 'Churches',
    findRoute: '/church/discover',
    proposeRoute: '/create-org?world=church',
    gradient: 'from-violet-500 via-purple-500 to-slate-600',
    modules: [...BASE, 'booking', 'digitalSales', 'donations', 'aiBooks', 'aiContent', 'comments', 'location', 'events', 'reviews'],
  },
  {
    key: 'influencers',
    icon: Megaphone,
    fr: 'Influenceurs', en: 'Influencers',
    findRoute: '/discover?type=influencer',
    proposeRoute: '/create-org?world=digital',
    gradient: 'from-yellow-500 via-orange-500 to-pink-500',
    modules: [...BASE, 'booking', 'digitalSales', 'donations', 'aiBooks', 'aiContent', 'comments', 'events', 'reviews'],
  },
  {
    key: 'sport',
    icon: Dumbbell,
    fr: 'Sport / Coaching', en: 'Sport / Coaching',
    findRoute: '/discover?type=sport',
    proposeRoute: '/create-org?world=digital',
    gradient: 'from-lime-500 via-emerald-500 to-teal-600',
    modules: [...BASE, 'booking', 'aiContent', 'location', 'events', 'reviews'],
  },
  {
    key: 'tutors',
    icon: GraduationCap,
    fr: 'Cours & tuteurs', en: 'Tutors & teachers',
    findRoute: '/learn/discover',
    proposeRoute: '/create-org?world=education',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    modules: [...BASE, 'booking', 'digitalSales', 'aiBooks', 'aiContent', 'comments', 'location', 'events', 'reviews'],
  },
  {
    key: 'music',
    icon: Music,
    fr: 'Musique & instrumentistes', en: 'Music & instrumentists',
    findRoute: '/discover?type=music',
    proposeRoute: '/create-org?world=events',
    gradient: 'from-indigo-500 via-blue-600 to-slate-700',
    modules: [...BASE, 'booking', 'aiContent', 'location', 'events', 'reviews'],
  },
  {
    key: 'general',
    icon: Briefcase,
    fr: 'Autres services', en: 'Other services',
    findRoute: '/discover',
    proposeRoute: '/create-org',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    modules: [...BASE, 'booking', 'digitalSales', 'aiContent', 'comments', 'location', 'events', 'reviews'],
  },
];
