import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Check,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Wand2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MousePointerClick,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

type ClientDef = {
  id: string;
  name: string;
  /** Deep link straight to the client's connector settings, when it exists. */
  settingsUrl?: string;
  hintFr: string;
  hintEn: string;
  /** What the user must click once the assistant screen is open. */
  actionFr: string;
  actionEn: string;
};

const CLIENTS: ClientDef[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    settingsUrl: 'https://chatgpt.com/#settings/Connectors',
    hintFr: 'Plans Plus, Pro et Business',
    hintEn: 'Plus, Pro and Business plans',
    actionFr: '« Ajouter un connecteur » → colle le lien → Créer',
    actionEn: '"Add connector" → paste the link → Create',
  },
  {
    id: 'claude',
    name: 'Claude',
    settingsUrl: 'https://claude.ai/settings/connectors',
    hintFr: 'Web et application de bureau',
    hintEn: 'Web and desktop app',
    actionFr: '« Add custom connector » → colle le lien → Add',
    actionEn: '"Add custom connector" → paste the link → Add',
  },
  {
    id: 'other',
    name: 'Autre assistant',
    hintFr: 'Gemini, Cursor, Copilot…',
    hintEn: 'Gemini, Cursor, Copilot…',
    actionFr: 'Ajoute un serveur MCP distant → colle le lien comme URL',
    actionEn: 'Add a remote MCP server → paste the link as the URL',
  },
];

const STORAGE_KEY = 'sv_connectors_done';

/**
 * Connectors — plug SiteViral into ChatGPT, Claude or any MCP assistant.
 * Guided 3-click flow: choose the assistant, open it with the link copied, confirm.
 */
export default function AssistantConnectionsSettings() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [client, setClient] = useState<ClientDef | null>(null);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const markDone = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const connectorUrl = useMemo(() => {
    const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
    if (base) return `${base}/functions/v1/mcp`;
    const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    return `https://${ref ?? 'project-ref-unset'}.supabase.co/functions/v1/mcp`;
  }, []);

  const copy = async (text: string, kind: 'url' | string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'url') {
        setCopiedUrl(true);
        window.setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedPrompt(kind);
        window.setTimeout(() => setCopiedPrompt(null), 2000);
      }
      return true;
    } catch {
      toast.error(isFr ? 'Copie impossible' : 'Could not copy');
      return false;
    }
  };

  /** Click 1 — pick the assistant: link is copied straight away. */
  const startConnection = async (c: ClientDef) => {
    setClient(c);
    setStep(1);
    const ok = await copy(connectorUrl, 'url');
    if (ok) toast.success(isFr ? 'Lien copié ✓' : 'Link copied ✓');
  };

  /** Click 2 — open the assistant's connector screen. */
  const openAssistant = () => {
    if (client?.settingsUrl) window.open(client.settingsUrl, '_blank', 'noopener,noreferrer');
    setStep(2);
  };

  const samples = [
    {
      icon: Wand2,
      label: isFr ? 'Écris avec lui, puis envoie' : 'Write with it, then send',
      text: isFr
        ? "Écrivons ensemble un livre sur la vente par WhatsApp, chapitre par chapitre. Quand j'aurai validé, envoie le texte complet vers SiteViral."
        : 'Let us write a book about selling on WhatsApp together, chapter by chapter. Once I approve it, send the full text to SiteViral.',
    },
    {
      icon: BookOpen,
      label: isFr ? 'Depuis mes notes' : 'From my notes',
      text: isFr
        ? 'Transforme ces notes en formation, puis envoie-la vers SiteViral : [colle ton texte].'
        : 'Turn these notes into a course, then send it to SiteViral: [paste your text].',
    },
    {
      icon: GraduationCap,
      label: isFr ? 'Laisse SiteViral écrire' : 'Let SiteViral write',
      text: isFr
        ? 'Crée une formation SiteViral sur la vente par WhatsApp, avec images.'
        : 'Create a SiteViral course about selling on WhatsApp, with images.',
    },
  ];

  const can = isFr
    ? [
        'Envoyer vers SiteViral le texte que tu as écrit avec lui, mot pour mot',
        'Créer des brouillons de livres et de formations',
        'Générer la couverture et les images si tu le demandes',
        'Te renvoyer le lien du brouillon',
      ]
    : [
        'Send the text you wrote with it to SiteViral, word for word',
        'Create book and course drafts',
        'Generate the cover and images when you ask',
        'Give you back the draft link',
      ];


  const cannot = isFr
    ? ['Publier ou fixer un prix', 'Toucher aux paiements ou aux retraits', 'Supprimer un contenu']
    : ['Publish or set a price', 'Touch payments or payouts', 'Delete content'];

  const clientLabel = (c: ClientDef) =>
    c.id === 'other' ? (isFr ? 'Autre assistant' : 'Other assistant') : c.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-center gap-2.5 border-b border-border/60">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm">{isFr ? 'Connecteurs' : 'Connectors'}</h2>
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Crée tes livres et tes formations en parlant à ton assistant IA'
              : 'Create your books and courses by talking to your AI assistant'}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1 text-[10px] border-emerald-500/40 text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {isFr ? 'En ligne' : 'Live'}
        </Badge>
      </div>

      <div className="p-5 space-y-6">
        {/* Add a connection */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">{isFr ? 'Ajouter une connexion' : 'Add a connection'}</p>
            <Badge variant="secondary" className="text-[10px] gap-1">
              <MousePointerClick className="h-3 w-3" />
              {isFr ? '3 clics, une seule fois' : '3 clicks, once'}
            </Badge>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {CLIENTS.map((c) => {
              const isDone = done.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => startConnection(c)}
                  className={cn(
                    'text-left rounded-xl border p-3.5 transition-all active:scale-[0.99]',
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                      : 'border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                        isDone ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary'
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-xs font-medium truncate">{clientLabel(c)}</span>
                    {isDone && (
                      <span className="ml-auto text-[10px] font-medium text-emerald-600">
                        {isFr ? 'Connecté' : 'Connected'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{isFr ? c.hintFr : c.hintEn}</p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Aucune clé API, aucun terminal : on copie ton lien et on t\'emmène au bon écran.'
              : 'No API key, no terminal: we copy your link and take you to the right screen.'}
          </p>
        </div>

        {/* Prompts */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold">{isFr ? 'Puis demande simplement' : 'Then just ask'}</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {samples.map((s) => {
              const Icon = s.icon;
              const isCopied = copiedPrompt === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={async () => {
                    const ok = await copy(s.text, s.label);
                    if (ok) toast.success(isFr ? 'Prompt copié' : 'Prompt copied');
                  }}
                  className="text-left rounded-xl border border-border/70 bg-muted/20 p-3.5 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-medium">{s.label}</span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600 ml-auto" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.text}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <p className="text-xs font-semibold text-emerald-600 mb-2">
              {isFr ? 'Ce que ton assistant peut faire' : 'What your assistant can do'}
            </p>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              {can.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-px" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold mb-2">{isFr ? 'Ce qu\'il ne peut pas faire' : 'What it cannot do'}</p>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              {cannot.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 flex gap-2.5">
          <Info className="h-4 w-4 text-primary shrink-0 mt-px" />
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Les générations lancées depuis un assistant consomment tes crédits SiteViral. Tout arrive en brouillon : tu gardes le contrôle du prix et de la publication.'
              : 'Generations launched from an assistant consume your SiteViral credits. Everything arrives as a draft: you stay in control of pricing and publishing.'}
          </p>
        </div>
      </div>

      {/* Guided connection dialog */}
      <Dialog
        open={!!client}
        onOpenChange={(o) => {
          if (!o) {
            setClient(null);
            setStep(1);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isFr ? 'Connecter' : 'Connect'} {client ? clientLabel(client) : ''}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isFr ? `Étape ${step} sur 3` : `Step ${step} of 3`}
            </DialogDescription>
          </DialogHeader>

          {/* progress */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  s <= step ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 flex gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-px" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{isFr ? 'Ton lien est copié' : 'Your link is copied'}</p>
                  <code className="block text-[10px] text-muted-foreground break-all mt-1">{connectorUrl}</code>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isFr
                  ? 'On ouvre maintenant l\'écran des connecteurs de ton assistant dans un nouvel onglet.'
                  : 'We now open your assistant\'s connector screen in a new tab.'}
              </p>
              <Button className="w-full gap-2" onClick={openAssistant}>
                {client?.settingsUrl ? (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    {isFr ? `Ouvrir ${clientLabel(client!)}` : `Open ${clientLabel(client!)}`}
                  </>
                ) : (
                  <>
                    {isFr ? 'J\'ouvre mon assistant' : 'I opened my assistant'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copy(connectorUrl, 'url');
                  if (ok) toast.success(isFr ? 'Lien copié' : 'Link copied');
                }}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5"
              >
                {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {isFr ? 'Copier le lien à nouveau' : 'Copy the link again'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                <p className="text-xs font-medium">{isFr ? 'Dans l\'onglet ouvert' : 'In the tab that opened'}</p>
                <p className="text-xs text-muted-foreground leading-6">
                  {isFr ? client?.actionFr : client?.actionEn}
                </p>
              </div>
              <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5 flex gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-px" />
                <p className="text-[11px] text-muted-foreground">
                  {isFr
                    ? 'Une page SiteViral s\'affichera : clique sur « Autoriser ». C\'est la seule connexion à faire.'
                    : 'A SiteViral page will appear: click "Allow". That is the only sign-in needed.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {isFr ? 'Retour' : 'Back'}
                </Button>
                <Button className="flex-1 gap-2" onClick={() => { setStep(3); if (client) markDone(client.id); }}>
                  {isFr ? 'C\'est fait' : 'Done'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-center">
                <div className="mx-auto h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center mb-2">
                  <Check className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold">
                  {isFr ? 'Connecté 🎉' : 'Connected 🎉'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isFr
                    ? 'Teste tout de suite en collant ce message dans ton assistant.'
                    : 'Try it right away by pasting this message into your assistant.'}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copy(samples[0].text, samples[0].label);
                  if (ok) toast.success(isFr ? 'Prompt copié' : 'Prompt copied');
                }}
                className="w-full text-left rounded-xl border border-border bg-muted/20 p-3.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-medium">{isFr ? 'Prompt de test' : 'Test prompt'}</span>
                  <Copy className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
                <p className="text-[11px] text-muted-foreground">{samples[0].text}</p>
              </button>
              <Button
                className="w-full"
                onClick={() => {
                  setClient(null);
                  setStep(1);
                }}
              >
                {isFr ? 'Terminer' : 'Finish'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
