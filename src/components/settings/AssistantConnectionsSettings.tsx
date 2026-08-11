import { useMemo, useState } from 'react';
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
  stepsFr: string[];
  stepsEn: string[];
};

const CLIENTS: ClientDef[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    settingsUrl: 'https://chatgpt.com/#settings/Connectors',
    hintFr: 'Plans payants (Plus, Pro, Business)',
    hintEn: 'Paid plans (Plus, Pro, Business)',
    stepsFr: [
      'Clique sur « Ouvrir les connecteurs ChatGPT » ci-dessous.',
      'Choisis « Ajouter un connecteur », puis colle le lien (déjà copié).',
      'Clique sur « Autoriser » sur la page SiteViral qui s\'ouvre.',
    ],
    stepsEn: [
      'Click "Open ChatGPT connectors" below.',
      'Choose "Add connector", then paste the link (already copied).',
      'Click "Allow" on the SiteViral page that opens.',
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    settingsUrl: 'https://claude.ai/settings/connectors',
    hintFr: 'Web et application de bureau',
    hintEn: 'Web and desktop app',
    stepsFr: [
      'Clique sur « Ouvrir les connecteurs Claude » ci-dessous.',
      '« Add custom connector » → nom : SiteViral → colle le lien.',
      'Valide l\'autorisation SiteViral.',
    ],
    stepsEn: [
      'Click "Open Claude connectors" below.',
      '"Add custom connector" → name: SiteViral → paste the link.',
      'Approve the SiteViral authorization.',
    ],
  },
  {
    id: 'other',
    name: 'Autre assistant',
    hintFr: 'Gemini, Cursor, Copilot…',
    hintEn: 'Gemini, Cursor, Copilot…',
    stepsFr: [
      'Ajoute un serveur MCP distant (type HTTP / streamable).',
      'Colle le lien SiteViral comme URL du serveur.',
      'Connecte-toi avec ton compte SiteViral : aucune clé API.',
    ],
    stepsEn: [
      'Add a remote MCP server (HTTP / streamable type).',
      'Paste the SiteViral link as the server URL.',
      'Sign in with your SiteViral account: no API key.',
    ],
  },
];

/**
 * Connectors — plug SiteViral into ChatGPT, Claude or any MCP assistant.
 * One click copies the link and opens the assistant's connector screen.
 */
export default function AssistantConnectionsSettings() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [openClient, setOpenClient] = useState<ClientDef | null>(null);

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

  const startConnection = async (client: ClientDef) => {
    const ok = await copy(connectorUrl, 'url');
    if (ok) toast.success(isFr ? 'Lien copié — colle-le dans ton assistant' : 'Link copied — paste it in your assistant');
    setOpenClient(client);
  };

  const samples = [
    {
      icon: GraduationCap,
      label: isFr ? 'Une formation' : 'A course',
      text: isFr
        ? 'Crée une formation SiteViral sur la vente par WhatsApp, avec images.'
        : 'Create a SiteViral course about selling on WhatsApp, with images.',
    },
    {
      icon: BookOpen,
      label: isFr ? 'Un livre' : 'A book',
      text: isFr
        ? 'Démarre un livre SiteViral sur comment monétiser son audience.'
        : 'Start a SiteViral book about monetizing your audience.',
    },
    {
      icon: Wand2,
      label: isFr ? 'Depuis mes notes' : 'From my notes',
      text: isFr
        ? 'Transforme ces notes en formation SiteViral : [colle ton texte].'
        : 'Turn these notes into a SiteViral course: [paste your text].',
    },
  ];

  const can = isFr
    ? ['Créer des brouillons de livres et de formations', 'Suivre une génération en cours', 'Voir tes crédits et tes brouillons']
    : ['Create book and course drafts', 'Follow a running generation', 'See your credits and drafts'];

  const cannot = isFr
    ? ['Publier ou fixer un prix', 'Toucher aux paiements ou aux retraits', 'Supprimer un contenu']
    : ['Publish or set a price', 'Touch payments or payouts', 'Delete content'];

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
          <p className="text-xs font-semibold">{isFr ? 'Ajouter une connexion' : 'Add a connection'}</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => startConnection(c)}
                className={cn(
                  'text-left rounded-xl border border-border/70 bg-muted/20 p-3.5 transition-all',
                  'hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-sm active:scale-[0.99]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium truncate">
                    {c.id === 'other' ? (isFr ? 'Autre assistant' : 'Other assistant') : c.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{isFr ? c.hintFr : c.hintEn}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Un clic copie ton lien et ouvre l\'écran de connexion de l\'assistant. Aucune clé API, aucun terminal.'
              : 'One click copies your link and opens the assistant\'s connection screen. No API key, no terminal.'}
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

      {/* Connection dialog */}
      <Dialog open={!!openClient} onOpenChange={(o) => !o && setOpenClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isFr ? 'Connecter' : 'Connect'}{' '}
              {openClient?.id === 'other'
                ? isFr
                  ? 'un autre assistant'
                  : 'another assistant'
                : openClient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isFr
                ? 'Ton lien est déjà copié. Il reste 3 étapes, une seule fois.'
                : 'Your link is already copied. 3 steps left, once and for all.'}
            </DialogDescription>
          </DialogHeader>

          <ol className="relative space-y-3 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {(isFr ? openClient?.stepsFr : openClient?.stepsEn)?.map((step, idx) => (
              <li key={step} className="relative">
                <span className="absolute -left-8 top-0 h-6 w-6 rounded-full border border-border bg-background text-[10px] font-semibold flex items-center justify-center text-muted-foreground">
                  {idx + 1}
                </span>
                <p className="text-xs leading-6">{step}</p>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
            <code className="block text-[11px] break-all">{connectorUrl}</code>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[11px]"
              onClick={async () => {
                const ok = await copy(connectorUrl, 'url');
                if (ok) toast.success(isFr ? 'Lien copié' : 'Link copied');
              }}
            >
              {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {isFr ? 'Copier à nouveau' : 'Copy again'}
            </Button>
          </div>

          {openClient?.settingsUrl && (
            <Button
              className="w-full gap-1.5"
              onClick={() => window.open(openClient.settingsUrl!, '_blank', 'noopener')}
            >
              <ExternalLink className="h-4 w-4" />
              {isFr ? `Ouvrir les connecteurs ${openClient.name}` : `Open ${openClient.name} connectors`}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
