import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export interface OrgDomain {
  id: string;
  organization_id: string;
  domain: string;
  domain_type: 'subdomain' | 'custom';
  is_verified: boolean;
  is_primary: boolean;
  ssl_status: string;
  dns_instructions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useOrgDomains(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-domains', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await db
        .from('org_domains')
        .select('*')
        .eq('organization_id', orgId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgDomain[];
    },
    enabled: !!orgId,
  });
}

export function useCheckDomainAvailability() {
  return useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await db
        .from('org_domains')
        .select('id')
        .eq('domain', domain)
        .limit(1)
        .single();
      return !data; // available if not found
    },
  });
}

export function useAddOrgDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orgId,
      domain,
      domainType,
    }: {
      orgId: string;
      domain: string;
      domainType: 'subdomain' | 'custom';
    }) => {
      const isSubdomain = domainType === 'subdomain';
      const { data, error } = await db
        .from('org_domains')
        .insert({
          organization_id: orgId,
          domain,
          domain_type: domainType,
          is_verified: isSubdomain, // subdomains are auto-verified
          is_primary: false,
          ssl_status: isSubdomain ? 'active' : 'pending',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['org-domains', vars.orgId] });
    },
  });
}

export function useSetPrimaryDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, domainId }: { orgId: string; domainId: string }) => {
      // Unset all primary first
      await db
        .from('org_domains')
        .update({ is_primary: false } as any)
        .eq('organization_id', orgId);
      // Set new primary
      const { error } = await db
        .from('org_domains')
        .update({ is_primary: true } as any)
        .eq('id', domainId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['org-domains', vars.orgId] });
    },
  });
}

export function useDeleteOrgDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, domainId }: { orgId: string; domainId: string }) => {
      const { error } = await db
        .from('org_domains')
        .delete()
        .eq('id', domainId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['org-domains', vars.orgId] });
    },
  });
}
