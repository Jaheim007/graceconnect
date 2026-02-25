import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useCallback, useRef, useEffect } from 'react';

interface UseInfiniteListOptions {
  queryKey: string[];
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteList<T = any>({
  queryKey,
  table,
  select = '*',
  filters = {},
  orderBy = 'created_at',
  ascending = false,
  pageSize = 20,
  enabled = true,
}: UseInfiniteListOptions) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      let q = db.from(table as any).select(select);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          q = q.eq(key, value as any);
        }
      });

      const { data, error } = await q
        .order(orderBy, { ascending })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      if (error) throw error;
      return { items: (data || []) as T[], page: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < pageSize) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 0,
    enabled,
  });

  const allItems = query.data?.pages.flatMap(p => p.items) || [];

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !query.hasNextPage || query.isFetchingNextPage) return;

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage) {
          query.fetchNextPage();
        }
      }, { rootMargin: '200px' });

      observerRef.current.observe(node);
    },
    [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]
  );

  // Cleanup
  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return {
    items: allItems,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    sentinelRef,
    refetch: query.refetch,
  };
}
