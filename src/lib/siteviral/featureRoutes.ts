import type { SiteviralFeatureKey } from '@/types/database';

export interface FeatureRoute {
  /** Where to go to configure the feature (settings/hub). */
  setupRoute: string;
  /** Where to send the user for their very first action on that feature. */
  firstActionRoute: string;
  /** Prompt-style label for the "first action" card. */
  firstActionFr: string;
  firstActionEn: string;
  /** Short verb for the "Setup" button. */
  setupVerbFr: string;
  setupVerbEn: string;
}

/**
 * Maps every SiteViral feature to the correct in-app route.
 * Adaptive dashboard + Add-more-functionalities page use this
 * to redirect users straight to the right screen after activation.
 */
export const FEATURE_ROUTES: Record<SiteviralFeatureKey, FeatureRoute> = {
  appointment: {
    setupRoute: '/admin/settings',
    firstActionRoute: '/admin/settings',
    firstActionFr: 'Configurez vos rendez-vous',
    firstActionEn: 'Configure your appointments',
    setupVerbFr: 'Configurer', setupVerbEn: 'Set up',
  },
  digital_products: {
    setupRoute: '/admin/products',
    firstActionRoute: '/admin/products/new',
    firstActionFr: 'Ajoutez votre premier produit digital',
    firstActionEn: 'Add your first digital product',
    setupVerbFr: 'Gérer', setupVerbEn: 'Manage',
  },
  order_generator: {
    setupRoute: '/admin/create',
    firstActionRoute: '/admin/create',
    firstActionFr: 'Générez votre première commande',
    firstActionEn: 'Create your first order',
    setupVerbFr: 'Ouvrir', setupVerbEn: 'Open',
  },
  donation_gifts: {
    setupRoute: '/admin/campaigns',
    firstActionRoute: '/admin/campaigns/new',
    firstActionFr: 'Créez votre première campagne de dons',
    firstActionEn: 'Create your first donation/campaign',
    setupVerbFr: 'Gérer', setupVerbEn: 'Manage',
  },
  payment: {
    setupRoute: '/admin/settings',
    firstActionRoute: '/admin/settings',
    firstActionFr: 'Activez les paiements en ligne',
    firstActionEn: 'Enable online payments',
    setupVerbFr: 'Configurer', setupVerbEn: 'Set up',
  },
  ai_book_creation: {
    setupRoute: '/admin/studio',
    firstActionRoute: '/admin/studio/projects/new',
    firstActionFr: 'Créez votre premier livre avec l\'IA',
    firstActionEn: 'Create your first book with AI',
    setupVerbFr: 'Ouvrir Studio', setupVerbEn: 'Open Studio',
  },
  ai_formation_creation: {
    setupRoute: '/admin/programs',
    firstActionRoute: '/admin/programs/new',
    firstActionFr: 'Créez votre première formation avec l\'IA',
    firstActionEn: 'Create your first formation with AI',
    setupVerbFr: 'Gérer', setupVerbEn: 'Manage',
  },
  product_comments: {
    setupRoute: '/admin/settings',
    firstActionRoute: '/admin/settings',
    firstActionFr: 'Activez les commentaires produits',
    firstActionEn: 'Enable product comments',
    setupVerbFr: 'Configurer', setupVerbEn: 'Set up',
  },
  location: {
    setupRoute: '/admin/settings',
    firstActionRoute: '/admin/settings',
    firstActionFr: 'Renseignez votre localisation',
    firstActionEn: 'Set your location',
    setupVerbFr: 'Renseigner', setupVerbEn: 'Set',
  },
  events: {
    setupRoute: '/admin/events',
    firstActionRoute: '/admin/events/new',
    firstActionFr: 'Créez votre premier événement',
    firstActionEn: 'Create your first event',
    setupVerbFr: 'Gérer', setupVerbEn: 'Manage',
  },
  reviews: {
    setupRoute: '/admin/settings',
    firstActionRoute: '/admin/settings',
    firstActionFr: 'Activez les avis clients',
    firstActionEn: 'Enable customer reviews',
    setupVerbFr: 'Configurer', setupVerbEn: 'Set up',
  },
  kyc: {
    setupRoute: '/admin/kyc',
    firstActionRoute: '/admin/kyc',
    firstActionFr: 'Vérifiez votre identité (requis pour retirer vos gains)',
    firstActionEn: 'Verify your identity (required to withdraw earnings)',
    setupVerbFr: 'Vérifier', setupVerbEn: 'Verify',
  },
  affiliation: {
    setupRoute: '/admin/affiliation',
    firstActionRoute: '/admin/affiliation',
    firstActionFr: 'Générez votre lien de parrainage',
    firstActionEn: 'Generate your referral link',
    setupVerbFr: 'Ouvrir', setupVerbEn: 'Open',
  },
};
