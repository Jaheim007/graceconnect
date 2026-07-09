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
  Calendar, Package, Gift, BookOpen, Sparkles,
  MapPin, Ticket, Users2, LucideIcon,
} from 'lucide-react';

/**
 * Only *true add-on modules* live here — things a provider can choose to
 * activate on top of their core service (sell digital products, add AI
 * courses, sell event tickets, accept giving, etc.).
 *
 * Functionalities that are ALWAYS baked into every service are NOT modules
 * and never appear in Settings → Modules:
 *   - KYC (mandatory identity check for every provider)
 *   - Payment integration (comes with the service)
 *   - Reviews on the provider (comes with the service)
 *   - Comments on products (comes with digital products)
 *   - Orders / quotes (comes with sales)
 *
 * Affiliation is a special case: available to everyone but OFF by default —
 * the user turns it on from Settings → Modules if they want to earn by
 * referring others.
 */
export type ModuleId =
  | 'booking'
  | 'digital_products'
  | 'giving'
  | 'ai_book'
  | 'ai_content'
  | 'location'
  | 'events_tickets'
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
  route: string;
  color: string;
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
    descFr: 'Vends ebooks, formations, téléchargements.',
    descEn: 'Sell ebooks, courses, downloads.',
  },
  giving: {
    id: 'giving', icon: Gift, route: '/dashboard/giving', color: 'bg-emerald-500/10 text-emerald-600',
    labelFr: 'Dons & offrandes',  labelEn: 'Giving & donations',
    descFr: 'Campagnes, offrandes et cadeaux.',
    descEn: 'Campaigns, offerings and gifts.',
  },
  ai_book: {
    id: 'ai_book', icon: BookOpen, route: '/dashboard/ai-book', color: 'bg-orange-500/10 text-orange-600',
    labelFr: 'Livres IA',         labelEn: 'AI books',
    descFr: 'Génère livres coloriage & jeunesse.',
    descEn: 'Generate coloring and kids books.',
  },
  ai_content: {
    id: 'ai_content', icon: Sparkles, route: '/dashboard/ai-content', color: 'bg-fuchsia-500/10 text-fuchsia-600',
    labelFr: 'Contenu & formations IA', labelEn: 'AI content & courses',
    descFr: 'Sermons, articles, posts, scripts, cours.',
    descEn: 'Sermons, articles, posts, scripts, courses.',
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
  affiliation: {
    id: 'affiliation', icon: Users2, route: '/dashboard/affiliation', color: 'bg-teal-500/10 text-teal-600',
    labelFr: 'Affiliation',       labelEn: 'Affiliation',
    descFr: 'Gagne en parrainant d’autres pros. Désactivé par défaut.',
    descEn: 'Earn by referring other pros. Off by default.',
  },
};

export const ALL_MODULE_IDS = Object.keys(MODULES) as ModuleId[];

/**
 * Nothing is mandatory in the Settings → Modules list anymore.
 * KYC / payments / reviews / comments / orders are baked-in functionalities
 * of the service — not modules the user can toggle.
 */
export const MANDATORY_MODULES: ModuleId[] = [];

/**
 * All modules are optional and toggleable from Settings → Modules.
 * Persona presets pre-enable the right ones at signup.
 */
export const OPTIONAL_MODULE_IDS: ModuleId[] = [...ALL_MODULE_IDS];

export const isMandatoryModule = (_id: ModuleId) => false;

/**
 * Persona → default OPTIONAL modules pre-enabled at signup (from product matrix).
 * Affiliation is intentionally OFF by default for everyone — user activates it
 * in Settings if they want to earn by referring.
 * Reviews / comments / KYC / payments are NOT listed — they are baked-in
 * functionalities of the service, not modules.
 */
export const DEFAULT_MODULES_BY_PERSONA: Record<Persona, ModuleId[]> = {
  church:      ['booking','giving','ai_book','ai_content','location'],
  digital:     ['digital_products','giving','ai_book','ai_content'],
  coach:       ['booking','location','events_tickets'],
  home:        ['booking','location'],
  beauty:      ['booking','location'],
  tutor:       ['booking','ai_content','location'],
  musician:    ['booking','ai_content','location','events_tickets'],
  influencer:  ['booking','ai_content','events_tickets'],
  general:     ['booking','location'],
};
