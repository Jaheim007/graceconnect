import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
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
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  // Track whether we've done the initial restore from localStorage for this user
  const restoredRef = useRef(false);
  const restoredUserIdRef = useRef<string | null>(null);

  const { data: memberRows = [], refetch: refetchMembers, isLoading, isFetched, isError } = useQuery({
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
    enabled: !authLoading && !!user,
    // Retry on failure so transient network errors don't leave the user stuck
    retry: 6,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!user || !isError) return;

    const retryTimer = window.setTimeout(() => {
      refetchMembers();
    }, 2000);

    return () => window.clearTimeout(retryTimer);
  }, [user, isError, refetchMembers]);

  const userOrgs = useMemo(
    () => memberRows.map((m) => m.organizations).filter(Boolean),
    [memberRows],
  );
  const membershipMap = useMemo(
    () => Object.fromEntries(memberRows.map((m) => [m.organization_id, m.role])),
    [memberRows],
  );

  // Restore currentOrg globally before the signed-in shell renders.
  // SiteViral has no selectable "Personal" workspace: if the account can
  // manage at least one workspace, a valid workspace must always be selected.
  useEffect(() => {
    if (!user) return;
    if (!isFetched || isLoading || isError) return;

    if (restoredUserIdRef.current !== user.id) {
      restoredUserIdRef.current = user.id;
      restoredRef.current = false;
      setWorkspaceRestored(false);
    }

    const manageableOrgs = userOrgs.filter((o) => ['owner', 'admin', 'editor'].includes(membershipMap[o.id] || ''));
    const currentIsManageable = !!currentOrg && manageableOrgs.some((o) => o.id === currentOrg.id);

    const selectRestoredOrg = (org: Organization | null) => {
      setCurrentOrgState(org);
      if (org) {
        localStorage.setItem('sv_current_org_id', org.id);
      } else {
        try { localStorage.removeItem('sv_current_org_id'); } catch {}
      }
      setWorkspaceRestored(true);
    };

    // If we already have a valid manageable currentOrg in this list, keep it.
    if (currentIsManageable) {
      if (!workspaceRestored) setWorkspaceRestored(true);
      return;
    }

    // Current workspace became invalid/non-manageable — repair globally.
    if (currentOrg) {
      selectRestoredOrg(manageableOrgs[0] ?? null);
      return;
    }

    if (!restoredRef.current) {
      restoredRef.current = true;
      const saved = localStorage.getItem('sv_current_org_id');
      // Legacy sentinel from the old Personal model — treat as "no workspace".
      if (saved === '__personal__') {
        try { localStorage.removeItem('sv_current_org_id'); } catch {}
        selectRestoredOrg(manageableOrgs[0] ?? null);
        return;
      }
      if (saved) {
        const found = manageableOrgs.find((o) => o.id === saved);
        if (found) {
          selectRestoredOrg(found);
          return;
        }
      }
      selectRestoredOrg(manageableOrgs[0] ?? null);
    }
  }, [userOrgs, currentOrg, user, isFetched, isLoading, isError, workspaceRestored, membershipMap]);

  // Clear currentOrg when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentOrgState(null);
      setWorkspaceRestored(false);
      restoredRef.current = false;
      restoredUserIdRef.current = null;
      try { localStorage.removeItem('sv_current_org_id'); } catch {}
    }
  }, [user]);

  const setCurrentOrg = useCallback((org: Organization | null) => {
    const prev = currentOrg;
    setCurrentOrgState(org);
    if (org) {
      localStorage.setItem('sv_current_org_id', org.id);
    } else {
      try { localStorage.removeItem('sv_current_org_id'); } catch {}
    }
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
      // Fetch org name directly — userOrgs doesn't contain it yet since user just joined
      let orgName = 'une organisation';
      const localOrg = userOrgs.find(o => o.id === orgId);
      if (localOrg?.name) {
        orgName = localOrg.name;
      } else {
        const { data: orgRow } = await supabase.from('organizations').select('name').eq('id', orgId).single();
        if (orgRow?.name) orgName = orgRow.name;
      }
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
      onMemberJoined(user.id, user.email || undefined, userName, orgId, orgName);
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
      onMemberLeft(user.id, userName, orgId, org?.name || 'une organisation');
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
        isLoadingOrgs: authLoading || (!!user && (!isFetched || isError || !workspaceRestored)) || isLoading,
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
