// First-sale guarantees: launch window + zero-sale diagnosis.
// Pure helpers, no side effects — safe to use in any view.

export const LAUNCH_WINDOW_DAYS = 14;

type AnyProduct = {
  id: string;
  title?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  price?: number | null;
  is_free?: boolean | null;
  is_published?: boolean | null;
  sales_count?: number | null;
  commission_rate?: number | null;
  created_at?: string | null;
  views_count?: number | null;
};

export function daysSince(date?: string | null): number {
  if (!date) return 0;
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** True while a published product still sits inside its Discover placement window. */
export function isInLaunchWindow(p: AnyProduct): boolean {
  return !!p.is_published && daysSince(p.created_at) < LAUNCH_WINDOW_DAYS;
}

export function launchDaysLeft(p: AnyProduct): number {
  return Math.max(0, LAUNCH_WINDOW_DAYS - daysSince(p.created_at));
}

export type FixKind = 'cover' | 'description' | 'price' | 'share' | 'affiliate';

export type FirstSaleIssue = {
  kind: FixKind;
  titleFr: string;
  titleEn: string;
  hintFr: string;
  hintEn: string;
};

const ISSUES: Record<FixKind, FirstSaleIssue> = {
  cover: {
    kind: 'cover',
    titleFr: 'Aucune couverture',
    titleEn: 'No cover image',
    hintFr: "Une couverture double les clics. Ajoutez-en une, même simple.",
    hintEn: 'A cover doubles clicks. Add one, even a simple one.',
  },
  description: {
    kind: 'description',
    titleFr: 'Description trop courte',
    titleEn: 'Description too short',
    hintFr: 'Dites en 3 lignes ce que l’acheteur obtient et pour qui c’est.',
    hintEn: 'Say in 3 lines what the buyer gets and who it is for.',
  },
  price: {
    kind: 'price',
    titleFr: 'Prix probablement trop haut',
    titleEn: 'Price likely too high',
    hintFr: 'Un premier prix bas crée la première vente, puis la preuve sociale.',
    hintEn: 'A low entry price creates the first sale, then social proof.',
  },
  share: {
    kind: 'share',
    titleFr: 'Jamais partagé',
    titleEn: 'Never shared',
    hintFr: 'Récupérez le visuel + le message prêt à envoyer sur WhatsApp.',
    hintEn: 'Grab the flyer + ready-to-send WhatsApp message.',
  },
  affiliate: {
    kind: 'affiliate',
    titleFr: 'Aucune commission ambassadeur',
    titleEn: 'No ambassador commission',
    hintFr: 'Une commission visible pousse d’autres à vendre pour vous.',
    hintEn: 'A visible commission gets others selling for you.',
  },
};

/** High price threshold per currency-agnostic heuristic (XOF-scale amounts). */
const HIGH_PRICE = 15000;

export function diagnoseFirstSale(p: AnyProduct, opts?: { shared?: boolean }): FirstSaleIssue[] {
  const issues: FirstSaleIssue[] = [];
  if (!p.cover_image_url) issues.push(ISSUES.cover);
  if (!p.description || String(p.description).replace(/<[^>]*>/g, '').trim().length < 120) issues.push(ISSUES.description);
  if (!p.is_free && (p.price || 0) > HIGH_PRICE) issues.push(ISSUES.price);
  if (opts?.shared === false) issues.push(ISSUES.share);
  if (!p.commission_rate) issues.push(ISSUES.affiliate);
  return issues;
}

/** Published, past the launch window, still zero sales → needs the intervention card. */
export function needsIntervention(p: AnyProduct): boolean {
  return !!p.is_published && (p.sales_count || 0) === 0 && daysSince(p.created_at) >= LAUNCH_WINDOW_DAYS;
}

const SHARE_KEY = 'sv_shared_products';

export function markShared(productId: string) {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(productId)) {
      list.push(productId);
      localStorage.setItem(SHARE_KEY, JSON.stringify(list.slice(-200)));
    }
  } catch { /* ignore */ }
}

export function wasShared(productId: string): boolean {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(productId) : false;
  } catch {
    return false;
  }
}
