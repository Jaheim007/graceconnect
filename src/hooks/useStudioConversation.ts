import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ASSISTANT_NAME } from '@/lib/viralStudio/assistant';

export interface StudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposal?: GenerationProposal | null;
}

export interface GenerationProposal {
  kind?: 'course' | 'book';
  action_key: string;
  action_label: string;
  cost: number | null;
  balance: number | null;
  can_afford: boolean | null;
  input: {
    source: 'prompt' | 'document';
    title: string;
    prompt: string;
    language: string;
    tier: 'standard' | 'premium';
    level?: 'beginner' | 'intermediate' | 'advanced';
    generate_images?: boolean;
    teaching_style?: string;
    goal?: string;
    orientation?: string;
    style?: string;
    tone?: string;
    audience?: string;
    chapter_count?: number;
    file_url?: string;
    file_name?: string;
    mime?: string;
  };
}

export interface StudioAttachment {
  file_url: string;
  file_name: string;
  mime?: string;
}

/** Conversational front-end onto the existing course pipeline. Chatting is free. */
export function useStudioConversation(opts: { language: 'fr' | 'en'; greeting: string }) {
  const [messages, setMessages] = useState<StudioMessage[]>([
    { id: 'greet', role: 'assistant', content: opts.greeting },
  ]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachmentsRef = useRef<StudioAttachment[]>([]);

  const setAttachments = useCallback((next: StudioAttachment[]) => {
    attachmentsRef.current = next;
  }, []);

  const send = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    setError(null);

    const userMsg: StudioMessage = { id: crypto.randomUUID(), role: 'user', content: clean };
    const history = [...messages, userMsg];
    setMessages(history);
    setThinking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('SESSION_EXPIRED');

      const { data, error: fnErr } = await supabase.functions.invoke('viral-studio-chat', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          messages: history.filter((m) => m.id !== 'greet').map((m) => ({ role: m.role, content: m.content })),
          language: opts.language,
          assistant_name: ASSISTANT_NAME,
          attachments: attachmentsRef.current,
        },
      });

      if (fnErr) {
        let detail: any = null;
        try { detail = await (fnErr as any).context?.json?.(); } catch { /* ignore */ }
        throw new Error(detail?.error || fnErr.message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: (data as any)?.message || '',
          proposal: ((data as any)?.proposal as GenerationProposal) || null,
        },
      ]);
      return (data as any)?.message as string | undefined;
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setThinking(false);
    }
  }, [messages, thinking, opts.language]);

  const reset = useCallback(() => {
    setMessages([{ id: 'greet', role: 'assistant', content: opts.greeting }]);
    setError(null);
    attachmentsRef.current = [];
  }, [opts.greeting]);

  return { messages, thinking, error, send, reset, setAttachments };
}
