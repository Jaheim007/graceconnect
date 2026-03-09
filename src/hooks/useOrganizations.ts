import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Organization } from '@/types/database';

interface UseOrgsOptions {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export function usePublicOrgs(options: UseOrgsOptions = {}) {
  const { search = '', category = '', page = 0, pageSize = 12 } = options;

  return useQuery({
    queryKey: ['public-orgs', search, category, page],
    queryFn: async () => {
      let query = db
        .from('organizations')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (search) query = query.ilike('name', `%${search}%`);
      if (category) query = query.eq('category', category as any);

      const { data, count, error } = await query;
      return { orgs: (data || []) as Organization[], total: count || 0, error };
    },
  });
}

export function useOrgBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['org-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await db
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      return data as Organization | null;
    },
    enabled: !!slug,
  });
}

export function useOrgById(id: string | undefined) {
  return useQuery({
    queryKey: ['org-by-id', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      return data as Organization | null;
    },
    enabled: !!id,
  });
}

export function useAllOrgsAdmin() {
  return useQuery({
    queryKey: ['admin-all-orgs'],
    queryFn: async () => {
      const { data } = await db
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as Organization[];
    },
  });
}

export function useUpdateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Organization> }) => {
      const { data, error } = await db
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-by-id'] });
      qc.invalidateQueries({ queryKey: ['org-by-slug'] });
    },
  });
}
