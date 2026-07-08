/**
 * Unified Dashboard — module registry.
 *
 * Each user has `profiles.enabled_modules text[]`. The sidebar and dashboard
 * home only show modules present in that list. Every module maps to a route
 * under /dashboard/* and (usually) wraps an existing per-vertical screen so
 * nothing built for beauty / home / events / learn / church / digital is lost.
 *
 * Persona presets (matrix from product spec) live in DEFAULT_MODULES_BY_PERSONA
 * and are used at signup to pre-enable the right modules for the vertical the
 * user came in through.
 */
import {
  Calendar, Package, Receipt, Gift, CreditCard, BookOpen, Sparkles,
  MessageSquare, MapPin, Ticket, Star, ShieldCheck, Users2, LucideIcon,
} from 'lucide-react';

export type ModuleId =
  | 'booking'
  | 'digital_products'
  | 'orders'
  | 'giving'
  | 'payments'
  | 'ai_book'
  | 'ai_content'
  | 'comments'
  | 'location'
  | 'events_tickets'
  | 'reviews'
  | 'kyc'
  | 'affiliation';

export type Persona =
  | 'church'
  | 'digital'
  | 'coach'
  | 'home'
  | 'beauty'
  | 'tutor'
  | 'musician'
  | 'influencer'
  | 'general';

export interface DashboardModule {
  id: ModuleId;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  icon: LucideIcon;
  route: string;              // path under /dashboard
  color: string;              // tailwind bg-* for card accent
}

export const MODULES: Record<ModuleId, DashboardModule> = {
  booking: {
    id: 'booking', icon: Calendar, route: '/dashboard/booking', color: 'bg-pink-500/10 text-pink-600',
    labelFr: 'Rendez-vous',      labelEn: 'Bookings',
    descFr: 'Agenda, réservations et disponibilités.',
    descEn: 'Calendar, bookings and availability.',
  },
  digital_products: {
    id: 'digital_products', icon: Package, route: '/dashboard/digital', color: 'bg-violet-500/10 text-violet-600',
    labelFr: 'Produits digitaux', labelEn: 'Digital products',
    descFr: 'Ebooks, formations, téléchargements.',
    descEn: 'Ebooks, courses, downloads.',
  },
  orders: {
    id: 'orders', icon: Receipt, route: '/dashboard/orders', color: 'bg-blue-500/10 text-blue-600',
    labelFr: 'Commandes & devis', labelEn: 'Orders & quotes',
    descFr: 'Génère et suis toutes tes commandes.',
    descEn: 'Generate and track all your orders.',
  },
  giving: {
    id: 'giving', icon: Gift, route: '/dashboard/giving', color: 'bg-emerald-500/10 text-emerald-600',
    labelFr: 'Dons & offrandes',  labelEn: 'Giving & donations',
    descFr: 'Campagnes, offrandes et cadeaux.',
    descEn: 'Campaigns, offerings and gifts.',
  },
  payments: {
    id: 'payments', icon: CreditCard, route: '/dashboard/payments', color: 'bg-amber-500/10 text-amber-600',
    labelFr: 'Paiements',         labelEn: 'Payments',
    descFr: 'Mobile Money, virements, payouts.',
    descEn: 'Mobile Money, transfers, payouts.',
  },
  ai_book: {
    id: 'ai_book', icon: BookOpen, route: '/dashboard/ai-book', color: 'bg-orange-500/10 text-orange-600',
    labelFr: 'Livres IA',         labelEn: 'AI books',
    descFr: 'Génère livres coloriage & jeunesse.',
    descEn: 'Generate coloring and kids books.',
  },
  ai_content: {
    id: 'ai_content', icon: Sparkles, route: '/dashboard/ai-content', color: 'bg-fuchsia-500/10 text-fuchsia-600',
    labelFr: 'Contenu IA',        labelEn: 'AI content',
    descFr: 'Sermons, articles, posts, scripts.',
    descEn: 'Sermons, articles, posts, scripts.',
  },
  comments: {
    id: 'comments', icon: MessageSquare, route: '/dashboard/comments', color: 'bg-cyan-500/10 text-cyan-600',
    labelFr: 'Commentaires',      labelEn: 'Comments',
    descFr: 'Modère les avis sur tes produits.',
    descEn: 'Moderate reviews on your products.',
  },
  location: {
    id: 'location', icon: MapPin, route: '/dashboard/location', color: 'bg-red-500/10 text-red-600',
    labelFr: 'Zone & carte',      labelEn: 'Location & map',
    descFr: 'Zone d’intervention, adresse.',
    descEn: 'Service area, address.',
  },
  events_tickets: {
    id: 'events_tickets', icon: Ticket, route: '/dashboard/events', color: 'bg-indigo-500/10 text-indigo-600',
    labelFr: 'Événements & billets', labelEn: 'Events & tickets',
    descFr: 'Crée événements et vends billets.',
    descEn: 'Create events and sell tickets.',
  },
  reviews: {
    id: 'reviews', icon: Star, route: '/dashboard/reviews', color: 'bg-yellow-500/10 text-yellow-600',
    labelFr: 'Avis clients',      labelEn: 'Reviews',
    descFr: 'Note et retours de tes clients.',
    descEn: 'Ratings and feedback from clients.',
  },
  kyc: {
    id: 'kyc', icon: ShieldCheck, route: '/dashboard/kyc', color: 'bg-slate-500/10 text-slate-600',
    labelFr: 'Vérification (KYC)', labelEn: 'Verification (KYC)',
    descFr: 'Vérifie ton identité pour être payé.',
    descEn: 'Verify your identity to get paid.',
  },
  affiliation: {
    id: 'affiliation', icon: Users2, route: '/dashboard/affiliation', color: 'bg-teal-500/10 text-teal-600',
    labelFr: 'Affiliation',       labelEn: 'Affiliation',
    descFr: 'Gagne en parrainant d’autres pros.',
    descEn: 'Earn by referring other pros.',
  },
};

export const ALL_MODULE_IDS = Object.keys(MODULES) as ModuleId[];

/**
 * Persona → default enabled modules (from the product matrix).
 * ✅ = enabled by default. ◐ optional modules are NOT enabled by default;
 * the user can flip them on in Settings → Modules later.
 */
export const DEFAULT_MODULES_BY_PERSONA: Record<Persona, ModuleId[]> = {
  church:      ['booking','giving','payments','ai_book','ai_content','comments','location','reviews','kyc','affiliation'],
  digital:     ['digital_products','orders','giving','payments','ai_book','ai_content','comments','kyc','affiliation'],
  coach:       ['booking','orders','payments','location','events_tickets','reviews','kyc','affiliation'],
  home:        ['booking','orders','payments','location','reviews','kyc','affiliation'],
  beauty:      ['booking','orders','payments','location','reviews','kyc','affiliation'],
  tutor:       ['booking','orders','payments','ai_content','location','reviews','kyc','affiliation'],
  musician:    ['booking','orders','payments','ai_content','location','events_tickets','reviews','kyc','affiliation'],
  influencer:  ['booking','orders','payments','ai_content','events_tickets','reviews','kyc','affiliation'],
  general:     ['booking','orders','payments','location','reviews','kyc','affiliation'],
};
