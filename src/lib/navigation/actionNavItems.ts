import {
  BookOpen, Store, Compass, Package, LayoutDashboard, Network,
  Building2, Shield, Calendar, Megaphone, HandCoins, Wallet,
  Scissors, Search, ClipboardList, GraduationCap, Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SiteviralFeatureKey } from '@/types/database';
import type { BuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';
import {
  asLucide, unifyNavIcon, SvHome, SvLibrary, SvEarn, SvPencil, SvWallet, SvLesson, SvAdmin, SvSell, SvExplore,
} from '@/components/icons/nav-icons';

export interface ActionNavItem {
  id: string;
  icon: LucideIcon;
  emoji: string;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  route: string;
  borderClass: string;
  iconBg: string;
  iconColor: string;
  /** Optional SiteViral feature gate. Only hidden when the org has a confirmed
   *  type AND the key is not in enabled_features. Never hidden otherwise. */
  featureKey?: SiteviralFeatureKey;
}

interface NavContext {
  isAuthenticated: boolean;
  hasPurchases: boolean;
  hasManageableOrg: boolean;
  hasOrgs: boolean;
  isSuperadmin: boolean;
  /** Buyer interests picked on /looking-for — used to shape the sidebar
   *  with vertical-specific shortcuts (appointments, bookings, sessions…). */
  interests?: BuyerWorld[];
}

/** Per-interest extra nav items appended to buyer sidebars. */
function interestNavItems(interest: BuyerWorld, isFr: boolean): ActionNavItem[] {
  switch (interest) {
    case 'beauty':
      return [{
        id: 'beauty-appointments',
        icon: Calendar, emoji: '📅',
        titleFr: 'Mes rendez-vous', titleEn: 'My appointments',
        descFr: 'Mes rendez-vous beauté', descEn: 'My beauty appointments',
        route: '/beauty/bookings',
        borderClass: 'border-border hover:border-primary/40',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
      }];
    case 'home':
      return [{
        id: 'home-requests',
        icon: ClipboardList, emoji: '🛠️',
        titleFr: 'Mes demandes', titleEn: 'My requests',
        descFr: 'Interventions et devis', descEn: 'Requests & quotes',
        route: '/home',
        borderClass: 'border-border hover:border-primary/40',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
      }];
    case 'events':
      return [{
        id: 'events-bookings',
        icon: Ticket, emoji: '🎉',
        titleFr: 'Mes réservations', titleEn: 'My bookings',
        descFr: 'Prestataires événements', descEn: 'Event vendors',
        route: '/events',
        borderClass: 'border-border hover:border-primary/40',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
      }];
    case 'education':
      return [{
        id: 'education-sessions',
        icon: GraduationCap, emoji: '🎓',
        titleFr: 'Mes séances', titleEn: 'My sessions',
        descFr: 'Cours et tuteurs', descEn: 'Classes & tutors',
        route: '/education',
        borderClass: 'border-border hover:border-primary/40',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
      }];
    default:
      return [];
  }
}

/**
 * Returns the list of ActionHub nav items based on user context.
 * Routes must be resolved by the caller when they depend on org state.
 */
export function getActionNavItems(
  ctx: NavContext,
  resolveRoute?: (id: string) => string
): ActionNavItem[] {
  const r = (id: string, fallback: string) => resolveRoute?.(id) ?? fallback;

  const items: ActionNavItem[] = [];

  if (ctx.isAuthenticated) {
    items.push({
      id: 'overview',
      icon: asLucide(SvHome),
      emoji: '📊',
      titleFr: 'Mon tableau de bord',
      titleEn: 'My dashboard',
      descFr: 'Vue d’ensemble de mon activité',
      descEn: 'Overview of my activity',

      route: '/dashboard',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    });

    items.push({
      id: 'purchases',
      icon: asLucide(SvLibrary),
      emoji: '📚',
      titleFr: 'Ma bibliothèque',
      titleEn: 'My library',
      descFr: 'Accéder à mes livres et ressources',
      descEn: 'Access my books and resources',
      route: '/my-purchases',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    });

    // "Create platform" now lives in the profile menu — keeps the buyer
    // sidebar focused on: Overview · My purchases · Explorer · Earn.
  }

  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    items.push({
      id: 'sell',
      icon: asLucide(SvSell),
      emoji: '🛒',
      titleFr: 'Vendre',
      titleEn: 'Sell',
      descFr: 'Vends tes livres, formations et plus',
      descEn: 'Sell your books, courses & more',
      route: r('sell', '/admin/products'),
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      featureKey: 'digital_products',
    });
  }

  if (ctx.isAuthenticated) {
    items.push({
      id: 'write',
      icon: asLucide(SvPencil),
      emoji: '✏️',
      titleFr: 'Écrire un livre en 5 min',
      titleEn: 'Write a book in 5 min',
      descFr: "Crée ton livre avec l'IA et vends-le",
      descEn: 'Create your book with AI and sell it',
      route: '/ecrire',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      featureKey: 'ai_book_creation',
    });
  }

  if (ctx.isAuthenticated) {
    items.push({
      id: 'course',
      icon: asLucide(SvLesson),
      emoji: '🎓',
      titleFr: 'Créer une formation',
      titleEn: 'Create a formation',
      descFr: "Modules, leçons et certificats avec l'IA",
      descEn: 'Modules, lessons and certificates with AI',
      route: r('course', '/creer-formation'),
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      featureKey: 'ai_formation_creation',
    });
  }

  // (Removed) Promotion is not a top-level nav item — it lives inside Sell.


  // Explorer — buyers land in the in-dashboard explorer (mixed feed by interest);
  // sellers keep the marketing /discover surface.
  items.push({
    id: 'discover',
    icon: asLucide(SvExplore),
    emoji: '🔍',
    titleFr: 'Explorer',
    titleEn: 'Explore',
    descFr: 'Voir et acheter des livres, formations et plus',
    descEn: 'Browse & buy books, courses & more',
    route: ctx.hasManageableOrg ? '/discover' : '/dashboard/explore',
    borderClass: 'border-border hover:border-primary/40',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  });

  // Buyer interest-driven items — appended right after Explorer so buyers see
  // vertical-specific shortcuts (appointments, bookings, sessions, requests).
  if (showServiceSurfaces() && ctx.isAuthenticated && !ctx.hasManageableOrg && ctx.interests?.length) {
    const seen = new Set<string>();
    for (const w of ctx.interests) {
      for (const it of interestNavItems(w, false)) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        items.push(it);
      }
    }
  }

  if (ctx.isAuthenticated) {
    items.push({
      id: 'earn',
      icon: asLucide(SvEarn),
      emoji: '💰',
      titleFr: 'Gagner',
      titleEn: 'Earn',
      descFr: 'Gagner en partageant les offres SiteViral',
      descEn: 'Earn by sharing SiteViral offers',
      route: '/gagner',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      featureKey: 'affiliation',
    });
    // Affiliate Cloud is in private beta — superadmins only while we validate it.
    if (ctx.isSuperadmin) {
      items.push({
        id: 'affiliation',
        icon: Network,
        emoji: '🔗',
        titleFr: 'Parrainage',
        titleEn: 'Affiliate',
        descFr: 'Programme de parrainage pour votre plateforme (bêta)',
        descEn: 'Referral program for your own platform (beta)',
        route: '/affiliation',
        borderClass: 'border-border hover:border-primary/40',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
      });
    }
  }

  // Revenue is a seller concept — buyers see their commissions under "Earn".
  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    items.push({
      id: 'sales',
      icon: asLucide(SvWallet),
      emoji: '💵',
      titleFr: 'Revenus',
      titleEn: 'Revenue',
      descFr: 'Ventes, dons reçus, commissions et retraits',
      descEn: 'Sales, donations, commissions & payouts',
      route: '/admin/sales',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    });
  }


  if (ctx.isSuperadmin) {
    items.push({
      id: 'superadmin',
      icon: asLucide(SvAdmin),
      emoji: '🛡️',
      titleFr: 'Super Admin',
      titleEn: 'Super Admin',
      descFr: 'Gérer la plateforme',
      descEn: 'Manage the platform',
      route: '/superadmin',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    });
  }

  return items.map((it) => ({ ...it, icon: unifyNavIcon(it.icon) }));
}

/**
 * Beauty vertical nav items — used when the user is inside /beauty/*.
 * The bottom nav swaps to this set so the app feels like a dedicated Beauty app.
 */
export function getBeautyNavItems(ctx: NavContext): ActionNavItem[] {
  const items: ActionNavItem[] = [];

  if (ctx.isAuthenticated) {
    items.push({
      id: 'beauty-bookings',
      icon: Calendar,
      emoji: '📅',
      titleFr: 'Mes rendez-vous',
      titleEn: 'My appointments',
      descFr: 'Mes rendez-vous beauté',
      descEn: 'My beauty appointments',
      route: '/beauty/bookings',
      borderClass: 'border-border hover:border-primary/40',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    });
  }

  items.push({
    id: 'beauty-search',
    icon: Search,
    emoji: '🔎',
    titleFr: 'Explorer',
    titleEn: 'Explore',
    descFr: 'Trouver un expert beauté',
    descEn: 'Find a beauty expert',
    route: '/beauty/search',
    borderClass: 'border-border hover:border-primary/40',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  });

  // Messages intentionally NOT in bottom nav — accessed via avatar menu / RDV details.


  items.push({
    id: 'beauty-pro',
    icon: Scissors,
    emoji: '💇🏾',
    titleFr: 'Proposer mes services',
    titleEn: 'Offer my services',
    descFr: 'Créer mon profil et recevoir des clients',
    descEn: 'Create my profile and get clients',
    route: '/beauty/pro/onboarding',
    borderClass: 'border-border hover:border-primary/40',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  });

  return items.map((it) => ({ ...it, icon: unifyNavIcon(it.icon) }));
}

