import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const COURSE_LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', fr: 'Français', en: 'French' },
  { code: 'en', flag: '🇬🇧', fr: 'Anglais', en: 'English' },
  { code: 'es', flag: '🇪🇸', fr: 'Espagnol', en: 'Spanish' },
  { code: 'pt', flag: '🇵🇹', fr: 'Portugais', en: 'Portuguese' },
  { code: 'de', flag: '🇩🇪', fr: 'Allemand', en: 'German' },
  { code: 'it', flag: '🇮🇹', fr: 'Italien', en: 'Italian' },
  { code: 'ar', flag: '🇸🇦', fr: 'Arabe', en: 'Arabic' },
  { code: 'sw', flag: '🇰🇪', fr: 'Swahili', en: 'Swahili' },
] as const;

export type DuplicateCourseInput = {
  programId: string;
  orgId: string;
  /** When set (with translate), the copy is fully translated into this language. */
  targetLanguage?: string | null;
  translate?: boolean;
  tier?: 'standard' | 'premium';
};

/**
 * Duplicates a full course (modules, lessons, slides, quizzes, flashcards)
 * server-side. Optionally translates every text field into another language.
 * The duplicate is always created as an unpublished draft.
 */
export function useDuplicateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DuplicateCourseInput) => {
      const { data, error } = await supabase.functions.invoke('duplicate-course', {
        body: {
          program_id: input.programId,
          org_id: input.orgId,
          translate: !!input.translate,
          target_language: input.translate ? input.targetLanguage : null,
          tier: input.tier || 'standard',
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Duplication failed');
      return data as { program_id: string; translated: boolean; target_language: string | null; lessons: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}
