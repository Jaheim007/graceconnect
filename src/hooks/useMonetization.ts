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
      if (publishedOnly) q = q.eq('is_published', true).eq('is_active', true);
      const { data } = await q;
      return (data || []) as DonationCampaign[];
    },
    enabled: !!orgId,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DonationCampaign>) => {
      const { data, error } = await db.from('donation_campaigns').insert(payload).select().single();
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
      if (publishedOnly) q = q.eq('is_published', true);
      const { data } = await q;
      return (data || []) as DigitalProduct[];
    },
    enabled: !!orgId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DigitalProduct>) => {
      const { data, error } = await db.from('digital_products').insert(payload).select().single();
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
