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
      // Fetch members first, then join profiles manually since
      // organization_members.user_id → auth.users (not profiles directly)
      const { data: members, error } = await db
        .from('organization_members')
        .select('id, user_id, role, joined_at, invited_by, organization_id')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: false });
      if (error || !members || members.length === 0) return members || [];

      // Fetch profiles for all member user_ids
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles } = await db
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, p])
      );

      return members.map((m: any) => ({
        ...m,
        profiles: profileMap[m.user_id] || null,
      }));
    },
    enabled: !!orgId,
  });
}
