/**
 * Buyer / Looker sidebar layer.
 *
 * When a user has NO workspace, their dashboard is shaped by the world they
 * came in looking for (persisted on profiles.buyer_world, with a localStorage
 * fallback: `sv_last_vertical`). Each world gives them a small block of
 * consumer-side shortcuts that mirrors what the equivalent provider block
 * offers a pro — but from the buyer angle.
 */
import type { LucideIcon } from 'lucide-react';
import { Package, Zap, Church, Wrench, Ticket, GraduationCap, BookOpen, Heart, Calendar, Store, Gift, Users, Search } from 'lucide-react';

export type BuyerWorld = 'digital' | 'beauty' | 'church' | 'home' | 'events' | 'education' | 'other';

export interface BuyerWorldMeta {
  id: BuyerWorld;
  icon: LucideIcon;
  emoji: string;
  labelFr: string; labelEn: string;
  discoverRoute: string; // where the "Explore" tile links to
}

export const BUYER_WORLDS: Record<BuyerWorld, BuyerWorldMeta> = {
  digital:   { id: 'digital',   icon: Package,         emoji: '📦', labelFr: 'Produits digitaux', labelEn: 'Digital products', discoverRoute: '/discover?type=digital' },
  beauty:    { id: 'beauty',    icon: Zap,        emoji: '💅', labelFr: 'Beauté',            labelEn: 'Beauty',           discoverRoute: '/beauty' },
  church:    { id: 'church',    icon: Church,          emoji: '⛪', labelFr: 'Église',            labelEn: 'Church',           discoverRoute: '/church' },
  home:      { id: 'home',      icon: Wrench,          emoji: '🛠️', labelFr: 'Artisans',          labelEn: 'Artisans',         discoverRoute: '/home' },
  events:    { id: 'events',    icon: Ticket,          emoji: '🎉', labelFr: 'Événements',        labelEn: 'Events',           discoverRoute: '/events' },
  education: { id: 'education', icon: GraduationCap,   emoji: '📚', labelFr: 'Éducation',         labelEn: 'Education',        discoverRoute: '/education' },
  other:     { id: 'other',     icon: Store,           emoji: '', labelFr: 'Autres services',   labelEn: 'Other services',   discoverRoute: '/dashboard/explore' },
};

/**
 * Worlds shown as "services" in the buyer picker and Explore chip row.
 * Church is intentionally excluded — it is a separate platform, not a service
 * users browse for on the marketplace surface.
 */
export const SERVICE_WORLDS: BuyerWorld[] = ['digital', 'beauty', 'home', 'events', 'education', 'other'];

export interface BuyerNavItem {
  id: string; url: string; icon: LucideIcon;
  labelFr: string; labelEn: string;
}

/**
 * Buyer-side sidebar items per world. Kept short (3-4) so the sidebar
 * remains scannable. Every route already exists in the app.
 */
export function buyerNavForWorld(world: BuyerWorld): BuyerNavItem[] {
  const explore = (w: BuyerWorld) => `/dashboard/explore?world=${w}`;
  switch (world) {
    case 'digital': return [
      { id: 'library',   url: '/dashboard/purchases',   icon: BookOpen, labelFr: 'Ma bibliothèque', labelEn: 'My library' },
      { id: 'wishlist',  url: '/dashboard/bookmarks',   icon: Heart,    labelFr: 'Favoris',         labelEn: 'Wishlist' },
      { id: 'discover',  url: explore('digital'),       icon: Search,   labelFr: 'Découvrir',       labelEn: 'Discover' },
    ];
    case 'beauty': return [
      { id: 'appointments', url: '/dashboard/purchases',  icon: Calendar, labelFr: 'Mes rendez-vous', labelEn: 'My appointments' },
      { id: 'favorites',    url: '/dashboard/bookmarks',  icon: Heart,    labelFr: 'Salons favoris',  labelEn: 'Favorite salons' },
      { id: 'discover',     url: explore('beauty'),       icon: Search,   labelFr: 'Trouver un salon',labelEn: 'Find a salon' },
    ];
    case 'church': return [
      { id: 'church',     url: '/dashboard/purchases',   icon: Church,   labelFr: 'Mon église',      labelEn: 'My church' },
      { id: 'giving',     url: '/mes-dons',              icon: Gift,     labelFr: 'Mes dons',        labelEn: 'My giving' },
      { id: 'events',     url: explore('church'),        icon: Calendar, labelFr: 'Événements',      labelEn: 'Upcoming events' },
      { id: 'discover',   url: explore('church'),        icon: Search,   labelFr: 'Trouver une église', labelEn: 'Find a church' },
    ];
    case 'home': return [
      { id: 'bookings',   url: '/dashboard/purchases',   icon: Calendar, labelFr: 'Mes demandes',    labelEn: 'My bookings' },
      { id: 'providers',  url: '/dashboard/bookmarks',   icon: Users,    labelFr: 'Mes artisans',    labelEn: 'My artisans' },
      { id: 'discover',   url: explore('home'),          icon: Search,   labelFr: 'Trouver un artisan', labelEn: 'Find an artisan' },
    ];
    case 'events': return [
      { id: 'tickets',    url: '/dashboard/purchases',   icon: Ticket,   labelFr: 'Mes billets',     labelEn: 'My tickets' },
      { id: 'favorites',  url: '/dashboard/bookmarks',   icon: Heart,    labelFr: 'Prestataires favoris', labelEn: 'Favorite vendors' },
      { id: 'discover',   url: explore('events'),        icon: Search,   labelFr: 'Trouver un événement', labelEn: 'Find an event' },
    ];
    case 'education': return [
      { id: 'sessions',   url: '/dashboard/purchases',   icon: Calendar, labelFr: 'Mes séances',     labelEn: 'My sessions' },
      { id: 'tutors',     url: '/dashboard/bookmarks',   icon: Users,    labelFr: 'Mes tuteurs',     labelEn: 'My tutors' },
      { id: 'discover',   url: explore('education'),     icon: Search,   labelFr: 'Trouver un tuteur', labelEn: 'Find a tutor' },
    ];
    case 'other': return [
      { id: 'discover',   url: explore('other'),         icon: Search,   labelFr: 'Explorer',        labelEn: 'Explore' },
    ];
  }
}

/** Map the legacy `sv_last_vertical` localStorage value to a BuyerWorld. */
export function normalizeBuyerWorld(v: string | null | undefined): BuyerWorld | null {
  if (!v) return null;
  const k = v.toLowerCase();
  if (k === 'tutor' || k === 'learn' || k === 'education') return 'education';
  if (k === 'artisan' || k === 'home') return 'home';
  if (k === 'digital' || k === 'beauty' || k === 'church' || k === 'events' || k === 'other') return k as BuyerWorld;
  return null;
}
