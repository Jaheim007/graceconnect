/**
 * Course commerce hooks — selling courses reuses the DIGITAL PRODUCT checkout.
 *
 * A paid course is mirrored by a `digital_products` row with
 * `product_type = 'course'`, and the course now points at it through
 * `programs.linked_product_id`. Checkout, promo codes, affiliate attribution,
 * receipts and payouts therefore go through the exact same
 * PurchaseModal → GeniusPay/Stripe pipeline used for ebooks and other products.
 * No course-specific payment flow exists.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

export interface CourseSalesStat {
  program_id: string;
  enrollments: number;
  completions: number;
  completion_rate: number;
  revenue: number;
  currency: string | null;
}

/**
 * Per-course creator metrics for the org dashboard: enrollment count,
 * completion rate and (for paid courses) revenue from the linked product.
 */
export function useOrgCourseStats(orgId: string | undefined, programs: any[] | undefined) {
  const programIds = (programs || []).map((p) => p.id);
  const productIds = (programs || []).map((p) => p.linked_product_id).filter(Boolean) as string[];

  return useQuery({
    queryKey: ['org-course-stats', orgId, programIds.join(','), productIds.join(',')],
    enabled: !!orgId && programIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const [enrollRes, purchaseRes] = await Promise.all([
        db.from('program_enrollments')
          .select('program_id, progress_percent, completed_at')
          .in('program_id', programIds),
        productIds.length
          ? db.from('product_purchases')
              .select('product_id, amount, currency, status')
              .in('product_id', productIds)
              .eq('status', 'completed')
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const byProgram = new Map<string, CourseSalesStat>();
      programIds.forEach((id) => byProgram.set(id, {
        program_id: id, enrollments: 0, completions: 0, completion_rate: 0, revenue: 0, currency: null,
      }));

      (enrollRes.data || []).forEach((e: any) => {
        const stat = byProgram.get(e.program_id);
        if (!stat) return;
        stat.enrollments += 1;
        if (e.completed_at || (e.progress_percent ?? 0) >= 100) stat.completions += 1;
      });

      const productToProgram = new Map<string, string>();
      (programs || []).forEach((p) => { if (p.linked_product_id) productToProgram.set(p.linked_product_id, p.id); });

      (purchaseRes.data || []).forEach((p: any) => {
        const programId = productToProgram.get(p.product_id);
        if (!programId) return;
        const stat = byProgram.get(programId);
        if (!stat) return;
        stat.revenue += Number(p.amount || 0);
        stat.currency = stat.currency || p.currency || null;
      });

      byProgram.forEach((stat) => {
        stat.completion_rate = stat.enrollments ? Math.round((stat.completions / stat.enrollments) * 100) : 0;
      });

      return Object.fromEntries(byProgram) as Record<string, CourseSalesStat>;
    },
  });
}

export interface CoursePricingInput {
  program_id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_free: boolean;
  price: number;
  currency: string;
}

/**
 * Apply pricing to a course and keep its checkout product in sync.
 *
 * - Free course → price fields cleared, no product needed.
 * - Paid course → creates (or updates) the mirrored `digital_products` row and
 *   stores its id on `programs.linked_product_id`.
 */
export function useSetCoursePricing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CoursePricingInput) => {
      const price = input.is_free ? 0 : Math.max(0, Number(input.price) || 0);

      // Reuse an existing mirror product if the course already has one.
      const { data: program } = await db.from('programs')
        .select('linked_product_id')
        .eq('id', input.program_id)
        .maybeSingle();

      let productId: string | null = (program as any)?.linked_product_id || null;

      if (!input.is_free && price > 0) {
        const payload = {
          organization_id: input.organization_id,
          title: input.title,
          description: input.description || null,
          cover_image_url: input.cover_image_url || null,
          product_type: 'course',
          price,
          currency: input.currency,
          is_free: false,
          is_published: true,
          publication_status: 'published',
          external_link: `/program/${input.program_id}`,
        };

        if (productId) {
          const { error } = await db.from('digital_products').update(payload as any).eq('id', productId);
          if (error) throw error;
        } else {
          const { data, error } = await db.from('digital_products')
            .insert(payload as any)
            .select('id')
            .single();
          if (error) throw error;
          productId = (data as any).id;
        }
      } else if (productId) {
        // Course became free — unpublish the checkout product but keep history.
        await db.from('digital_products')
          .update({ is_published: false, publication_status: 'draft' } as any)
          .eq('id', productId);
      }

      const { error: progErr } = await db.from('programs')
        .update({
          is_free: input.is_free || price === 0,
          price,
          currency: input.currency,
          linked_product_id: input.is_free ? null : productId,
        } as any)
        .eq('id', input.program_id);
      if (progErr) throw progErr;

      return { product_id: productId, price, is_free: input.is_free || price === 0 };
    },
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
      qc.invalidateQueries({ queryKey: ['program', input.program_id] });
      qc.invalidateQueries({ queryKey: ['course-linked-product'] });
      qc.invalidateQueries({ queryKey: ['org-course-stats'] });
    },
  });
}
