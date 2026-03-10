import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { DonationCampaign, DigitalProduct } from '@/types/database';

// --- Campaigns ---
export function useOrgCampaigns(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-campaigns', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('donation_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (publishedOnly) q = q.eq('is_published', true).eq('is_active', true).eq('is_express_demo', false);
      const { data } = await q;
      return (data || []) as DonationCampaign[];
    },
    enabled: !!orgId,
  });
}

export function useFeedCampaigns(orgIds: string[]) {
  return useQuery({
    queryKey: ['feed-campaigns', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, is_verified)')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
        is_org_verified: c.organizations?.is_verified ?? false,
      })) as DonationCampaign[];
    },
    enabled: orgIds.length > 0,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DonationCampaign>) => {
      const { data, error } = await db.from('donation_campaigns').insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<DonationCampaign>) => {
      qc.invalidateQueries({ queryKey: ['org-campaigns', vars.organization_id] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DonationCampaign> }) => {
      const { data, error } = await db
        .from('donation_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: DonationCampaign) => {
      qc.invalidateQueries({ queryKey: ['org-campaigns', data.organization_id] });
    },
  });
}

// --- Products ---
export function useOrgProducts(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-products', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('digital_products')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (publishedOnly) {
        q = q.eq('is_published', true).eq('is_express_demo', false);
      }
      const { data } = await q;
      return (data || []) as DigitalProduct[];
    },
    enabled: !!orgId,
  });
}

export function useFeedProducts(orgIds: string[]) {
  return useQuery({
    queryKey: ['feed-products', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url)')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
      })) as DigitalProduct[];
    },
    enabled: orgIds.length > 0,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DigitalProduct>) => {
      const { data, error } = await db.from('digital_products').insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<DigitalProduct>) => {
      qc.invalidateQueries({ queryKey: ['org-products', vars.organization_id] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DigitalProduct> }) => {
      const { data, error } = await db
        .from('digital_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: DigitalProduct) => {
      qc.invalidateQueries({ queryKey: ['org-products', data.organization_id] });
    },
  });
}
