import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_MODULE_IDS, MANDATORY_MODULES, ModuleId, isMandatoryModule } from '@/lib/dashboardModules';

/** Read + write the current user's enabled dashboard modules.
 *  Mandatory modules (KYC, affiliation, payments, orders, digital products) are
 *  ALWAYS included in `modules` — they cannot be toggled off. Only optional
 *  family modules are persisted / toggled. */
export function useEnabledModules() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['enabled-modules', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('enabled_modules, account_mode')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      const stored = ((data?.enabled_modules ?? []) as ModuleId[]).filter((m) =>
        ALL_MODULE_IDS.includes(m),
      );
      // Merge mandatory + stored optional, dedup, preserve mandatory-first order
      const merged = Array.from(new Set<ModuleId>([...MANDATORY_MODULES, ...stored]));
      return {
        modules: merged,
        optionalModules: stored.filter((m) => !isMandatoryModule(m)),
        accountMode: (data?.account_mode ?? 'client') as 'client' | 'provider' | 'both',
      };
    },
    staleTime: 30_000,
  });

  const setModules = useMutation({
    mutationFn: async (next: ModuleId[]) => {
      if (!user) throw new Error('not authed');
      // Never persist mandatory modules — they are always implicit.
      const clean = next.filter((m) => !isMandatoryModule(m));
      const { error } = await supabase
        .from('profiles')
        .update({ enabled_modules: clean })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enabled-modules', user?.id] }),
  });

  const toggle = (id: ModuleId) => {
    if (isMandatoryModule(id)) return Promise.resolve(); // cannot toggle
    const current = query.data?.optionalModules ?? [];
    const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
    return setModules.mutateAsync(next);
  };

  return {
    modules: query.data?.modules ?? [],
    accountMode: query.data?.accountMode ?? 'client',
    isLoading: query.isLoading,
    toggle,
    setModules: setModules.mutateAsync,
    isSaving: setModules.isPending,
  };
}
