/**
 * Generates randomized demo data for /dashboard-preview.
 * Each call produces a fresh set of metrics, sales, projects, ambassadors, etc.
 */

import { GLOBAL_NAMES, GLOBAL_CITIES, PRODUCT_TITLES, ORG_NAMES } from './global-names';

// ── Supported currencies with realistic multipliers ──
const CURRENCIES = [
  { code: 'XOF', symbol: 'FCFA', min: 2_000, max: 50_000, revenueMin: 5_000_000, revenueMax: 35_000_000 },
  { code: 'USD', symbol: '$', min: 5, max: 100, revenueMin: 5_000, revenueMax: 50_000 },
  { code: 'XAF', symbol: 'FCFA', min: 2_000, max: 45_000, revenueMin: 4_000_000, revenueMax: 30_000_000 },
  { code: 'GHS', symbol: 'GH₵', min: 20, max: 500, revenueMin: 20_000, revenueMax: 200_000 },
  { code: 'KES', symbol: 'KSh', min: 500, max: 10_000, revenueMin: 500_000, revenueMax: 5_000_000 },
  { code: 'NGN', symbol: '₦', min: 2_000, max: 50_000, revenueMin: 2_000_000, revenueMax: 25_000_000 },
  { code: 'ZAR', symbol: 'R', min: 50, max: 1_500, revenueMin: 50_000, revenueMax: 500_000 },
  { code: 'RWF', symbol: 'FRw', min: 3_000, max: 80_000, revenueMin: 3_000_000, revenueMax: 40_000_000 },
  { code: 'UGX', symbol: 'USh', min: 10_000, max: 200_000, revenueMin: 10_000_000, revenueMax: 100_000_000 },
  { code: 'TZS', symbol: 'TSh', min: 5_000, max: 150_000, revenueMin: 5_000_000, revenueMax: 80_000_000 },
  { code: 'GNF', symbol: 'FG', min: 20_000, max: 500_000, revenueMin: 20_000_000, revenueMax: 200_000_000 },
  { code: 'CDF', symbol: 'FC', min: 5_000, max: 100_000, revenueMin: 5_000_000, revenueMax: 60_000_000 },
  { code: 'EUR', symbol: '€', min: 5, max: 80, revenueMin: 4_000, revenueMax: 40_000 },
  { code: 'CAD', symbol: 'CA$', min: 7, max: 120, revenueMin: 6_000, revenueMax: 55_000 },
  { code: 'GBP', symbol: '£', min: 4, max: 70, revenueMin: 3_500, revenueMax: 35_000 },
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

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

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
  // Pick main org
  const orgName = pick(ORG_NAMES);
  const orgCurrency = pick(CURRENCIES);

  // Pick 4-6 additional orgs
  const otherOrgs = uniquePicks(ORG_NAMES.filter(n => n !== orgName), randInt(4, 6));
  const orgs = [
    { name: orgName, currency: orgCurrency.code },
    ...otherOrgs.map(name => ({ name, currency: pick(CURRENCIES).code })),
  ];

  // Metrics
  const totalRevenue = randInt(orgCurrency.revenueMin, orgCurrency.revenueMax);
  const totalTransactions = randInt(800, 5_000);
  const totalCustomers = randInt(150, 1_200);
  const totalProducts = randInt(12, 80);
  const metrics = {
    totalRevenue,
    totalTransactions,
    totalCustomers,
    totalProducts,
    growthPercent: randFloat(8, 45),
    revenueGrowth: randFloat(12, 55),
    customerGrowth: randFloat(5, 38),
    transactionGrowth: randFloat(8, 42),
  };

  // Revenue chart — upward trend with organic variation
  const baseRevenue = totalRevenue / 18;
  const revenueChart = MONTHS_FR.map((month, i) => {
    const trend = 0.6 + (i / 11) * 0.8; // 0.6 → 1.4
    const jitter = 0.75 + Math.random() * 0.5; // 0.75 → 1.25
    return { month, revenue: Math.round(baseRevenue * trend * jitter) };
  });

  // Sales — 12-20 transactions with mixed currencies
  const salesCount = randInt(12, 20);
  const usedNames = new Set<string>();
  const sales = Array.from({ length: salesCount }, (_, i) => {
    let buyer: string;
    do { buyer = pick(GLOBAL_NAMES); } while (usedNames.has(buyer));
    usedNames.add(buyer);
    const city = pick(GLOBAL_CITIES);
    const saleCurrency = pick(CURRENCIES);
    const productInfo = pick(PRODUCT_TYPES);
    const org = pick(orgs);
    const daysAgo = randInt(0, 14);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(randInt(6, 22), randInt(0, 59));

    return {
      id: `s${i + 1}`,
      product: pick(PRODUCT_TITLES),
      type: productInfo.type,
      typeLabel: productInfo.label,
      price: randInt(saleCurrency.min, saleCurrency.max),
      currency: saleCurrency.code,
      status: 'completed',
      buyer,
      buyerCity: city.city,
      buyerFlag: city.flag,
      date: d.toISOString(),
      org: org.name,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // AI Projects — 4-7
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
        const d = new Date();
        d.setDate(d.getDate() - randInt(1, 90));
        return d.toISOString().split('T')[0];
      })(),
      progress: status === 'generating' ? randInt(20, 85) : undefined,
    };
  });

  // Ambassador
  const ambCount = randInt(4, 7);
  const topAmbassadors = uniquePicks(GLOBAL_NAMES, ambCount).map(() => {
    const earned = randInt(Math.round(orgCurrency.revenueMin * 0.02), Math.round(orgCurrency.revenueMax * 0.05));
    return {
      name: pick(GLOBAL_NAMES),
      earned,
      sales: randInt(15, 120),
    };
  }).sort((a, b) => b.earned - a.earned);

  const totalAmbEarned = topAmbassadors.reduce((s, a) => s + a.earned, 0) + randInt(orgCurrency.revenueMin, orgCurrency.revenueMax * 0.1);
  const totalClicks = randInt(5_000, 30_000);
  const totalConversions = randInt(200, 1_500);

  const ambassador = {
    totalEarned: totalAmbEarned,
    currency: orgCurrency.code,
    totalClicks,
    totalConversions,
    conversionRate: randFloat(1.5, 6.5),
    activeLinks: randInt(8, 45),
    topAmbassadors,
  };

  // Viral Tools
  const viralTopLinks = uniquePicks(PRODUCT_TITLES, 4).map(name => {
    const clicks = randInt(500, 8_000);
    const conversions = randInt(20, Math.round(clicks * 0.08));
    return {
      name,
      clicks,
      conversions,
      rate: `${((conversions / clicks) * 100).toFixed(1)}%`,
    };
  }).sort((a, b) => b.clicks - a.clicks);

  const viralTools = {
    totalShares: randInt(1_500, 12_000),
    referralLinks: randInt(50, 400),
    emailsSent: randInt(800, 8_000),
    landingPages: randInt(4, 30),
    topLinks: viralTopLinks,
  };

  return { orgName, orgCurrency, metrics, revenueChart, sales, aiProjects, ambassador, viralTools, orgs };
}
