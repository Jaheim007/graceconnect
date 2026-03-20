/**
 * Demo data for the /dashboard-preview marketing page.
 * isDemo toggle: when true, all components use this data instead of real backend queries.
 */

export const DEMO_CONFIG = {
  isDemo: true,
};

// ── Organizations ──
export const DEMO_ORGS = [
  { id: 'org-1', name: 'Growth Academy', currency: 'XOF' },
  { id: 'org-2', name: 'Faith Community Center', currency: 'USD' },
  { id: 'org-3', name: 'Digital Creators Hub', currency: 'XOF' },
  { id: 'org-4', name: 'Sahel Media Group', currency: 'XOF' },
  { id: 'org-5', name: 'Inspire Publishing', currency: 'USD' },
];

// ── Dashboard Metrics ──
export const DEMO_METRICS = {
  totalRevenue: 12_847_500,
  totalRevenueUSD: 21_450,
  currency: 'XOF',
  totalTransactions: 1_847,
  totalCustomers: 423,
  totalProducts: 34,
  growthPercent: 27.4,
  revenueGrowth: 32.1,
  customerGrowth: 18.6,
  transactionGrowth: 24.3,
};

// ── Revenue Chart (last 12 months) ──
export const DEMO_REVENUE_CHART = [
  { month: 'Avr', revenue: 420_000 },
  { month: 'Mai', revenue: 580_000 },
  { month: 'Juin', revenue: 710_000 },
  { month: 'Juil', revenue: 890_000 },
  { month: 'Août', revenue: 1_050_000 },
  { month: 'Sep', revenue: 1_240_000 },
  { month: 'Oct', revenue: 980_000 },
  { month: 'Nov', revenue: 1_420_000 },
  { month: 'Déc', revenue: 1_680_000 },
  { month: 'Jan', revenue: 1_350_000 },
  { month: 'Fév', revenue: 1_790_000 },
  { month: 'Mar', revenue: 2_130_000 },
];

// ── Sales Transactions ──
export const DEMO_SALES = [
  { id: 's1', product: 'Les 7 Clés du Succès Digital', type: 'ebook', price: 5_000, currency: 'XOF', status: 'completed', buyer: 'Amadou K.', date: '2026-03-19T14:23:00', org: 'Growth Academy' },
  { id: 's2', product: 'Masterclass Marketing Digital', type: 'course', price: 25_000, currency: 'XOF', status: 'completed', buyer: 'Fatou D.', date: '2026-03-19T11:05:00', org: 'Growth Academy' },
  { id: 's3', product: 'Template Business Plan Pro', type: 'template', price: 15_000, currency: 'XOF', status: 'completed', buyer: 'Ibrahim S.', date: '2026-03-18T16:42:00', org: 'Digital Creators Hub' },
  { id: 's4', product: 'Guide Entrepreneuriat Africain', type: 'ebook', price: 7_500, currency: 'XOF', status: 'completed', buyer: 'Marie L.', date: '2026-03-18T09:18:00', org: 'Growth Academy' },
  { id: 's5', product: 'Leadership Course', type: 'course', price: 15, currency: 'USD', status: 'completed', buyer: 'James W.', date: '2026-03-17T20:31:00', org: 'Faith Community Center' },
  { id: 's6', product: 'Pack Réseaux Sociaux', type: 'template', price: 10_000, currency: 'XOF', status: 'completed', buyer: 'Ousmane B.', date: '2026-03-17T13:55:00', org: 'Sahel Media Group' },
  { id: 's7', product: 'Devenir Freelance en Afrique', type: 'ebook', price: 3_500, currency: 'XOF', status: 'completed', buyer: 'Aïcha M.', date: '2026-03-16T08:12:00', org: 'Digital Creators Hub' },
  { id: 's8', product: 'Photography Basics', type: 'course', price: 25, currency: 'USD', status: 'completed', buyer: 'Sarah T.', date: '2026-03-15T15:44:00', org: 'Inspire Publishing' },
  { id: 's9', product: 'Prières Quotidiennes — Livre', type: 'ebook', price: 2_500, currency: 'XOF', status: 'completed', buyer: 'Paul N.', date: '2026-03-15T07:30:00', org: 'Faith Community Center' },
  { id: 's10', product: 'Kit Création de Contenu', type: 'template', price: 8_000, currency: 'XOF', status: 'completed', buyer: 'Cécile A.', date: '2026-03-14T18:22:00', org: 'Sahel Media Group' },
  { id: 's11', product: 'Copywriting Secrets', type: 'ebook', price: 10, currency: 'USD', status: 'completed', buyer: 'David R.', date: '2026-03-14T10:15:00', org: 'Inspire Publishing' },
  { id: 's12', product: 'Stratégie Mobile Money', type: 'course', price: 20_000, currency: 'XOF', status: 'completed', buyer: 'Kofi E.', date: '2026-03-13T12:08:00', org: 'Growth Academy' },
];

// ── AI Studio Projects ──
export const DEMO_AI_PROJECTS = [
  { id: 'p1', title: 'Les 7 Clés du Succès Digital', type: 'ebook', status: 'published', pages: 124, createdAt: '2026-02-14' },
  { id: 'p2', title: 'Guide Pratique du E-commerce', type: 'ebook', status: 'published', pages: 89, createdAt: '2026-01-22' },
  { id: 'p3', title: 'Coloriage Animaux d\'Afrique', type: 'coloring_book', status: 'published', pages: 32, createdAt: '2026-03-01' },
  { id: 'p4', title: 'Recettes du Terroir — Vol. 2', type: 'ebook', status: 'draft', pages: 67, createdAt: '2026-03-15' },
  { id: 'p5', title: 'Mindset Millionnaire', type: 'ebook', status: 'generating', pages: 0, createdAt: '2026-03-19' },
];

// ── Ambassador Stats ──
export const DEMO_AMBASSADOR = {
  totalEarned: 847_250,
  currency: 'XOF',
  totalClicks: 12_480,
  totalConversions: 347,
  conversionRate: 2.78,
  activeLinks: 18,
  topAmbassadors: [
    { name: 'Moussa K.', earned: 245_000, sales: 89 },
    { name: 'Aminata D.', earned: 187_500, sales: 67 },
    { name: 'Jean-Pierre L.', earned: 134_200, sales: 52 },
    { name: 'Blessing O.', earned: 98_750, sales: 41 },
    { name: 'Habib S.', earned: 72_300, sales: 28 },
  ],
};

// ── Viral Tools Stats ──
export const DEMO_VIRAL_TOOLS = {
  totalShares: 4_280,
  referralLinks: 156,
  emailsSent: 2_340,
  landingPages: 12,
};
