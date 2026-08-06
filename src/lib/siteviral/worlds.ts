/**
 * Siteviral Multiverse — canonical world definitions.
 *
 * Every workspace has ONE primary world (chosen at creation). Extra worlds can
 * be activated later from Settings → Modules without creating a new workspace.
 * The world determines: (a) default sidebar block, (b) default enabled features,
 * (c) mapping to legacy SiteviralType for existing per-vertical pages.
 */
import type { LucideIcon } from 'lucide-react';
import { Package, Sparkles, Church, Wrench, Ticket, GraduationCap, Store, Calendar, Gift, BookOpen, Users, Inbox, MapPin } from 'lucide-react';
import type { SiteviralType, SiteviralFeatureKey } from '@/types/database';

export type SiteviralWorld = 'digital' | 'beauty' | 'church' | 'home' | 'events' | 'education';

export interface WorldMeta {
  id: SiteviralWorld;
  icon: LucideIcon;
  emoji: string;
  labelFr: string; labelEn: string;
  descFr: string;  descEn: string;
  // Existing per-vertical persona this world maps to
  siteviralType: SiteviralType;
  // Legacy category value stored on organizations.category
  category: 'church' | 'leader' | 'community' | 'ngo' | 'other';
  defaultFeatures: SiteviralFeatureKey[];
}

export const WORLDS: Record<SiteviralWorld, WorldMeta> = {
  digital: {
    id: 'digital', icon: Package, emoji: '📦',
    labelFr: 'Produits digitaux', labelEn: 'Digital products',
    descFr: 'Ebooks, cours, PDFs, formations', descEn: 'Ebooks, courses, PDFs, downloads',
    siteviralType: 'digital_products', category: 'leader',
    defaultFeatures: ['digital_products', 'ai_book_creation', 'payment', 'kyc'],
  },
  beauty: {
    id: 'beauty', icon: Sparkles, emoji: '💅',
    labelFr: 'Beauté', labelEn: 'Beauty',
    descFr: 'Salons, barbiers, maquilleurs', descEn: 'Salons, barbers, makeup artists',
    siteviralType: 'beauty', category: 'leader',
    defaultFeatures: ['appointment', 'payment', 'reviews', 'location', 'kyc'],
  },
  church: {
    id: 'church', icon: Church, emoji: '⛪',
    labelFr: 'Église / ministère', labelEn: 'Church / ministry',
    descFr: 'Prédications, offrandes, événements', descEn: 'Sermons, offerings, events',
    siteviralType: 'church', category: 'church',
    defaultFeatures: ['donation_gifts', 'events', 'ai_book_creation', 'payment', 'kyc'],
  },
  home: {
    id: 'home', icon: Wrench, emoji: '🛠️',
    labelFr: 'Services à domicile', labelEn: 'Home services',
    descFr: 'Plombiers, électriciens, artisans', descEn: 'Plumbers, electricians, artisans',
    siteviralType: 'artisans_home_services', category: 'leader',
    defaultFeatures: ['appointment', 'payment', 'reviews', 'location', 'kyc'],
  },
  events: {
    id: 'events', icon: Ticket, emoji: '🎉',
    labelFr: 'Événements', labelEn: 'Events',
    descFr: 'Prestataires, packages, billetterie', descEn: 'Vendors, packages, ticketing',
    siteviralType: 'services', category: 'leader',
    defaultFeatures: ['appointment', 'events', 'payment', 'reviews', 'kyc'],
  },
  education: {
    id: 'education', icon: GraduationCap, emoji: '📚',
    labelFr: 'Éducation / tutorat', labelEn: 'Education / tutoring',
    descFr: 'Cours privés, tuteurs, formation', descEn: 'Private lessons, tutors, training',
    siteviralType: 'tutors_home_teachers', category: 'leader',
    defaultFeatures: ['appointment', 'digital_products', 'reviews', 'kyc'],
  },
};

export const ALL_WORLDS: WorldMeta[] = Object.values(WORLDS);

/** Sidebar item for the "primary world" block of the dashboard. */
export interface WorldNavItem {
  id: string;
  url: string;
  icon: LucideIcon;
  labelFr: string; labelEn: string;
}

/**
 * Default sidebar items injected for each world. These appear BELOW universal
 * items (Overview, Purchases, Explore, Revenue…) and ABOVE user-activated
 * modules from Settings → Modules.
 */
export function defaultNavForWorld(world: SiteviralWorld): WorldNavItem[] {
  switch (world) {
    case 'digital': return [
      { id: 'sell',      url: '/admin/products',  icon: Store,    labelFr: 'Vendre',                   labelEn: 'Sell' },
      { id: 'write',     url: '/ecrire',          icon: BookOpen, labelFr: 'Écrire un livre en 5 min', labelEn: 'Write a book in 5 min' },
      { id: 'offerings', url: '/admin/campaigns', icon: Gift,     labelFr: 'Dons',                     labelEn: 'Giving' },
    ];

    case 'beauty': return [
      { id: 'bookings', url: '/admin/beauty/orders',    icon: Calendar, labelFr: 'Rendez-vous', labelEn: 'Bookings' },
      { id: 'services', url: '/admin/beauty/settings',  icon: Store,    labelFr: 'Prestations', labelEn: 'Services' },
      { id: 'messages', url: '/admin/beauty/messages',  icon: Inbox,    labelFr: 'Messages',    labelEn: 'Messages' },
    ];
    case 'church': return [
      // Church platforms use the SAME dashboard as any other platform.
      // Only Giving is added on top; Team lives in Settings.
      { id: 'sell',      url: '/admin/products',   icon: Store,    labelFr: 'Vendre',                   labelEn: 'Sell' },
      { id: 'write',     url: '/ecrire',           icon: BookOpen, labelFr: 'Écrire un livre en 5 min', labelEn: 'Write a book in 5 min' },
      { id: 'offerings', url: '/admin/campaigns',  icon: Gift,     labelFr: 'Dons',                     labelEn: 'Giving' },
    ];

    case 'home': return [
      { id: 'services', url: '/admin/home/services', icon: Store,    labelFr: 'Services', labelEn: 'Services' },
      { id: 'orders',   url: '/admin/home/orders',   icon: Calendar, labelFr: 'Demandes', labelEn: 'Jobs' },
      { id: 'messages', url: '/admin/home/messages', icon: Inbox,    labelFr: 'Messages', labelEn: 'Messages' },
    ];
    case 'events': return [
      { id: 'packages', url: '/admin/events-service/packages', icon: Ticket,   labelFr: 'Packages',   labelEn: 'Packages' },
      { id: 'orders',   url: '/admin/events-service/orders',   icon: Calendar, labelFr: 'Réservations', labelEn: 'Bookings' },
      { id: 'messages', url: '/admin/events-service/messages', icon: Inbox,    labelFr: 'Messages',   labelEn: 'Messages' },
    ];
    case 'education': return [
      { id: 'subjects', url: '/admin/learn/subjects', icon: BookOpen, labelFr: 'Matières', labelEn: 'Subjects' },
      { id: 'orders',   url: '/admin/learn/orders',   icon: Calendar, labelFr: 'Séances',  labelEn: 'Sessions' },
      { id: 'messages', url: '/admin/learn/messages', icon: Inbox,    labelFr: 'Messages', labelEn: 'Messages' },
    ];
  }
}

/** Safe fallback if an org has no primary_world yet. */
export function resolveWorld(org: { primary_world?: string | null; type?: string | null; category?: string | null } | null | undefined): SiteviralWorld {
  const pw = org?.primary_world;
  if (pw && (pw in WORLDS)) return pw as SiteviralWorld;
  if (org?.type === 'church' || org?.category === 'church' || org?.category === 'ministry') return 'church';
  return 'digital';
}
