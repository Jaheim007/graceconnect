import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_MODULE_IDS, ModuleId } from '@/lib/dashboardModules';

/** Read + write the current user's enabled dashboard modules. */
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
      const modules = (data?.enabled_modules ?? []) as ModuleId[];
      return {
        modules: modules.filter((m) => ALL_MODULE_IDS.includes(m)),
        accountMode: (data?.account_mode ?? 'client') as 'client' | 'provider' | 'both',
      };
    },
    staleTime: 30_000,
  });

  const setModules = useMutation({
    mutationFn: async (next: ModuleId[]) => {
      if (!user) throw new Error('not authed');
      const { error } = await supabase
        .from('profiles')
        .update({ enabled_modules: next })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enabled-modules', user?.id] }),
  });

  const toggle = (id: ModuleId) => {
    const current = query.data?.modules ?? [];
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
