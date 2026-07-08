import type { SiteviralType, SiteviralFeatureKey } from '@/types/database';

/**
 * Adaptive Public Page — config-driven presentation (Option A).
 *
 * Controls how the canonical OrgPublicPage renders depending on siteviral_type:
 *   1. heroCTAs      — up to 3 buttons under the header (localized FR/EN)
 *   2. sectionOrder  — default order of home-page sections for that type
 *                      (still overridden by pageSettings.section_order when set)
 *   3. emptyPrompts  — owner-only setup CTA per feature key, contextualized
 *                      to the type ("Configurer les rendez-vous beauté", etc.)
 *
 * A CTA is only rendered when its gating feature is enabled AND (for visitors)
 * the section is ready. Owners always see all configured CTAs; unready ones
 * are labelled as setup prompts instead of visitor actions.
 */

export type HeroCtaKind =
  | 'appointments'
  | 'services'
  | 'store'
  | 'programs'
  | 'events'
  | 'reviews'
  | 'location'
  | 'donate'
  | 'offerings'
  | 'order'
  | 'affiliation'
  | 'contact';

export interface HeroCta {
  kind: HeroCtaKind;
  /** Target tab on the public page ('home' | 'store' | 'donate' | ... ) or absolute path. */
  target: string;
  /** Optional feature that must be enabled for this CTA to show. */
  requiresFeature?: SiteviralFeatureKey;
  labelFr: string;
  labelEn: string;
  /** 'primary' → filled, 'secondary' → outline. */
  variant?: 'primary' | 'secondary';
  icon?: string; // lucide icon name (rendered by the page)
}

export interface TypePresentation {
  /** Ordered CTAs shown in the hero. First one is primary. */
  heroCTAs: HeroCta[];
  /** Default section order for the home tab. */
  sectionOrder: string[];
  /** Owner-only empty-state prompts by feature key. */
  emptyPrompts: Partial<Record<SiteviralFeatureKey, { fr: string; en: string; route: string }>>;
  /** Short one-liner shown as a hero subtitle when no description is set. */
  taglineFr?: string;
  taglineEn?: string;
}

/** Fallback used when siteviral_type is null/unknown. */
export const DEFAULT_PRESENTATION: TypePresentation = {
  heroCTAs: [
    { kind: 'store', target: 'store', requiresFeature: 'digital_products', labelFr: 'Voir la boutique', labelEn: 'View store', variant: 'primary', icon: 'ShoppingBag' },
    { kind: 'contact', target: 'home', labelFr: 'Nous contacter', labelEn: 'Contact us', variant: 'secondary', icon: 'MessageSquare' },
  ],
  sectionOrder: ['products', 'offerings', 'campaigns', 'content', 'programs', 'photos', 'events'],
  emptyPrompts: {},
};

export const TYPE_PRESENTATION: Record<SiteviralType, TypePresentation> = {
  church: {
    heroCTAs: [
      { kind: 'donate',     target: 'donate',   requiresFeature: 'donation_gifts',        labelFr: 'Donner',                labelEn: 'Give',              variant: 'primary',   icon: 'Heart' },
      { kind: 'events',     target: 'events',   requiresFeature: 'events',                labelFr: 'Voir les événements',   labelEn: 'View events',       variant: 'secondary', icon: 'CalendarDays' },
      { kind: 'programs',   target: 'programs', requiresFeature: 'ai_formation_creation', labelFr: 'Voir les enseignements', labelEn: 'View teachings',   variant: 'secondary', icon: 'GraduationCap' },
    ],
    sectionOrder: ['campaigns', 'offerings', 'products', 'programs', 'events', 'content', 'photos'],
    emptyPrompts: {
      donation_gifts:        { fr: 'Créer une campagne de dons',       en: 'Create a donation campaign',   route: '/admin/campaigns/new' },
      digital_products:      { fr: 'Ajouter un enseignement à vendre', en: 'Add a teaching to sell',       route: '/admin/products/new'   },
      events:                { fr: 'Créer un premier événement',       en: 'Create your first event',      route: '/admin/events/new'     },
      ai_formation_creation: { fr: 'Créer une première formation',     en: 'Create your first program',    route: '/admin/programs/new'   },
      location:              { fr: 'Renseigner l\'adresse de l\'église', en: 'Add the church address',     route: '/admin/settings'       },
    },
    taglineFr: 'Église connectée · dons, événements, enseignements',
    taglineEn: 'Connected church · giving, events, teachings',
  },

  beauty: {
    heroCTAs: [
      { kind: 'appointments', target: 'home',   requiresFeature: 'appointment',       labelFr: 'Réserver',        labelEn: 'Book now',      variant: 'primary',   icon: 'CalendarClock' },
      { kind: 'services',     target: 'store',  requiresFeature: 'digital_products',  labelFr: 'Voir services',   labelEn: 'View services', variant: 'secondary', icon: 'ShoppingBag' },
      { kind: 'reviews',      target: 'home',   requiresFeature: 'reviews',           labelFr: 'Voir les avis',   labelEn: 'See reviews',   variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['products', 'photos', 'content', 'events', 'campaigns', 'offerings', 'programs'],
    emptyPrompts: {
      appointment:      { fr: 'Configurer les rendez-vous',        en: 'Configure appointments',        route: '/admin/settings'      },
      digital_products: { fr: 'Ajouter un premier service / produit', en: 'Add your first service / product', route: '/admin/products/new' },
      reviews:          { fr: 'Inviter un premier client à noter',  en: 'Invite your first client review', route: '/admin/settings'      },
      location:         { fr: 'Renseigner votre localisation',      en: 'Add your location',              route: '/admin/settings'      },
    },
    taglineFr: 'Beauté · rendez-vous, services, avis vérifiés',
    taglineEn: 'Beauty · appointments, services, verified reviews',
  },

  digital_products: {
    heroCTAs: [
      { kind: 'store',    target: 'store',    requiresFeature: 'digital_products',       labelFr: 'Voir la boutique',              labelEn: 'View store',              variant: 'primary',   icon: 'ShoppingBag' },
      { kind: 'programs', target: 'programs', requiresFeature: 'ai_formation_creation',  labelFr: 'Voir formations',               labelEn: 'View formations',         variant: 'secondary', icon: 'GraduationCap' },
      { kind: 'events',   target: 'events',   requiresFeature: 'events',                 labelFr: 'Voir événements',               labelEn: 'View events',             variant: 'secondary', icon: 'CalendarDays' },
    ],
    sectionOrder: ['products', 'programs', 'events', 'content', 'photos', 'campaigns', 'offerings'],
    emptyPrompts: {
      digital_products:      { fr: 'Ajouter votre premier produit',        en: 'Add your first product',           route: '/admin/products/new' },
      ai_formation_creation: { fr: 'Créer votre première formation',       en: 'Create your first formation',      route: '/admin/programs/new' },
      ai_book_creation:      { fr: 'Créer votre premier livre avec l\'IA', en: 'Create your first AI book',        route: '/admin/studio'       },
      events:                { fr: 'Créer un premier événement',           en: 'Create your first event',          route: '/admin/events/new'   },
      product_comments:      { fr: 'Activer les commentaires produits',    en: 'Enable product comments',          route: '/admin/settings'     },
    },
    taglineFr: 'Créateur digital · produits, formations, événements',
    taglineEn: 'Digital creator · products, formations, events',
  },

  artisans_home_services: {
    heroCTAs: [
      { kind: 'order',        target: 'home',  requiresFeature: 'order_generator', labelFr: 'Demander un service', labelEn: 'Request a service', variant: 'primary',   icon: 'FileText' },
      { kind: 'appointments', target: 'home',  requiresFeature: 'appointment',     labelFr: 'Prendre rendez-vous', labelEn: 'Book appointment',  variant: 'secondary', icon: 'CalendarClock' },
      { kind: 'reviews',      target: 'home',  requiresFeature: 'reviews',         labelFr: 'Voir les avis',       labelEn: 'See reviews',       variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['products', 'photos', 'content', 'events', 'campaigns', 'offerings', 'programs'],
    emptyPrompts: {
      order_generator: { fr: 'Configurer le générateur de commande', en: 'Set up the order generator',      route: '/admin/create'   },
      appointment:     { fr: 'Configurer les rendez-vous',           en: 'Configure appointments',          route: '/admin/settings' },
      reviews:         { fr: 'Inviter un premier client à noter',    en: 'Invite your first client review', route: '/admin/settings' },
      location:        { fr: 'Renseigner votre zone d\'intervention', en: 'Add your service area',          route: '/admin/settings' },
    },
    taglineFr: 'Artisan · devis, rendez-vous, avis clients',
    taglineEn: 'Artisan · quotes, appointments, client reviews',
  },

  tutors_home_teachers: {
    heroCTAs: [
      { kind: 'appointments', target: 'home',  requiresFeature: 'appointment',      labelFr: 'Réserver une session', labelEn: 'Book a session', variant: 'primary',   icon: 'CalendarClock' },
      { kind: 'store',        target: 'store', requiresFeature: 'digital_products', labelFr: 'Voir cours',           labelEn: 'View courses',   variant: 'secondary', icon: 'GraduationCap' },
      { kind: 'reviews',      target: 'home',  requiresFeature: 'reviews',          labelFr: 'Voir les avis',        labelEn: 'See reviews',    variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['products', 'programs', 'content', 'events', 'photos', 'campaigns', 'offerings'],
    emptyPrompts: {
      appointment:      { fr: 'Configurer les sessions',              en: 'Configure sessions',                route: '/admin/settings'     },
      digital_products: { fr: 'Ajouter un premier cours',             en: 'Add your first course',             route: '/admin/products/new' },
      reviews:          { fr: 'Inviter un premier élève à noter',     en: 'Invite your first student review',  route: '/admin/settings'     },
      location:         { fr: 'Renseigner votre zone d\'enseignement', en: 'Add your teaching area',           route: '/admin/settings'     },
    },
    taglineFr: 'Enseignant · sessions, cours, avis',
    taglineEn: 'Teacher · sessions, courses, reviews',
  },

  sport: {
    heroCTAs: [
      { kind: 'appointments', target: 'home',   requiresFeature: 'appointment', labelFr: 'Réserver',        labelEn: 'Book now',    variant: 'primary',   icon: 'CalendarClock' },
      { kind: 'events',       target: 'events', requiresFeature: 'events',      labelFr: 'Voir événements', labelEn: 'View events', variant: 'secondary', icon: 'CalendarDays' },
      { kind: 'reviews',      target: 'home',   requiresFeature: 'reviews',     labelFr: 'Voir les avis',   labelEn: 'See reviews', variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['events', 'products', 'content', 'photos', 'programs', 'campaigns', 'offerings'],
    emptyPrompts: {
      appointment: { fr: 'Configurer les séances',      en: 'Configure sessions',         route: '/admin/settings'   },
      events:      { fr: 'Créer un premier événement',  en: 'Create your first event',    route: '/admin/events/new' },
      reviews:     { fr: 'Inviter un premier avis',     en: 'Invite your first review',   route: '/admin/settings'   },
      location:    { fr: 'Renseigner la salle / le lieu', en: 'Add the gym / location',   route: '/admin/settings'   },
    },
    taglineFr: 'Sport · séances, événements, avis',
    taglineEn: 'Sport · sessions, events, reviews',
  },

  instrumentists: {
    heroCTAs: [
      { kind: 'appointments', target: 'home',   requiresFeature: 'appointment', labelFr: 'Réserver',         labelEn: 'Book now',       variant: 'primary',   icon: 'CalendarClock' },
      { kind: 'events',       target: 'events', requiresFeature: 'events',      labelFr: 'Voir prestations', labelEn: 'View gigs',      variant: 'secondary', icon: 'CalendarDays' },
      { kind: 'reviews',      target: 'home',   requiresFeature: 'reviews',     labelFr: 'Voir les avis',    labelEn: 'See reviews',    variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['events', 'content', 'products', 'photos', 'programs', 'campaigns', 'offerings'],
    emptyPrompts: {
      appointment: { fr: 'Configurer les réservations', en: 'Configure bookings',       route: '/admin/settings'   },
      events:      { fr: 'Ajouter une première prestation', en: 'Add your first gig',   route: '/admin/events/new' },
      reviews:     { fr: 'Inviter un premier avis',      en: 'Invite your first review', route: '/admin/settings'  },
    },
    taglineFr: 'Musicien · réservations, prestations, avis',
    taglineEn: 'Musician · bookings, gigs, reviews',
  },

  influencers: {
    heroCTAs: [
      { kind: 'order',       target: 'home',   requiresFeature: 'order_generator', labelFr: 'Demander une collaboration', labelEn: 'Request a collab', variant: 'primary',   icon: 'FileText' },
      { kind: 'offerings',   target: 'offerings', requiresFeature: 'donation_gifts', labelFr: 'Envoyer un cadeau',       labelEn: 'Send a gift',      variant: 'secondary', icon: 'HandHeart' },
      { kind: 'reviews',     target: 'home',   requiresFeature: 'reviews',         labelFr: 'Voir les avis',              labelEn: 'See reviews',      variant: 'secondary', icon: 'Star' },
    ],
    sectionOrder: ['products', 'offerings', 'campaigns', 'content', 'photos', 'events', 'programs'],
    emptyPrompts: {
      order_generator: { fr: 'Ouvrir aux demandes de collaboration', en: 'Open collab requests',           route: '/admin/create'         },
      donation_gifts:  { fr: 'Activer les cadeaux / dons',           en: 'Enable gifts / donations',       route: '/admin/campaigns'      },
      reviews:         { fr: 'Inviter un premier avis',              en: 'Invite your first review',       route: '/admin/settings'       },
      affiliation:     { fr: 'Générer votre lien de parrainage',     en: 'Generate your referral link',    route: '/admin/affiliation'    },
    },
    taglineFr: 'Créateur · collaborations, cadeaux, avis',
    taglineEn: 'Creator · collabs, gifts, reviews',
  },

  services: {
    heroCTAs: [
      { kind: 'order',        target: 'home',  requiresFeature: 'order_generator',  labelFr: 'Demander un service', labelEn: 'Request a service', variant: 'primary',   icon: 'FileText' },
      { kind: 'store',        target: 'store', requiresFeature: 'digital_products', labelFr: 'Voir produits',       labelEn: 'View products',     variant: 'secondary', icon: 'ShoppingBag' },
      { kind: 'appointments', target: 'home',  requiresFeature: 'appointment',      labelFr: 'Prendre rendez-vous', labelEn: 'Book appointment',  variant: 'secondary', icon: 'CalendarClock' },
    ],
    sectionOrder: ['products', 'content', 'photos', 'events', 'programs', 'campaigns', 'offerings'],
    emptyPrompts: {
      order_generator:  { fr: 'Configurer le générateur de commande', en: 'Set up the order generator', route: '/admin/create'        },
      digital_products: { fr: 'Ajouter un premier produit',            en: 'Add your first product',    route: '/admin/products/new'  },
      appointment:      { fr: 'Configurer les rendez-vous',            en: 'Configure appointments',    route: '/admin/settings'      },
      reviews:          { fr: 'Inviter un premier avis',               en: 'Invite your first review',  route: '/admin/settings'      },
    },
    taglineFr: 'Service · devis, produits, rendez-vous',
    taglineEn: 'Service · quotes, products, appointments',
  },
};

export function getTypePresentation(type: SiteviralType | null | undefined): TypePresentation {
  if (!type) return DEFAULT_PRESENTATION;
  return TYPE_PRESENTATION[type] ?? DEFAULT_PRESENTATION;
}
