import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationMember, OrgMemberRole } from '@/types/database';
import { useAuth } from './AuthContext';
import { onMemberJoined, onMemberLeft } from '@/lib/notifications';

interface OrgContextType {
  userOrgs: Organization[];
  currentOrg: Organization | null;
  currentOrgRole: OrgMemberRole | null;
  setCurrentOrg: (org: Organization | null) => void;
  isLoadingOrgs: boolean;
  refetchOrgs: () => void;
  joinOrg: (orgId: string) => Promise<{ error: Error | null }>;
  leaveOrg: (orgId: string) => Promise<{ error: Error | null }>;
  isMemberOf: (orgId: string) => boolean;
  canManage: (orgId: string) => boolean;
  canAdmin: (orgId: string) => boolean;
  getRoleFor: (orgId: string) => OrgMemberRole | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  // Track whether we've done the initial restore from localStorage
  const restoredRef = useRef(false);

  const { data: memberRows = [], refetch: refetchMembers, isLoading } = useQuery({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as Array<OrganizationMember & { organizations: Organization }>;
    },
    enabled: !!user,
    // Retry on failure so transient network errors don't leave the user stuck
    retry: 3,
    retryDelay: 1000,
  });

  const userOrgs = memberRows.map((m) => m.organizations).filter(Boolean);
  const membershipMap = Object.fromEntries(
    memberRows.map((m) => [m.organization_id, m.role])
  );

  // Restore or auto-select currentOrg when orgs list changes
  useEffect(() => {
    if (userOrgs.length === 0) return;

    // If we already have a valid currentOrg in this list, keep it
    if (currentOrg && userOrgs.find((o) => o.id === currentOrg.id)) return;

    // First time: try to restore from localStorage
    if (!restoredRef.current) {
      restoredRef.current = true;
      const saved = localStorage.getItem('sv_current_org_id');
      if (saved) {
        const found = userOrgs.find((o) => o.id === saved);
        if (found) {
          setCurrentOrgState(found);
          return;
        }
      }
    }

    // Fallback: pick the first org
    setCurrentOrgState(userOrgs[0]);
  }, [userOrgs, currentOrg]);

  // Clear currentOrg when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentOrgState(null);
      restoredRef.current = false;
    }
  }, [user]);

  const setCurrentOrg = useCallback((org: Organization | null) => {
    const prev = currentOrg;
    setCurrentOrgState(org);
    if (org) localStorage.setItem('sv_current_org_id', org.id);
    else localStorage.removeItem('sv_current_org_id');
    // Invalidate all org-scoped queries when switching to a different org
    if (org && prev && org.id !== prev.id) {
      qc.invalidateQueries();
    }
  }, [currentOrg, qc]);

  const refetchOrgs = useCallback(() => {
    refetchMembers();
    qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
  }, [refetchMembers, qc, user?.id]);

  const currentOrgRole = currentOrg
    ? (membershipMap[currentOrg.id] as OrgMemberRole) ?? null
    : null;

  const joinOrg = async (orgId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: user.id,
      role: 'member',
    });
    if (!error) {
      refetchOrgs();
      // Find org name for notification
      const org = userOrgs.find(o => o.id === orgId);
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
      onMemberJoined(user.id, user.email || undefined, userName, orgId, org?.name || 'Organization');
    }
    return { error: error as Error | null };
  };

  const leaveOrg = async (orgId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const org = userOrgs.find(o => o.id === orgId);
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', user.id);
    if (!error) {
      refetchOrgs();
      if (currentOrg?.id === orgId) setCurrentOrg(null);
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
      onMemberLeft(user.id, userName, orgId, org?.name || 'Organization');
    }
    return { error: error as Error | null };
  };

  const isMemberOf = (orgId: string) => !!membershipMap[orgId];
  const canManage = (orgId: string) =>
    ['owner', 'admin', 'editor'].includes(membershipMap[orgId] || '');
  const canAdmin = (orgId: string) =>
    ['owner', 'admin'].includes(membershipMap[orgId] || '');
  const getRoleFor = (orgId: string): OrgMemberRole | null =>
    (membershipMap[orgId] as OrgMemberRole) ?? null;
  return (
    <OrgContext.Provider
      value={{
        userOrgs,
        currentOrg,
        currentOrgRole,
        setCurrentOrg,
        isLoadingOrgs: isLoading,
        refetchOrgs,
        joinOrg,
        leaveOrg,
        isMemberOf,
        canManage,
        canAdmin,
        getRoleFor,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
