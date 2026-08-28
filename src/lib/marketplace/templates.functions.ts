import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const publishMarketplaceTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    source_product_id: string;
    kind?: string | null;
    clone_price?: number | null;
    currency?: string | null;
    author_commission_percent?: number | null;
    description?: string | null;
    tags?: string[] | null;
    language?: string | null;
  }) => {
    if (!input?.source_product_id) throw new Error('source_product_id required');
    return {
      source_product_id: String(input.source_product_id),
      kind: input.kind ?? null,
      clone_price: input.clone_price ?? null,
      currency: input.currency ?? null,
      author_commission_percent: input.author_commission_percent ?? null,
      description: input.description ?? null,
      tags: input.tags ?? null,
      language: input.language ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    const { publishTemplate } = await import('./templates.server');
    return publishTemplate(context.userId, data);
  });

export const moderateMarketplaceTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { template_id: string; decision: string; rejection_reason?: string | null }) => {
    if (!input?.template_id) throw new Error('template_id required');
    if (!input?.decision) throw new Error('decision required');
    return {
      template_id: String(input.template_id),
      decision: String(input.decision),
      rejection_reason: input.rejection_reason ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    const { moderateTemplate } = await import('./templates.server');
    return moderateTemplate(context.userId, data);
  });

export const cloneMarketplaceTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { template_id: string; target_org_id: string }) => {
    if (!input?.template_id) throw new Error('template_id required');
    if (!input?.target_org_id) throw new Error('target_org_id required');
    return {
      template_id: String(input.template_id),
      target_org_id: String(input.target_org_id),
    };
  })
  .handler(async ({ data, context }) => {
    const { cloneTemplate } = await import('./templates.server');
    return cloneTemplate(context.userId, data);
  });
