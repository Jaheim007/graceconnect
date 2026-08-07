import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Loader2, Trash2, BarChart3, Shield, TrendingUp, DollarSign, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-ai-chat`;

const suggestions = [
  {
    icon: BarChart3,
    label: "Executive Summary",
    prompt: "Donne-moi un résumé exécutif complet de l'état de la plateforme avec priorités et actions immédiates",
    color: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: DollarSign,
    label: "Financial Report",
    prompt: "Analyse financière complète : GMV, revenus, top performers, tendances et recommandations",
    color: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: Shield,
    label: "Risk & Compliance",
    prompt: "Analyse KYC, risques de fraude, conformité AML et recommandations de sécurité",
    color: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20",
  },
  {
    icon: TrendingUp,
    label: "Growth Strategy",
    prompt: "Identifie les opportunités de croissance, quick wins et stratégies de scaling",
    color: "from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/20",
  },
];

export default function SuperadminAIChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text };
    if (!overrideText) setInput('');
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
        toast({ title: 'Auth Error', description: 'Not authenticated', variant: 'destructive' });
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
        const err = await resp.json().catch(() => ({ error: 'Network error' }));
        const isRateLimit = resp.status === 429;
        toast({
          title: isRateLimit ? '⏳ Rate Limited' : 'AI Error',
          description: isRateLimit ? 'Please retry in 30 seconds.' : err.error,
          variant: 'destructive',
        });
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
    } catch {
      toast({ title: 'Error', description: "Could not contact AI", variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Command Center</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Gemini 2.5 Pro · Executive Intelligence</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => setMessages([])}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center pt-12 pb-8"
            >
              {/* Animated orb */}
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-xl absolute inset-0 animate-pulse" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
                  <Bot className="h-9 w-9 text-primary/60" />
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-1">SiteViral Intelligence</h2>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Your AI-powered executive analyst. Ask anything about your platform data.
              </p>

              {/* Suggestion cards */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                    onClick={() => send(s.prompt)}
                    className={cn(
                      "group relative text-left p-4 rounded-2xl border bg-gradient-to-br backdrop-blur-sm",
                      "hover:scale-[1.02] hover:shadow-lg transition-all duration-200",
                      s.color
                    )}
                  >
                    <s.icon className="h-5 w-5 mb-2 opacity-80" />
                    <span className="text-sm font-semibold block text-foreground">{s.label}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block leading-tight line-clamp-2">
                      {s.prompt.slice(0, 60)}…
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground px-4 py-3 rounded-br-md shadow-md shadow-primary/10'
                        : 'bg-card/80 border border-border/50 px-5 py-4 backdrop-blur-sm'
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:text-xs [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted/50 [&_td]:px-3 [&_td]:py-1.5 [&_table]:border [&_table]:border-border/50 [&_table]:rounded-lg [&_table]:overflow-hidden [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-foreground [&_code]:bg-muted/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-sm">
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  </div>
                  <div className="bg-card/80 border border-border/50 rounded-2xl px-5 py-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">Analyzing platform data…</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="relative mt-2">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-2 shadow-sm focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 transition-all">
          
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask anything about your platform…"
            className="flex-1 bg-transparent border-0 text-sm outline-none placeholder:text-muted-foreground/60"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 rounded-xl transition-all",
              input.trim() ? "bg-primary shadow-md shadow-primary/20" : "bg-muted"
            )}
            onClick={() => send()}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
          Powered by Gemini 2.5 Pro · Data refreshed in real-time
        </p>
      </div>
    </div>
  );
}
