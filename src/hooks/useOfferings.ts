import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

export interface Offering {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_recurring_allowed: boolean;
  preset_amounts: number[];
  currency: string;
  display_order: number;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrgOfferings(orgId: string | undefined, activeOnly = true) {
  return useQuery({
    queryKey: ['org-offerings', orgId, activeOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('offerings')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true });
      if (activeOnly) q = q.eq('is_active', true);
      const { data } = await q;
      return (data || []) as Offering[];
    },
    enabled: !!orgId,
  });
}

export function useCreateOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Offering>) => {
      const { data, error } = await db.from('offerings').insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<Offering>) => {
      qc.invalidateQueries({ queryKey: ['org-offerings', vars.organization_id] });
    },
  });
}

export function useUpdateOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Offering> }) => {
      const { data, error } = await db
        .from('offerings')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['org-offerings', data.organization_id] });
    },
  });
}

export function useDeleteOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await db.from('offerings').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId: string) => {
      qc.invalidateQueries({ queryKey: ['org-offerings', orgId] });
    },
  });
}
