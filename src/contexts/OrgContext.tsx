import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Organization, OrganizationMember, OrgMemberRole } from '@/types/database';
import { useAuth } from './AuthContext';

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
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);

  const { data: memberRows = [], refetch: refetchMembers, isLoading } = useQuery({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id);
      return (data || []) as Array<OrganizationMember & { organizations: Organization }>;
    },
    enabled: !!user,
  });

  const userOrgs = memberRows.map((m) => m.organizations).filter(Boolean);
  const membershipMap = Object.fromEntries(
    memberRows.map((m) => [m.organization_id, m.role])
  );

  // Restore currentOrg from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gc_current_org_id');
    if (saved && userOrgs.length > 0) {
      const found = userOrgs.find((o) => o.id === saved);
      if (found) setCurrentOrgState(found);
      else setCurrentOrgState(userOrgs[0]);
    } else if (userOrgs.length > 0 && !currentOrg) {
      setCurrentOrgState(userOrgs[0]);
    }
  }, [userOrgs.length]);

  const setCurrentOrg = useCallback((org: Organization | null) => {
    setCurrentOrgState(org);
    if (org) localStorage.setItem('gc_current_org_id', org.id);
    else localStorage.removeItem('gc_current_org_id');
  }, []);

  const currentOrgRole = currentOrg
    ? (membershipMap[currentOrg.id] as OrgMemberRole) ?? null
    : null;

  const joinOrg = async (orgId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await db.from('organization_members').insert({
      organization_id: orgId,
      user_id: user.id,
      role: 'member',
    });
    if (!error) refetchMembers();
    return { error: error as Error | null };
  };

  const leaveOrg = async (orgId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await db
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', user.id);
    if (!error) {
      refetchMembers();
      if (currentOrg?.id === orgId) setCurrentOrg(null);
    }
    return { error: error as Error | null };
  };

  const isMemberOf = (orgId: string) => !!membershipMap[orgId];
  const canManage = (orgId: string) =>
    ['owner', 'admin', 'editor'].includes(membershipMap[orgId] || '');
  const canAdmin = (orgId: string) =>
    ['owner', 'admin'].includes(membershipMap[orgId] || '');

  return (
    <OrgContext.Provider
      value={{
        userOrgs,
        currentOrg,
        currentOrgRole,
        setCurrentOrg,
        isLoadingOrgs: isLoading,
        refetchOrgs: refetchMembers,
        joinOrg,
        leaveOrg,
        isMemberOf,
        canManage,
        canAdmin,
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
