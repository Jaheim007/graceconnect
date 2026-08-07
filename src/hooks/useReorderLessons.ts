import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Persist a new lesson ordering inside a module.
 * `program_lessons` carries both `display_order` and legacy `order_index`;
 * both are written so old readers stay consistent.
 */
export function useReorderLessons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderedIds, programId }: { orderedIds: string[]; programId: string }) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          (db as any)
            .from('program_lessons')
            .update({ display_order: index, order_index: index })
            .eq('id', id),
        ),
      );
      return programId;
    },
    onSuccess: (programId) => {
      qc.invalidateQueries({ queryKey: ['program-modules', programId] });
    },
  });
}
