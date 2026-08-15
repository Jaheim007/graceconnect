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
  workspaceReady: boolean;
  refetchOrgs: () => Promise<void>;
  joinOrg: (orgId: string) => Promise<{ error: Error | null }>;
  leaveOrg: (orgId: string) => Promise<{ error: Error | null }>;
  isMemberOf: (orgId: string) => boolean;
  canManage: (orgId: string) => boolean;
  canAdmin: (orgId: string) => boolean;
  getRoleFor: (orgId: string) => OrgMemberRole | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const CURRENT_ORG_STORAGE_KEY = 'sv_current_org_id';
const RECENT_WORKSPACES_STORAGE_KEY = 'sv_recent_workspace_ids';
const MANAGEABLE_ROLES: OrgMemberRole[] = ['owner', 'admin', 'editor'];

const isManageableRole = (role: OrgMemberRole | string | null | undefined) =>
  MANAGEABLE_ROLES.includes(role as OrgMemberRole);

const readCurrentWorkspaceId = () => {
  try {
    const saved = localStorage.getItem(CURRENT_ORG_STORAGE_KEY);
    if (saved === '__personal__') {
      localStorage.removeItem(CURRENT_ORG_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

const readRecentWorkspaceIds = () => {
  try {
    const raw = localStorage.getItem(RECENT_WORKSPACES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
  } catch {
    return [];
  }
};

const persistWorkspaceId = (orgId: string | null) => {
  try {
    if (!orgId) {
      localStorage.removeItem(CURRENT_ORG_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CURRENT_ORG_STORAGE_KEY, orgId);
    const recent = readRecentWorkspaceIds().filter((id) => id !== orgId && id !== '__personal__');
    localStorage.setItem(RECENT_WORKSPACES_STORAGE_KEY, JSON.stringify([orgId, ...recent].slice(0, 12)));
  } catch {}
};

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

      const byOrgId = new Map<string, OrganizationMember & { organizations: Organization }>();
      ((data || []) as Array<OrganizationMember & { organizations: Organization | null }>).forEach((row) => {
        if (row.organizations) {
          byOrgId.set(row.organization_id, row as OrganizationMember & { organizations: Organization });
        }
      });

      // Safety net for legacy rows: an owner must be manageable even if their
      // organization_members row is missing/stale. Validation still happens
      // against the hydrated manageable list before any restore is accepted.
      const { data: ownedOrgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id);

      ((ownedOrgs || []) as Organization[]).forEach((org) => {
        const existing = byOrgId.get(org.id);
        byOrgId.set(org.id, {
          ...(existing || {
            id: `owner-${org.id}`,
            organization_id: org.id,
            user_id: user.id,
            role: 'owner' as OrgMemberRole,
            joined_at: org.created_at,
          }),
          role: 'owner' as OrgMemberRole,
          organizations: org,
        });
      });

      return Array.from(byOrgId.values());
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
  const manageableOrgs = useMemo(
    () => userOrgs.filter((o) => isManageableRole(membershipMap[o.id])),
    [userOrgs, membershipMap],
  );

  useEffect(() => {
    if (!user) {
      setCurrentOrgState(null);
      setWorkspaceRestored(false);
      restoredRef.current = false;
      restoredUserIdRef.current = null;
      return;
    }

    if (restoredUserIdRef.current !== user.id) {
      restoredUserIdRef.current = user.id;
      restoredRef.current = false;
      setCurrentOrgState(null);
      setWorkspaceRestored(false);
    }
  }, [user?.id, user]);

  // Restore currentOrg globally before the signed-in shell renders.
  // SiteViral has no selectable "Personal" workspace: if the account can
  // manage at least one workspace, a valid workspace must always be selected.
  useEffect(() => {
    if (!user) return;
    if (!isFetched || isLoading || isError) return;

    const currentIsManageable = !!currentOrg && manageableOrgs.some((o) => o.id === currentOrg.id);

    const selectRestoredOrg = (org: Organization | null) => {
      setCurrentOrgState(org);
      if (org) {
        persistWorkspaceId(org.id);
      } else {
        persistWorkspaceId(null);
      }
      restoredRef.current = true;
      setWorkspaceRestored(true);
    };

    const resolveFallbackOrg = () => {
      const saved = readCurrentWorkspaceId();
      if (saved) {
        const savedOrg = manageableOrgs.find((o) => o.id === saved);
        if (savedOrg) return savedOrg;
      }

      const recentOrg = readRecentWorkspaceIds()
        .map((id) => manageableOrgs.find((o) => o.id === id))
        .find((org): org is Organization => !!org);

      return recentOrg ?? manageableOrgs[0] ?? null;
    };

    // If we already have a valid manageable currentOrg in this list, keep it.
    if (currentIsManageable) {
      persistWorkspaceId(currentOrg.id);
      restoredRef.current = true;
      if (!workspaceRestored) setWorkspaceRestored(true);
      return;
    }

    // Zero manageable workspaces is the only valid account-level empty state.
    if (manageableOrgs.length === 0) {
      if (currentOrg) {
        selectRestoredOrg(null);
        return;
      }
      persistWorkspaceId(null);
      restoredRef.current = true;
      if (!workspaceRestored) setWorkspaceRestored(true);
      return;
    }

    // Current workspace is missing, stale, or no longer manageable — repair it
    // globally before AppLayout/AdaptiveLayout render the signed-in shell.
    selectRestoredOrg(resolveFallbackOrg());
  }, [manageableOrgs, currentOrg, user, isFetched, isLoading, isError, workspaceRestored]);

  const setCurrentOrg = useCallback((org: Organization | null) => {
    const prev = currentOrg;
    setCurrentOrgState(org);
    if (org) {
      persistWorkspaceId(org.id);
    } else {
      persistWorkspaceId(null);
    }
    setWorkspaceRestored(true);
    // Invalidate all org-scoped queries when switching to a different org
    if (org && prev && org.id !== prev.id) {
      qc.invalidateQueries();
    }
  }, [currentOrg, qc]);

  const refetchOrgs = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    await refetchMembers();
  }, [refetchMembers, qc, user?.id]);

  const currentOrgRole = currentOrg
    ? (membershipMap[currentOrg.id] as OrgMemberRole) ?? null
    : null;

  const currentOrgIsManageable = !!currentOrg && manageableOrgs.some((o) => o.id === currentOrg.id);
  const workspaceReady = !authLoading && (!user || (
    isFetched && !isLoading && !isError && workspaceRestored && (
      manageableOrgs.length === 0 || currentOrgIsManageable
    )
  ));

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
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
      onMemberLeft(user.id, userName, orgId, org?.name || 'une organisation');
    }
    return { error: error as Error | null };
  };

  const isMemberOf = useCallback((orgId: string) => !!membershipMap[orgId], [membershipMap]);
  const canManage = useCallback((orgId: string) => isManageableRole(membershipMap[orgId]), [membershipMap]);
  const canAdmin = useCallback(
    (orgId: string) => ['owner', 'admin'].includes(membershipMap[orgId] || ''),
    [membershipMap],
  );
  const getRoleFor = useCallback(
    (orgId: string): OrgMemberRole | null => (membershipMap[orgId] as OrgMemberRole) ?? null,
    [membershipMap],
  );
  return (
    <OrgContext.Provider
      value={{
        userOrgs,
        currentOrg,
        currentOrgRole,
        setCurrentOrg,
        isLoadingOrgs: !workspaceReady,
        workspaceReady,
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
