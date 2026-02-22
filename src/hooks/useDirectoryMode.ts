import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

export type DirectoryMode = 'curated' | 'public' | 'invite_only';

export function useDirectoryMode() {
  return useQuery({
    queryKey: ['platform-directory-mode'],
    queryFn: async () => {
      const { data } = await db.from('platform_settings')
        .select('value')
        .eq('key', 'directory_mode')
        .maybeSingle();
      return (data?.value as DirectoryMode) || 'curated';
    },
    staleTime: 1000 * 60 * 10,
  });
}
