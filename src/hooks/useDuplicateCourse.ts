import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateCourseFn } from '@/lib/programs/duplicateCourse.functions';

export const COURSE_LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', fr: 'Français', en: 'French' },
  { code: 'en', flag: '🇬🇧', fr: 'Anglais', en: 'English' },
  { code: 'es', flag: '🇪🇸', fr: 'Espagnol', en: 'Spanish' },
  { code: 'pt', flag: '🇵🇹', fr: 'Portugais', en: 'Portuguese' },
  { code: 'de', flag: '🇩🇪', fr: 'Allemand', en: 'German' },
  { code: 'it', flag: '🇮🇹', fr: 'Italien', en: 'Italian' },
  { code: 'nl', flag: '🇳🇱', fr: 'Néerlandais', en: 'Dutch' },
  { code: 'ar', flag: '🇸🇦', fr: 'Arabe', en: 'Arabic' },
  { code: 'sw', flag: '🇰🇪', fr: 'Swahili', en: 'Swahili' },
  { code: 'tr', flag: '🇹🇷', fr: 'Turc', en: 'Turkish' },
  { code: 'ru', flag: '🇷🇺', fr: 'Russe', en: 'Russian' },
  { code: 'hi', flag: '🇮🇳', fr: 'Hindi', en: 'Hindi' },
  { code: 'zh', flag: '🇨🇳', fr: 'Chinois', en: 'Chinese' },
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
      return await duplicateCourseFn({
        data: {
          program_id: input.programId,
          org_id: input.orgId,
          translate: !!input.translate,
          target_language: input.translate ? input.targetLanguage ?? null : null,
          tier: input.tier || 'standard',
        },
      });
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-programs'] });
    },
  });
}
