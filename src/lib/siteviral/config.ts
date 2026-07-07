import type { SiteviralType, SiteviralFeatureKey } from '@/types/database';

export const SITEVIRAL_FEATURE_KEYS: SiteviralFeatureKey[] = [
  'appointment',
  'digital_products',
  'order_generator',
  'donation_gifts',
  'payment',
  'ai_book_creation',
  'ai_formation_creation',
  'product_comments',
  'location',
  'events',
  'reviews',
  'kyc',
  'affiliation',
];

export interface FeatureMeta {
  key: SiteviralFeatureKey;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  icon: string; // lucide icon name
}

export const FEATURE_META: Record<SiteviralFeatureKey, FeatureMeta> = {
  appointment: {
    key: 'appointment', icon: 'CalendarClock',
    labelFr: 'Rendez-vous', labelEn: 'Appointments',
    descFr: 'Laissez vos clients réserver un créneau ou un service.',
    descEn: 'Let clients book a time or service.',
  },
  digital_products: {
    key: 'digital_products', icon: 'Package',
    labelFr: 'Produits digitaux', labelEn: 'Digital products',
    descFr: 'Vendez ebooks, PDF, cours, templates ou fichiers.',
    descEn: 'Sell ebooks, PDFs, courses, templates or files.',
  },
  order_generator: {
    key: 'order_generator', icon: 'FileText',
    labelFr: 'Générateur de commande', labelEn: 'Order generator',
    descFr: 'Créez une commande ou un devis personnalisé pour un client.',
    descEn: 'Create a custom order or quote for a client.',
  },
  donation_gifts: {
    key: 'donation_gifts', icon: 'Heart',
    labelFr: 'Dons / Offrandes / Cadeaux', labelEn: 'Donations / Gifts',
    descFr: 'Recevez du soutien, des offrandes ou des dons.',
    descEn: 'Receive support, offerings or donations.',
  },
  payment: {
    key: 'payment', icon: 'CreditCard',
    labelFr: 'Paiement en ligne', labelEn: 'Online payment',
    descFr: 'Acceptez les paiements en ligne.',
    descEn: 'Accept online payments.',
  },
  ai_book_creation: {
    key: 'ai_book_creation', icon: 'BookOpen',
    labelFr: 'Création de livre IA', labelEn: 'AI book creation',
    descFr: 'Créez des livres plus vite avec l\'IA.',
    descEn: 'Create books faster with AI.',
  },
  ai_formation_creation: {
    key: 'ai_formation_creation', icon: 'GraduationCap',
    labelFr: 'Création de formation IA', labelEn: 'AI formation creation',
    descFr: 'Créez formations et cours avec l\'IA.',
    descEn: 'Create formations and courses with AI.',
  },
  product_comments: {
    key: 'product_comments', icon: 'MessageSquare',
    labelFr: 'Commentaires produits', labelEn: 'Product comments',
    descFr: 'Autorisez les commentaires sur vos produits digitaux.',
    descEn: 'Allow buyers to comment on digital products.',
  },
  location: {
    key: 'location', icon: 'MapPin',
    labelFr: 'Localisation', labelEn: 'Location',
    descFr: 'Affichez votre ville, quartier ou zone de service.',
    descEn: 'Show your city, area or service zone.',
  },
  events: {
    key: 'events', icon: 'Calendar',
    labelFr: 'Événements', labelEn: 'Events',
    descFr: 'Créez des événements et gérez les inscriptions.',
    descEn: 'Create events and manage registrations.',
  },
  reviews: {
    key: 'reviews', icon: 'Star',
    labelFr: 'Avis clients', labelEn: 'Reviews',
    descFr: 'Laissez vos clients évaluer votre service ou établissement.',
    descEn: 'Let clients review your service or business.',
  },
  kyc: {
    key: 'kyc', icon: 'ShieldCheck',
    labelFr: 'Vérification d\'identité (KYC)', labelEn: 'Identity verification (KYC)',
    descFr: 'Vérifiez votre identité avant retrait de fonds.',
    descEn: 'Verify your identity before payout.',
  },
  affiliation: {
    key: 'affiliation', icon: 'Share2',
    labelFr: 'Affiliation', labelEn: 'Affiliation',
    descFr: 'Générez des liens de parrainage et gagnez des commissions.',
    descEn: 'Generate referral links and earn commissions.',
  },
};

export interface SiteviralTypeMeta {
  key: SiteviralType;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  emoji: string;
  defaultFeatures: SiteviralFeatureKey[];
  /** false = not yet implemented; hide from picker (still valid as a value in DB). */
  available: boolean;
}

export const SITEVIRAL_TYPES: Record<SiteviralType, SiteviralTypeMeta> = {
  church: {
    key: 'church', emoji: '⛪', available: true,
    labelFr: 'SiteViral Église', labelEn: 'SiteViral Church',
    descFr: 'Églises, pasteurs, ministères, organisations religieuses',
    descEn: 'Churches, pastors, ministries, religious organizations',
    defaultFeatures: ['appointment','digital_products','order_generator','donation_gifts','payment','ai_book_creation','ai_formation_creation','product_comments','location','kyc','affiliation'],
  },
  digital_products: {
    key: 'digital_products', emoji: '📦', available: true,
    labelFr: 'SiteViral Produits Digitaux', labelEn: 'SiteViral Digital Products',
    descFr: 'Vendeurs d\'ebooks, PDF, cours, templates, créateurs digitaux',
    descEn: 'Ebook, PDF, course sellers, digital creators',
    defaultFeatures: ['digital_products','order_generator','donation_gifts','payment','ai_book_creation','ai_formation_creation','events','product_comments','kyc','affiliation'],
  },
  sport: {
    key: 'sport', emoji: '🏋️', available: false,
    labelFr: 'SiteViral Sport', labelEn: 'SiteViral Sport',
    descFr: 'Coachs, entraîneurs, salles de sport, clubs',
    descEn: 'Coaches, trainers, gyms, clubs',
    defaultFeatures: ['appointment','order_generator','payment','location','events','reviews','kyc','affiliation'],
  },
  artisans_home_services: {
    key: 'artisans_home_services', emoji: '🛠️', available: true,
    labelFr: 'SiteViral Artisans / Services à domicile', labelEn: 'SiteViral Artisans / Home Services',
    descFr: 'Plombiers, électriciens, réparateurs, techniciens',
    descEn: 'Plumbers, electricians, repairers, technicians',
    defaultFeatures: ['appointment','order_generator','payment','reviews','location','kyc','affiliation'],
  },
  beauty: {
    key: 'beauty', emoji: '💅', available: true,
    labelFr: 'SiteViral Beauté', labelEn: 'SiteViral Beauty',
    descFr: 'Salons, barbiers, maquilleurs, professionnels de la beauté',
    descEn: 'Salons, barbers, makeup artists, beauty pros',
    defaultFeatures: ['appointment','order_generator','payment','ai_book_creation','ai_formation_creation','reviews','location','kyc','affiliation'],
  },
  tutors_home_teachers: {
    key: 'tutors_home_teachers', emoji: '📚', available: true,
    labelFr: 'SiteViral Tuteurs / Enseignants à domicile', labelEn: 'SiteViral Tutors / Home Teachers',
    descFr: 'Professeurs privés, tuteurs, prestataires d\'éducation',
    descEn: 'Private teachers, tutors, education providers',
    defaultFeatures: ['digital_products','order_generator','reviews','location','kyc','affiliation'],
  },
  instrumentists: {
    key: 'instrumentists', emoji: '🎸', available: false,
    labelFr: 'SiteViral Instrumentistes', labelEn: 'SiteViral Instrumentists',
    descFr: 'Musiciens, DJs, chanteurs, instrumentistes',
    descEn: 'Musicians, DJs, singers, instrumentalists',
    defaultFeatures: ['appointment','order_generator','payment','reviews','location','kyc','affiliation'],
  },
  influencers: {
    key: 'influencers', emoji: '⭐', available: false,
    labelFr: 'SiteViral Influenceurs', labelEn: 'SiteViral Influencers',
    descFr: 'Influenceurs, créateurs, personnalités publiques',
    descEn: 'Influencers, creators, public personalities',
    defaultFeatures: ['appointment','order_generator','donation_gifts','reviews','kyc','affiliation'],
  },
  services: {
    key: 'services', emoji: '💼', available: false,
    labelFr: 'SiteViral Services', labelEn: 'SiteViral Services',
    descFr: 'Prestataires de services variés',
    descEn: 'General service providers',
    defaultFeatures: ['appointment','digital_products','order_generator','payment','reviews','product_comments','kyc','affiliation'],
  },
};

export const AVAILABLE_SITEVIRAL_TYPES: SiteviralTypeMeta[] =
  Object.values(SITEVIRAL_TYPES).filter((t) => t.available);

export function getDefaultFeaturesForType(type: SiteviralType | null | undefined): SiteviralFeatureKey[] {
  if (!type || !SITEVIRAL_TYPES[type]) return [];
  return [...SITEVIRAL_TYPES[type].defaultFeatures];
}

/** Merge two feature lists deduplicated, preserving order of the first. */
export function mergeFeatures(a: SiteviralFeatureKey[], b: SiteviralFeatureKey[]): SiteviralFeatureKey[] {
  const seen = new Set<SiteviralFeatureKey>();
  const out: SiteviralFeatureKey[] = [];
  for (const k of [...a, ...b]) {
    if (!seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}
