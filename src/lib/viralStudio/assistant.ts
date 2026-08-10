/**
 * Assistant branding — single source of truth.
 * Renaming the assistant later = change these constants only.
 */
export const ASSISTANT_NAME = 'Viral Studio';
export const ASSISTANT_ROUTE = '/admin/viral-studio';

export const assistantCopy = (isFr: boolean) => ({
  name: ASSISTANT_NAME,
  tagline: isFr
    ? 'Crée ton cours en discutant, sans formulaire.'
    : 'Create your course by chatting — no forms.',
  greeting: isFr
    ? `Salut 👋 Moi c’est ${ASSISTANT_NAME}. Alors, on fait quoi maintenant ?`
    : `Hey 👋 I’m ${ASSISTANT_NAME}. So, what do you want to do next?`,
  nudge: isFr
    ? `Alors, on fait quoi maintenant ?`
    : `So, what do you want to do next?`,
  placeholder: isFr ? 'Écris ou parle…' : 'Type or speak…',
  free: isFr ? 'Assistant de création' : 'Creation assistant',
});
