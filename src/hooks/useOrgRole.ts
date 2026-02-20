import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { OrgMemberRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useOrgRole(orgId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['org-role', user?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId) return null;
      const { data } = await db
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single();
      return (data?.role as OrgMemberRole) || null;
    },
    enabled: !!user && !!orgId,
  });
}

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('organization_members')
        .select('*, profiles(display_name, avatar_url)')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });
}
