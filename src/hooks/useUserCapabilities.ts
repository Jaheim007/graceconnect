import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';
import { getLastSurface } from '@/lib/siteviral/lastSurface';

/**
 * Capabilities are cumulative — a single user can learn (buyer), earn
 * (ambassador) AND create (space owner) at the same time. Never classify a user
 * into a single exclusive role: read the signals independently.
 */
export type Capability = 'learn' | 'earn' | 'create';

export interface ContinueItem {
  kind: 'book' | 'course' | 'sermon_pdf';
  /** purchase id / enrollment id */
  id: string;
  title: string;
  coverUrl: string | null;
  /** for courses */
  programId?: string;
  progressPercent?: number;
  /** for direct files */
  fileUrl?: string | null;
  externalLink?: string | null;
  productType?: string | null;
  at: string;
}

export interface UserCapabilities {
  isLoading: boolean;
  /** has at least one purchase, enrolled course or paid PDF */
  canLearn: boolean;
  /** has at least one active affiliate link */
  canEarn: boolean;
  /** manages at least one space */
  canCreate: boolean;
  library: {
    purchaseCount: number;
    courseCount: number;
    pdfCount: number;
    total: number;
  };
  earnings: {
    pendingAmount: number;
    payableAmount: number;
    paidAmount: number;
    currency: string;
    clicks: number;
    conversions: number;
    linkCount: number;
  };
  spaces: {
    count: number;
    currentName: string | null;
  };
  /** most relevant thing to resume, across books and courses */
  continueItem: ContinueItem | null;
  /** which block should be shown first on the unified home */
  primaryCapability: Capability | null;
  /** capabilities the user has not activated yet */
  inactiveCapabilities: Capability[];
}

const EMPTY: UserCapabilities = {
  isLoading: false,
  canLearn: false,
  canEarn: false,
  canCreate: false,
  library: { purchaseCount: 0, courseCount: 0, pdfCount: 0, total: 0 },
  earnings: {
    pendingAmount: 0,
    payableAmount: 0,
    paidAmount: 0,
    currency: 'XOF',
    clicks: 0,
    conversions: 0,
    linkCount: 0,
  },
  spaces: { count: 0, currentName: null },
  continueItem: null,
  primaryCapability: null,
  inactiveCapabilities: ['learn', 'earn', 'create'],
};

export function useUserCapabilities(): UserCapabilities {
  const { user } = useAuth();
  const { userOrgs, currentOrg, canManage, isLoadingOrgs } = useOrg();

  const manageableOrgs = useMemo(
    () => userOrgs.filter((o) => canManage(o.id)),
    [userOrgs, canManage],
  );

  const { data: learn, isLoading: loadingLearn } = useQuery({
    queryKey: ['capabilities-learn', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [purchases, enrollments, pdfs] = await Promise.all([
        db
          .from('product_purchases')
          .select(
            'id, created_at, completed_at, product_id, digital_products(id, title, cover_image_url, product_type, file_url, external_link)',
          )
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20),
        db
          .from('program_enrollments')
          .select(
            'id, program_id, progress_percent, last_active_at, created_at, programs(id, title, cover_image_url)',
          )
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20),
        (db as any)
          .from('church_sermon_pdf_purchases')
          .select('id, created_at, status')
          .eq('buyer_user_id', user!.id)
          .eq('status', 'completed')
          .limit(20),
      ]);

      return {
        purchases: (purchases.data || []) as any[],
        enrollments: (enrollments.data || []) as any[],
        pdfs: (pdfs?.data || []) as any[],
      };
    },
  });

  const { data: earn, isLoading: loadingEarn } = useQuery({
    queryKey: ['capabilities-earn', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [links, sales] = await Promise.all([
        db
          .from('affiliate_links')
          .select('id, code, clicks, conversions, total_earned, organization_id, created_at')
          .eq('user_id', user!.id)
          .eq('is_active', true),
        db
          .from('affiliate_sales')
          .select('id, commission_amount, status, created_at')
          .eq('affiliate_user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      return {
        links: (links.data || []) as any[],
        sales: (sales.data || []) as any[],
      };
    },
  });

  const isLoading = !!user && (isLoadingOrgs || loadingLearn || loadingEarn);

  return useMemo<UserCapabilities>(() => {
    if (!user) return EMPTY;

    const purchases = learn?.purchases || [];
    const enrollments = learn?.enrollments || [];
    const pdfs = learn?.pdfs || [];
    const links = earn?.links || [];
    const sales = earn?.sales || [];

    const canLearn = purchases.length + enrollments.length + pdfs.length > 0;
    const canEarn = links.length > 0;
    const canCreate = manageableOrgs.length > 0;

    // ---- Continue item: newest activity between books and courses
    const candidates: ContinueItem[] = [];
    const topPurchase = purchases[0];
    if (topPurchase?.digital_products) {
      const p = topPurchase.digital_products;
      candidates.push({
        kind: 'book',
        id: topPurchase.id,
        title: p.title || '',
        coverUrl: p.cover_image_url || null,
        fileUrl: p.file_url || null,
        externalLink: p.external_link || null,
        productType: p.product_type || null,
        at: topPurchase.completed_at || topPurchase.created_at,
      });
    }
    const activeEnrollment = [...enrollments].sort((a, b) => {
      const at = new Date(a.last_active_at || a.created_at).getTime();
      const bt = new Date(b.last_active_at || b.created_at).getTime();
      return bt - at;
    })[0];
    if (activeEnrollment?.programs) {
      candidates.push({
        kind: 'course',
        id: activeEnrollment.id,
        title: activeEnrollment.programs.title || '',
        coverUrl: activeEnrollment.programs.cover_image_url || null,
        programId: activeEnrollment.program_id,
        progressPercent: activeEnrollment.progress_percent ?? 0,
        at: activeEnrollment.last_active_at || activeEnrollment.created_at,
      });
    }
    candidates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const continueItem = candidates[0] || null;

    // ---- Earnings roll-up
    let pendingAmount = 0;
    let payableAmount = 0;
    let paidAmount = 0;
    for (const s of sales) {
      const amt = Number(s.commission_amount || 0);
      if (s.status === 'paid') paidAmount += amt;
      else if (s.status === 'payable') payableAmount += amt;
      else if (s.status === 'pending') pendingAmount += amt;
    }

    // ---- Ordering: last used surface wins, else newest data signal
    const lastSurface = getLastSurface();
    const learnAt = continueItem ? new Date(continueItem.at).getTime() : 0;
    const earnAt = sales[0]
      ? new Date(sales[0].created_at).getTime()
      : links[0]
        ? new Date(links[0].created_at).getTime()
        : 0;

    let primaryCapability: Capability | null = null;
    if (lastSurface) {
      const s = lastSurface.surface;
      if ((s === 'learn' && canLearn) || (s === 'earn' && canEarn) || (s === 'create' && canCreate)) {
        primaryCapability = s;
      }
    }
    if (!primaryCapability) {
      if (canLearn && learnAt >= earnAt) primaryCapability = 'learn';
      else if (canEarn) primaryCapability = 'earn';
      else if (canCreate) primaryCapability = 'create';
    }

    const inactiveCapabilities: Capability[] = [];
    if (!canLearn) inactiveCapabilities.push('learn');
    if (!canEarn) inactiveCapabilities.push('earn');
    if (!canCreate) inactiveCapabilities.push('create');

    return {
      isLoading,
      canLearn,
      canEarn,
      canCreate,
      library: {
        purchaseCount: purchases.length,
        courseCount: enrollments.length,
        pdfCount: pdfs.length,
        total: purchases.length + enrollments.length + pdfs.length,
      },
      earnings: {
        pendingAmount,
        payableAmount,
        paidAmount,
        currency: 'XOF',
        clicks: links.reduce((n, l) => n + Number(l.clicks || 0), 0),
        conversions: links.reduce((n, l) => n + Number(l.conversions || 0), 0),
        linkCount: links.length,
      },
      spaces: {
        count: manageableOrgs.length,
        currentName:
          (currentOrg && canManage(currentOrg.id) ? currentOrg.name : manageableOrgs[0]?.name) ||
          null,
      },
      continueItem,
      primaryCapability,
      inactiveCapabilities,
    };
  }, [user, learn, earn, manageableOrgs, currentOrg, canManage, isLoading]);
}
