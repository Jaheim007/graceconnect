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
    ? `Bonjour 👋 Je suis ${ASSISTANT_NAME}. Comment puis-je t’aider aujourd’hui ?`
    : `Hi 👋 I’m ${ASSISTANT_NAME}. How can I help you today?`,
  nudge: isFr
    ? `Comment puis-je t’aider aujourd’hui ?`
    : `How can I help you today?`,
  placeholder: isFr ? 'Écris ou parle…' : 'Type or speak…',
  free: isFr ? 'La conversation est gratuite' : 'Chatting is free',
});
