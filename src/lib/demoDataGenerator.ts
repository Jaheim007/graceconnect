/**
 * Generates randomized demo data for /dashboard-preview.
 * Each call produces a fresh set of realistic metrics for a small-to-medium org.
 * 
 * Rules:
 * - 3-month window only (Jan–Mar)
 * - Single currency per dashboard (no mixing)
 * - All KPIs are internally consistent
 * - CFA is weighted more heavily in random selection
 */

import { GLOBAL_NAMES, GLOBAL_CITIES, PRODUCT_TITLES, ORG_NAMES } from './global-names';

// ── Supported currencies with realistic ranges for small-to-mid orgs ──
const CURRENCIES = [
  // CFA currencies weighted more (will be duplicated in pool)
  { code: 'XOF', symbol: 'FCFA', txMin: 3_000, txMax: 30_000, revMin: 1_000_000, revMax: 10_000_000, locale: 'fr-FR' },
  { code: 'XAF', symbol: 'FCFA', txMin: 3_000, txMax: 25_000, revMin: 1_000_000, revMax: 8_000_000, locale: 'fr-FR' },
  { code: 'USD', symbol: '$', txMin: 5, txMax: 50, revMin: 1_000, revMax: 10_000, locale: 'en-US' },
  { code: 'EUR', symbol: '€', txMin: 5, txMax: 45, revMin: 1_000, revMax: 10_000, locale: 'fr-FR' },
  { code: 'GBP', symbol: '£', txMin: 4, txMax: 40, revMin: 1_000, revMax: 10_000, locale: 'en-GB' },
  { code: 'GHS', symbol: 'GH₵', txMin: 20, txMax: 200, revMin: 10_000, revMax: 100_000, locale: 'en-GH' },
  { code: 'KES', symbol: 'KSh', txMin: 500, txMax: 5_000, revMin: 200_000, revMax: 2_000_000, locale: 'en-KE' },
  { code: 'NGN', symbol: '₦', txMin: 2_000, txMax: 20_000, revMin: 800_000, revMax: 8_000_000, locale: 'en-NG' },
];

// Weighted pool: CFA appears more often
const CURRENCY_POOL = [
  ...Array(4).fill(CURRENCIES[0]), // XOF x4
  ...Array(3).fill(CURRENCIES[1]), // XAF x3
  CURRENCIES[2], // USD
  CURRENCIES[3], // EUR
  CURRENCIES[4], // GBP
  ...Array(2).fill(CURRENCIES[5]), // GHS x2
  ...Array(2).fill(CURRENCIES[6]), // KES x2
  ...Array(2).fill(CURRENCIES[7]), // NGN x2
];

const PRODUCT_TYPES: Array<{ type: string; label: string }> = [
  { type: 'ebook', label: 'E-book' },
  { type: 'course', label: 'Course' },
  { type: 'ebook', label: 'PDF Guide' },
  { type: 'course', label: 'Masterclass' },
  { type: 'ebook', label: 'Workbook' },
  { type: 'course', label: 'Training' },
  { type: 'coloring_book', label: 'Coloring Book' },
  { type: 'ebook', label: 'Devotional' },
];

const MONTHS_3 = ['Jan', 'Feb', 'Mar'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniquePicks<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

export interface DemoData {
  orgName: string;
  orgCurrency: typeof CURRENCIES[0];
  metrics: {
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProducts: number;
    growthPercent: number;
    revenueGrowth: number;
    customerGrowth: number;
    transactionGrowth: number;
  };
  revenueChart: Array<{ month: string; revenue: number }>;
  sales: Array<{
    id: string;
    product: string;
    type: string;
    typeLabel: string;
    price: number;
    currency: string;
    status: string;
    buyer: string;
    buyerCity: string;
    buyerFlag: string;
    date: string;
    org: string;
  }>;
  aiProjects: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    pages: number;
    createdAt: string;
    progress?: number;
  }>;
  ambassador: {
    totalEarned: number;
    currency: string;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    activeLinks: number;
    topAmbassadors: Array<{ name: string; earned: number; sales: number }>;
  };
  viralTools: {
    totalShares: number;
    referralLinks: number;
    emailsSent: number;
    landingPages: number;
    topLinks: Array<{ name: string; clicks: number; conversions: number; rate: string }>;
  };
  orgs: Array<{ name: string; currency: string }>;
}

export function generateDemoData(): DemoData {
  const orgName = pick(ORG_NAMES);
  const orgCurrency = pick(CURRENCY_POOL);

  // Consistent multi-org list (all using SAME currency for this dashboard)
  const otherOrgs = uniquePicks(ORG_NAMES.filter(n => n !== orgName), randInt(3, 5));
  const orgs = [
    { name: orgName, currency: orgCurrency.code },
    ...otherOrgs.map(name => ({ name, currency: orgCurrency.code })),
  ];

  // ── Build consistent KPIs ──
  const totalCustomers = randInt(150, 800);
  const avgPurchasesPerCustomer = randFloat(1.5, 6, 1);
  const totalTransactions = Math.round(totalCustomers * avgPurchasesPerCustomer);
  const avgTransactionValue = randInt(orgCurrency.txMin, orgCurrency.txMax);
  const totalRevenue = totalTransactions * avgTransactionValue;
  const totalProducts = randInt(10, 80);

  const metrics = {
    totalRevenue,
    totalTransactions,
    totalCustomers,
    totalProducts,
    growthPercent: randFloat(10, 40),
    revenueGrowth: randFloat(10, 40),
    customerGrowth: randFloat(10, 35),
    transactionGrowth: randFloat(10, 38),
  };

  // ── 3-month revenue chart with smooth growth ──
  // Jan = base, Feb = +10-30%, Mar = +10-25%
  const janShare = randFloat(0.25, 0.30, 2);
  const febGrowth = randFloat(1.10, 1.30, 2);
  const janRevenue = Math.round(totalRevenue * janShare);
  const febRevenue = Math.round(janRevenue * febGrowth);
  const marRevenue = totalRevenue - janRevenue - febRevenue;

  const revenueChart = [
    { month: 'Jan', revenue: janRevenue },
    { month: 'Feb', revenue: febRevenue },
    { month: 'Mar', revenue: marRevenue },
  ];

  // ── Sales — ALL in same currency ──
  const salesCount = randInt(12, 20);
  const usedNames = new Set<string>();
  const sales = Array.from({ length: salesCount }, (_, i) => {
    let buyer: string;
    do { buyer = pick(GLOBAL_NAMES); } while (usedNames.has(buyer));
    usedNames.add(buyer);
    const city = pick(GLOBAL_CITIES);
    const productInfo = pick(PRODUCT_TYPES);
    const org = pick(orgs);
    // Sales spread across last 90 days (Jan–Mar)
    const daysAgo = randInt(0, 82);
    const d = new Date(2026, 2, 23); // March 23
    d.setDate(d.getDate() - daysAgo);
    d.setHours(randInt(6, 22), randInt(0, 59));

    return {
      id: `s${i + 1}`,
      product: pick(PRODUCT_TITLES),
      type: productInfo.type,
      typeLabel: productInfo.label,
      price: randInt(orgCurrency.txMin, orgCurrency.txMax),
      currency: orgCurrency.code, // SAME currency everywhere
      status: 'completed',
      buyer,
      buyerCity: city.city,
      buyerFlag: city.flag,
      date: d.toISOString(),
      org: org.name,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── AI Projects ──
  const projectCount = randInt(4, 7);
  const statuses = ['published', 'published', 'published', 'draft', 'generating'];
  const aiProjects = uniquePicks(PRODUCT_TITLES, projectCount).map((title, i) => {
    const status = i < statuses.length ? statuses[i] : pick(statuses);
    return {
      id: `p${i + 1}`,
      title,
      type: pick(PRODUCT_TYPES).type,
      status,
      pages: status === 'generating' ? 0 : randInt(24, 180),
      createdAt: (() => {
        const d = new Date(2026, 2, 23);
        d.setDate(d.getDate() - randInt(1, 90));
        return d.toISOString().split('T')[0];
      })(),
      progress: status === 'generating' ? randInt(20, 85) : undefined,
    };
  });

  // ── Ambassador (same currency) ──
  const ambCount = randInt(4, 7);
  const topAmbassadors = uniquePicks(GLOBAL_NAMES, ambCount).map(name => {
    const earned = randInt(
      Math.round(totalRevenue * 0.01),
      Math.round(totalRevenue * 0.08)
    );
    return { name, earned, sales: randInt(8, 65) };
  }).sort((a, b) => b.earned - a.earned);

  const totalAmbEarned = topAmbassadors.reduce((s, a) => s + a.earned, 0);
  const totalClicks = randInt(2_000, 15_000);
  const totalConversions = randInt(80, 600);

  const ambassador = {
    totalEarned: totalAmbEarned,
    currency: orgCurrency.code, // SAME currency
    totalClicks,
    totalConversions,
    conversionRate: randFloat(2.0, 5.5),
    activeLinks: randInt(6, 30),
    topAmbassadors,
  };

  // ── Viral Tools ──
  const viralTopLinks = uniquePicks(PRODUCT_TITLES, 4).map(name => {
    const clicks = randInt(200, 4_000);
    const conversions = randInt(10, Math.round(clicks * 0.06));
    return {
      name,
      clicks,
      conversions,
      rate: `${((conversions / clicks) * 100).toFixed(1)}%`,
    };
  }).sort((a, b) => b.clicks - a.clicks);

  const viralTools = {
    totalShares: randInt(800, 6_000),
    referralLinks: randInt(20, 200),
    emailsSent: randInt(400, 4_000),
    landingPages: randInt(3, 20),
    topLinks: viralTopLinks,
  };

  return { orgName, orgCurrency, metrics, revenueChart, sales, aiProjects, ambassador, viralTools, orgs };
}
