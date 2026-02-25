import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  allowed_roles?: string[];
}

export function useMaintenanceMode() {
  const { data } = useQuery({
    queryKey: ['platform-settings', 'maintenance_mode'],
    queryFn: async () => {
      const { data } = await db
        .from('platform_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      return (data?.value as unknown as MaintenanceConfig) || { enabled: false };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  return {
    isMaintenanceMode: data?.enabled ?? false,
    message: data?.message,
  };
}

export function useFeatureFlags() {
  const { data } = useQuery({
    queryKey: ['platform-settings', 'feature_flags'],
    queryFn: async () => {
      const { data } = await db
        .from('platform_settings')
        .select('value')
        .eq('key', 'feature_flags')
        .maybeSingle();
      return (data?.value as Record<string, boolean>) || {};
    },
    staleTime: 60000,
  });

  return {
    flags: data || {},
    isEnabled: (flag: string) => data?.[flag] ?? false,
  };
}
