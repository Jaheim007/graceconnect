import type { SiteviralType, SiteviralFeatureKey } from '@/types/database';

export interface SiteviralGoal {
  id: string;
  labelFr: string;
  labelEn: string;
  emoji: string;
  /** Features to guarantee are active after picking this goal. */
  features: SiteviralFeatureKey[];
  /** Route to send the user to after activation. */
  firstAction: string;
}

/**
 * Per-type goal catalogue. Each goal maps to a small set of features to
 * activate and a first-action route so onboarding lands the user exactly
 * where they need to be.
 */
export const GOALS_BY_TYPE: Partial<Record<SiteviralType, SiteviralGoal[]>> = {
  church: [
    { id: 'donations',   emoji: '💝', labelFr: 'Recevoir des dons / offrandes', labelEn: 'Receive donations / offerings', features: ['donation_gifts','payment','kyc'], firstAction: '/admin/campaigns/new' },
    { id: 'sell_content',emoji: '📚', labelFr: 'Vendre du contenu (sermons, livres)', labelEn: 'Sell content (sermons, books)', features: ['digital_products','payment','kyc'], firstAction: '/admin/products/new' },
    { id: 'write_book',  emoji: '✏️', labelFr: 'Écrire un livre avec l\'IA', labelEn: 'Write a book with AI', features: ['ai_book_creation','digital_products'], firstAction: '/ecrire' },
    { id: 'create_course',emoji:'🎓', labelFr: 'Créer une formation avec l\'IA', labelEn: 'Create a course with AI', features: ['ai_formation_creation','digital_products'], firstAction: '/creer-formation' },
  ],
  digital_products: [
    { id: 'sell_product',emoji: '🛒', labelFr: 'Vendre un produit digital', labelEn: 'Sell a digital product', features: ['digital_products','payment','kyc'], firstAction: '/admin/products/new' },
    { id: 'write_book',  emoji: '✏️', labelFr: 'Écrire un livre avec l\'IA', labelEn: 'Write a book with AI', features: ['ai_book_creation','digital_products'], firstAction: '/ecrire' },
    { id: 'create_course',emoji:'🎓', labelFr: 'Créer une formation avec l\'IA', labelEn: 'Create a course with AI', features: ['ai_formation_creation','digital_products'], firstAction: '/creer-formation' },
    { id: 'donations',   emoji: '💝', labelFr: 'Recevoir des dons', labelEn: 'Receive donations', features: ['donation_gifts','payment','kyc'], firstAction: '/admin/campaigns/new' },
  ],
  beauty: [
    { id: 'appointments',emoji: '📅', labelFr: 'Recevoir des rendez-vous', labelEn: 'Receive appointments', features: ['appointment','payment','kyc','location'], firstAction: '/beauty/pro/onboarding' },
    { id: 'services',    emoji: '💅', labelFr: 'Ajouter mes services', labelEn: 'Add my services', features: ['appointment','location'], firstAction: '/beauty/pro/onboarding' },
    { id: 'sell_content',emoji: '📚', labelFr: 'Vendre du contenu (guides, formations)', labelEn: 'Sell content (guides, courses)', features: ['digital_products','payment','kyc'], firstAction: '/admin/products/new' },
  ],
  artisans_home_services: [
    { id: 'appointments',emoji: '📅', labelFr: 'Recevoir des demandes de service', labelEn: 'Receive service requests', features: ['appointment','payment','kyc','location'], firstAction: '/home/pro/onboarding' },
    { id: 'services',    emoji: '🛠️', labelFr: 'Configurer mes services', labelEn: 'Set up my services', features: ['appointment','location'], firstAction: '/home/pro/services' },
    { id: 'payments',    emoji: '💳', labelFr: 'Recevoir des paiements', labelEn: 'Receive payments', features: ['payment','kyc'], firstAction: '/home/pro/onboarding' },
  ],
  tutors_home_teachers: [
    { id: 'appointments',emoji: '📅', labelFr: 'Recevoir des sessions / cours', labelEn: 'Receive sessions / lessons', features: ['appointment','payment','kyc','location'], firstAction: '/education/pro/onboarding' },
    { id: 'subjects',    emoji: '📚', labelFr: 'Ajouter mes matières', labelEn: 'Add my subjects', features: ['appointment'], firstAction: '/education/pro/subjects' },
    { id: 'sell_content',emoji: '🎓', labelFr: 'Vendre des cours / supports', labelEn: 'Sell courses / materials', features: ['digital_products','payment','kyc'], firstAction: '/admin/products/new' },
  ],
};

export function getGoalsForType(type: SiteviralType | null | undefined): SiteviralGoal[] {
  if (!type) return [];
  return GOALS_BY_TYPE[type] ?? [];
}
