import {
  BookOpen, Store, Package, Calendar, Gift,
  Ticket, LayoutDashboard, Inbox, Users, Megaphone, Compass, HandCoins, Wallet,
  Settings, GraduationCap, MessageSquare,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import type { ActionNavItem } from './actionNavItems';

interface Ctx {
  isAuthenticated: boolean;
  hasPurchases: boolean;
  hasManageableOrg: boolean;
  hasOrgs: boolean;
  isSuperadmin: boolean;
}

/**
 * Per-vertical bookings/orders dashboard route.
 * Routes stay inside the regular blue dashboard/admin shell so the sidebar
 * remains visible and the page doesn't hijack the whole viewport.
 */
function bookingRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'beauty':                 return '/admin/beauty/orders';
    case 'artisans_home_services': return '/admin/home/orders';
    case 'tutors_home_teachers':   return '/admin/learn/orders';
    case 'church':                 return '/admin/church/appointments';
    case 'instrumentists':
    case 'services':
    case 'sport':
    case 'influencers':            return '/admin/events-service/orders';
    default:                       return '/admin';
  }
}

/**
 * Per-vertical revenue route (always inside the pro shell).
 */
function revenueRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'beauty':                 return '/admin/beauty/revenue';
    case 'artisans_home_services': return '/admin/home/revenue';
    case 'tutors_home_teachers':   return '/admin/learn/revenue';
    case 'instrumentists':
    case 'services':
    case 'influencers':            return '/admin/events-service/revenue';
    default:                       return '/admin/sales';
  }
}

/**
 * Per-vertical inbox route — pinned to the pro shell so opening Messages
 * keeps the dashboard visible instead of full-page hijacking.
 */
function messagesRouteFor(type: SiteviralType | null | undefined): string | null {
  switch (type) {
    case 'beauty':                 return '/admin/beauty/messages';
    case 'artisans_home_services': return '/admin/home/messages';
    case 'tutors_home_teachers':   return '/admin/learn/messages';
    case 'instrumentists':
    case 'services':
    case 'sport':
    case 'influencers':            return '/admin/events-service/messages';
    default:                       return null;
  }
}


interface Spec {
  id: string;
  icon: LucideIcon;
  titleFr: string; titleEn: string;
  descFr: string; descEn: string;
  route: string;
  tone: 'primary' | 'sky' | 'amber' | 'emerald' | 'violet' | 'pink' | 'blue'
      | 'fuchsia' | 'cyan' | 'indigo' | 'yellow' | 'teal';
}

const TONE: Record<Spec['tone'], { border: string; iconBg: string; iconColor: string }> = {
  primary:  { border: 'border-primary/30 hover:border-primary/60',           iconBg: 'bg-primary/12',           iconColor: 'text-primary' },
  sky:      { border: 'border-sky-500/30 hover:border-sky-500/60',           iconBg: 'bg-sky-500/12',           iconColor: 'text-sky-500' },
  amber:    { border: 'border-amber-500/30 hover:border-amber-500/60',       iconBg: 'bg-amber-500/12',         iconColor: 'text-amber-500' },
  emerald:  { border: 'border-emerald-500/30 hover:border-emerald-500/60',   iconBg: 'bg-emerald-500/12',       iconColor: 'text-emerald-500' },
  violet:   { border: 'border-violet-500/30 hover:border-violet-500/60',     iconBg: 'bg-violet-500/12',        iconColor: 'text-violet-500' },
  pink:     { border: 'border-pink-500/30 hover:border-pink-500/60',         iconBg: 'bg-pink-500/12',          iconColor: 'text-pink-500' },
  blue:     { border: 'border-blue-500/30 hover:border-blue-500/60',         iconBg: 'bg-blue-500/12',          iconColor: 'text-blue-500' },
  fuchsia:  { border: 'border-fuchsia-500/30 hover:border-fuchsia-500/60',   iconBg: 'bg-fuchsia-500/12',       iconColor: 'text-fuchsia-500' },
  cyan:     { border: 'border-cyan-500/30 hover:border-cyan-500/60',         iconBg: 'bg-cyan-500/12',          iconColor: 'text-cyan-500' },
  indigo:   { border: 'border-indigo-500/30 hover:border-indigo-500/60',     iconBg: 'bg-indigo-500/12',        iconColor: 'text-indigo-500' },
  yellow:   { border: 'border-yellow-500/30 hover:border-yellow-500/60',     iconBg: 'bg-yellow-500/12',        iconColor: 'text-yellow-500' },
  teal:     { border: 'border-teal-500/30 hover:border-teal-500/60',         iconBg: 'bg-teal-500/12',          iconColor: 'text-teal-500' },
};

function toItem(s: Spec): ActionNavItem {
  const t = TONE[s.tone];
  return {
    id: s.id, icon: s.icon, emoji: '',
    titleFr: s.titleFr, titleEn: s.titleEn,
    descFr: s.descFr, descEn: s.descEn,
    route: s.route,
    borderClass: t.border, iconBg: t.iconBg, iconColor: t.iconColor,
  };
}

/**
 * Map a functional feature key to a nav item.
 *
 * Excluded on purpose (Settings-only, never in nav):
 *   - kyc         → identity verification, handled in Settings + popup
 *   - payment     → payment integration, handled in Settings
 *   - location    → service area / map, handled in Settings
 */
function specFor(
  key: SiteviralFeatureKey,
  hasManageableOrg: boolean,
  type: SiteviralType | null | undefined,
): Spec | null {
  switch (key) {
    case 'appointment': return {
      id: 'booking', icon: Calendar, tone: 'pink',
      titleFr: 'Rendez-vous', titleEn: 'Bookings',
      descFr: 'Agenda et réservations', descEn: 'Calendar & bookings',
      route: bookingRouteFor(type),
    };
    case 'digital_products': return {
      id: 'sell', icon: Store, tone: 'amber',
      titleFr: 'Vendre', titleEn: 'Sell',
      descFr: 'Publie et monétise', descEn: 'Publish & monetize',
      route: hasManageableOrg ? '/admin/products' : '/create-org',
    };
    case 'donation_gifts': return {
      id: 'giving', icon: Gift, tone: 'emerald',
      titleFr: 'Dons', titleEn: 'Giving',
      descFr: 'Campagnes et cadeaux', descEn: 'Campaigns & gifts',
      route: type === 'church' ? '/admin/church/giving' : '/admin/campaigns',
    };
    case 'ai_book_creation': return {
      id: 'write', icon: BookOpen, tone: 'primary',
      titleFr: type === 'church' ? 'Livres & prédications' : 'Écrire un livre en 5 min',
      titleEn: type === 'church' ? 'Books & sermons' : 'Write a book in 5 min',
      descFr: type === 'church' ? 'Audio, livre et PDF' : "Ton livre avec l'IA",
      descEn: type === 'church' ? 'Audio, book & PDF' : 'Your book with AI',
      route: type === 'church' ? '/admin/church/sermons' : '/ecrire',
    };
    case 'events': return {
      id: 'events', icon: Ticket, tone: 'indigo',
      titleFr: 'Événements', titleEn: 'Events',
      descFr: 'Billets et invitations', descEn: 'Tickets & invites',
      route: type === 'church' ? '/admin/church/events' : '/admin/events',
    };
    case 'ai_formation_creation': return {
      id: 'create-course', icon: GraduationCap, tone: 'violet',
      titleFr: 'Créer une formation', titleEn: 'Create a course',
      descFr: "Ton cours avec l'IA", descEn: 'Your course with AI',
      route: '/admin/programs',
    };
    case 'product_comments': return {
      id: 'product-comments', icon: MessageSquare, tone: 'cyan',
      titleFr: 'Commentaires produits', titleEn: 'Product comments',
      descFr: 'Modération et réponses', descEn: 'Moderate & reply',
      route: '/admin/comments',
    };
    // Optional/extra tools stay in Settings → Modules until activated for a
    // focused dashboard: order generator, reviews.
    case 'order_generator':
    case 'reviews':
    // Platform config — never in nav
    case 'affiliation':
    case 'kyc':
    case 'payment':
    case 'location':
      return null;
  }
  return null;
}

/**
 * Nav display order — operational tools first, then growth/earn.
 *
 * NOT in top-level nav (per product decision):
 *   - reviews            → surfaced inside CRM / client detail, not its own tab
 *   - ai_formation_creation → optional module, activate from Settings → Modules
 *   - kyc / payment / location → Settings only
 */
const ORDER: SiteviralFeatureKey[] = [
  'appointment',
  'digital_products',
  'donation_gifts',
  'events',
  'ai_book_creation',
];

/**
 * Builds a strictly matrix-driven nav list for a confirmed SiteViral type.
 * Returns null when the caller should fall back to the generic digital nav.
 *
 * Rules (per user directive):
 *   - Show ONLY the operational features enabled for this vertical.
 *   - Add a per-vertical Messages inbox for service verticals (artisan,
 *     beauty, tutors, events) — clients need to be able to contact the pro.
 *   - Reviews / AI courses are NOT in top nav — they live in Settings → Modules.
 *   - KYC / Payment integration / Location go to Settings, never in nav.
 *   - "Discover" and "My workspace" are NOT appended for confirmed providers —
 *     they're already inside their workspace.
 *   - Revenue tile appended when the org can manage sales.
 */
export function buildFeatureNavItems(
  ctx: Ctx,
  enabled: SiteviralFeatureKey[],
  type: SiteviralType | null | undefined,
): ActionNavItem[] | null {
  if (!type || enabled.length === 0) return null;

  const items: ActionNavItem[] = [];
  const pushUnique = (spec: Spec) => {
    if (!items.some((item) => item.id === spec.id || item.route === spec.route)) {
      items.push(toItem(spec));
    }
  };

  pushUnique({
    id: 'dashboard', icon: LayoutDashboard, tone: 'primary',
    titleFr: 'Aperçu', titleEn: 'Overview',
    descFr: 'Tableau de bord', descEn: 'Dashboard',
    route: '/admin',
  });

  // (Removed) My Purchases — this is an ACCOUNT-level destination, not a
  // workspace-management module. Users reach it from the TopBar avatar menu.


  const navKeysForType: Partial<Record<SiteviralType, SiteviralFeatureKey[]>> = {
    // Digital sellers: Sell + book + course + product comments (each
    // gated by enabled_features). Events & donations are hidden here even
    // if legacy flags exist, because they belong to church/other workspaces.
    digital_products: ['digital_products', 'ai_book_creation', 'ai_formation_creation', 'product_comments'],
    church: ['digital_products', 'donation_gifts', 'events', 'ai_book_creation'],
  };
  const visibleOrder = navKeysForType[type] ?? ORDER;

  // Matrix-driven operational tools
  for (const key of visibleOrder) {
    if (!enabled.includes(key)) continue;
    const spec = specFor(key, ctx.hasManageableOrg, type);
    if (spec) pushUnique(spec);
  }

  // Vertical-native management items that used to live in disconnected pro sidebars.
  // They now appear in the same blue dashboard sidebar.
  switch (type) {
    case 'digital_products':
      // "Create a course" is a first-class flow for digital sellers, always
      // available regardless of feature-flag detail (route resolves at click).
      pushUnique({
        id: 'create-course', icon: GraduationCap, tone: 'violet',
        titleFr: 'Créer une formation', titleEn: 'Create a course',
        descFr: "Ton cours avec l'IA", descEn: 'Your course with AI',
        route: '/admin/programs',
      });
      break;
    case 'church':
      // Primary church modules ONLY. Optional modules (CRM, Prayer, Campaigns,
      // Appointments, Announcements) are activated by the user from
      // Settings → Modules and surface via the matrix flow above.
      pushUnique({ id: 'sermons', icon: BookOpen, tone: 'primary', titleFr: 'Livres & prédications', titleEn: 'Books & sermons', descFr: 'Audio, livre et PDF', descEn: 'Audio, book & PDF', route: '/admin/church/sermons' });
      pushUnique({ id: 'team', icon: Users, tone: 'teal', titleFr: 'Équipe', titleEn: 'Team', descFr: 'Co-administrateurs', descEn: 'Co-admins', route: '/admin/church/team' });
      break;
    case 'artisans_home_services':
      pushUnique({ id: 'services', icon: Store, tone: 'sky', titleFr: 'Services', titleEn: 'Services', descFr: 'Prestations et tarifs', descEn: 'Services & pricing', route: '/admin/home/services' });
      break;
    case 'beauty':
      pushUnique({ id: 'beauty-services', icon: Store, tone: 'pink', titleFr: 'Prestations', titleEn: 'Services', descFr: 'Prestations et tarifs', descEn: 'Services & pricing', route: '/admin/beauty/settings' });
      break;
    case 'tutors_home_teachers':
      pushUnique({ id: 'subjects', icon: BookOpen, tone: 'teal', titleFr: 'Matières', titleEn: 'Subjects', descFr: 'Niveaux et tarifs', descEn: 'Levels & pricing', route: '/admin/learn/subjects' });
      break;
    case 'instrumentists':
    case 'services':
    case 'sport':
    case 'influencers':
      pushUnique({ id: 'packages', icon: Ticket, tone: 'fuchsia', titleFr: 'Packages', titleEn: 'Packages', descFr: 'Offres et tarifs', descEn: 'Offers & pricing', route: '/admin/events-service/packages' });
      break;
  }

  // Messages — service verticals need an inbox so clients can reach them.
  const msgRoute = messagesRouteFor(type);
  if (msgRoute && ctx.isAuthenticated) {
    pushUnique({
      id: 'messages', icon: Inbox, tone: 'cyan',
      titleFr: 'Messages', titleEn: 'Messages',
      descFr: 'Contacts et demandes clients', descEn: 'Client contacts & requests',
      route: msgRoute,
    });
  }

  // (Removed from workspace sidebar) Promotion, Explore, Claim/Earn.
  //   - Promotion → lives inside Sell (Products → Promotions) when needed.
  //   - Explore   → account-level, accessed from the TopBar.
  //   - Earn      → account-level, always at /gagner, accessed from avatar menu.


  // Revenue — every provider needs to see their money
  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    pushUnique({
      id: 'revenue', icon: Wallet, tone: 'teal',
      titleFr: 'Revenus', titleEn: 'Revenue',
      descFr: 'Ventes et retraits', descEn: 'Sales & payouts',
      route: revenueRouteFor(type),
    });
  }

  pushUnique({
    id: 'settings', icon: Settings, tone: 'amber',
    titleFr: 'Paramètres', titleEn: 'Settings',
    descFr: 'Profil, paiement et modules', descEn: 'Profile, payout & modules',
    route: '/admin/settings',
  });

  return items;
}
