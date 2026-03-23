import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-ai-chat`;

export default function SuperadminAIChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text };
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: 'Erreur AI', description: 'Non authentifié', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
        toast({ title: 'Erreur AI', description: err.error, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || !line.trim()) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de contacter l\'IA', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const suggestions = [
    "Analyse mes métriques et dis-moi ce qui va bien et ce qu'il faut améliorer",
    "Quelles organisations ont le plus de revenus ?",
    "Quelles vérifications d'identité sont en attente et quels payouts traiter ?",
    "Propose 5 idées pour augmenter la croissance de la plateforme",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Insights</h1>
            <p className="text-xs text-muted-foreground">Discutez avec l'IA pour analyser votre plateforme</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => setMessages([])}>
            <Trash2 className="h-3.5 w-3.5" /> Effacer
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="space-y-4 pt-8">
            <div className="text-center space-y-2">
              <Bot className="h-12 w-12 text-primary/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Posez une question sur vos données, métriques ou stratégie</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-left text-xs p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
              Analyse en cours…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Posez votre question…"
          className="flex-1 bg-transparent border-0 text-sm outline-none placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={send} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
