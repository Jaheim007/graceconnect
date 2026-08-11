import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, Copy, ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

/**
 * Assistant connections — lets a creator plug SiteViral into ChatGPT, Claude,
 * or any MCP-capable assistant, so they can start books and courses by talking
 * to their assistant. Read-only UI: the connector itself is the MCP server.
 */
export default function AssistantConnectionsSettings() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState(false);

  const connectorUrl = useMemo(() => {
    const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    const origin = base?.replace(/\/$/, '') || (ref ? `https://${ref}.supabase.co` : '');
    return `${origin}/functions/v1/mcp`;
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(connectorUrl);
      setCopied(true);
      toast.success(isFr ? 'Lien du connecteur copié' : 'Connector link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isFr ? 'Copie impossible' : 'Could not copy');
    }
  };

  const steps = isFr
    ? [
        {
          client: 'ChatGPT',
          items: [
            'Ouvre Paramètres → Connecteurs → Ajouter un connecteur',
            'Colle le lien ci-dessous, puis connecte-toi avec ton compte SiteViral',
            'Dis simplement : « Crée un cours SiteViral sur … »',
          ],
        },
        {
          client: 'Claude',
          items: [
            'Ouvre Settings → Connectors → Add custom connector',
            'Colle le lien ci-dessous et valide l\'écran d\'autorisation SiteViral',
            'Demande : « Démarre un livre sur … dans mon espace SiteViral »',
          ],
        },
        {
          client: isFr ? 'Autres assistants (Gemini CLI, Cursor…)' : 'Other assistants',
          items: [
            'Ajoute un serveur MCP distant avec ce même lien',
            'L\'authentification se fait avec ton compte SiteViral (OAuth)',
          ],
        },
      ]
    : [
        {
          client: 'ChatGPT',
          items: [
            'Open Settings → Connectors → Add connector',
            'Paste the link below, then sign in with your SiteViral account',
            'Just say: "Create a SiteViral course about …"',
          ],
        },
        {
          client: 'Claude',
          items: [
            'Open Settings → Connectors → Add custom connector',
            'Paste the link below and approve the SiteViral consent screen',
            'Ask: "Start a book about … in my SiteViral workspace"',
          ],
        },
        {
          client: 'Other assistants (Gemini CLI, Cursor…)',
          items: [
            'Add a remote MCP server using the same link',
            'Authentication uses your SiteViral account (OAuth)',
          ],
        },
      ];

  const can = isFr
    ? [
        'Créer des brouillons de livres et de cours avec l\'IA SiteViral',
        'Suivre l\'avancement d\'une génération en cours',
        'Lire tes espaces, tes produits, tes achats et tes statistiques',
        'Afficher ton solde de crédits avant de lancer une génération',
      ]
    : [
        'Create book and course drafts with SiteViral AI',
        'Follow the progress of a running generation',
        'Read your workspaces, products, purchases and analytics',
        'Show your credit balance before launching a generation',
      ];

  const cannot = isFr
    ? [
        'Publier ou mettre en ligne un contenu',
        'Modifier tes prix ou tes paiements',
        'Déclencher un retrait ou toucher au KYC',
        'Supprimer un contenu existant',
      ]
    : [
        'Publish or put content live',
        'Change your prices or payments',
        'Trigger a payout or touch KYC',
        'Delete existing content',
      ];

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
          <h2 className="font-semibold text-sm">
            {isFr ? 'Connexions assistants (ChatGPT, Claude…)' : 'Assistant connections (ChatGPT, Claude…)'}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Crée tes livres et tes cours en parlant à ton assistant IA'
              : 'Create your books and courses by talking to your AI assistant'}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
          <ShieldCheck className="h-3 w-3" />
          {isFr ? 'Connexion sécurisée' : 'Secure sign-in'}
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {/* Connector URL */}
        <div className="space-y-2">
          <p className="text-xs font-medium">{isFr ? 'Lien du connecteur' : 'Connector link'}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 min-w-0 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[11px] sm:text-xs break-all">
              {connectorUrl}
            </code>
            <Button onClick={copy} size="sm" className="h-10 gap-1.5 shrink-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isFr ? 'Copié' : 'Copied') : isFr ? 'Copier' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Steps per client */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.client} className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs font-semibold mb-2">{s.client}</p>
              <ol className="space-y-1.5 text-[11px] text-muted-foreground list-decimal pl-4">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ol>
            </div>
          ))}
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
            <p className="text-xs font-semibold mb-2">
              {isFr ? 'Ce qu\'il ne peut pas faire' : 'What it cannot do'}
            </p>
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

        <div className={cn('rounded-xl border border-border/70 bg-muted/20 p-4 flex gap-2.5')}>
          <Info className="h-4 w-4 text-primary shrink-0 mt-px" />
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Les générations lancées depuis un assistant consomment tes crédits SiteViral, exactement comme dans l\'application. Tout arrive en brouillon : tu gardes le contrôle du prix et de la publication.'
              : 'Generations launched from an assistant consume your SiteViral credits, exactly like in the app. Everything arrives as a draft: you stay in control of pricing and publishing.'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={() => window.open('https://modelcontextprotocol.io/clients', '_blank', 'noopener')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {isFr ? 'Assistants compatibles' : 'Compatible assistants'}
        </Button>
      </div>
    </motion.div>
  );
}
