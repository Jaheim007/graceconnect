import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bot, Code2, Puzzle, ShieldCheck, Terminal, Sparkles, Webhook } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { MCP_TOOLS } from '@/content/docs/mcpTools';

export default function DevelopersPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const cards = [
    {
      icon: BookOpen,
      to: '/docs',
      title: isFr ? 'Documentation' : 'Documentation',
      desc: isFr
        ? 'Guides pas à pas : démarrer, connecter un assistant, intégrer le paiement, gérer les versements.'
        : 'Step-by-step guides: get started, connect an assistant, embed checkout, handle payouts.',
    },
    {
      icon: Terminal,
      to: '/docs/api',
      title: isFr ? 'Référence des outils' : 'Tool reference',
      desc: isFr
        ? `Les ${MCP_TOOLS.length} outils exposés par le serveur MCP, avec paramètres et exemples d'appel.`
        : `The ${MCP_TOOLS.length} tools exposed by the MCP server, with parameters and call examples.`,
    },
    {
      icon: Puzzle,
      to: '/integrations',
      title: isFr ? 'Intégrations' : 'Integrations',
      desc: isFr
        ? 'ChatGPT, Claude, Gemini, WordPress, Wix, sites statiques : où SiteViral se branche.'
        : 'ChatGPT, Claude, Gemini, WordPress, Wix, static sites: where SiteViral plugs in.',
    },
    {
      icon: Bot,
      to: '/docs#connect-assistant',
      title: isFr ? 'Connecteur MCP' : 'MCP connector',
      desc: isFr
        ? 'Une URL, une autorisation OAuth, et ton assistant écrit directement dans ta plateforme.'
        : 'One URL, one OAuth approval, and your assistant writes straight into your platform.',
    },
  ];

  const principles = [
    {
      icon: ShieldCheck,
      title: isFr ? 'Tout arrive en brouillon' : 'Everything lands as a draft',
      desc: isFr
        ? 'Aucun outil ne publie, ne fixe un prix ni ne met en vente. Tu gardes la décision finale dans l’application.'
        : 'No tool publishes, prices or lists anything for sale. The final decision stays yours in the app.',
    },
    {
      icon: Sparkles,
      title: isFr ? 'Pas de clé API à gérer' : 'No API key to manage',
      desc: isFr
        ? 'La connexion passe par OAuth avec ton compte SiteViral. Rien à copier, rien à faire fuiter.'
        : 'The connection runs on OAuth with your SiteViral account. Nothing to copy, nothing to leak.',
    },
    {
      icon: Webhook,
      title: isFr ? 'Périmètre de ton compte' : 'Scoped to your account',
      desc: isFr
        ? 'Un assistant ne voit que les plateformes dont tu es membre, et rien au-delà de tes rôles.'
        : 'An assistant only sees platforms you belong to, and nothing beyond your roles.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Développeurs — connecter et automatiser SiteViral' : 'Developers — connect and automate SiteViral'}
        description={
          isFr
            ? 'Connecte ChatGPT, Claude ou Gemini à SiteViral via MCP, intègre le paiement sur ton site et automatise la création de livres et de formations.'
            : 'Connect ChatGPT, Claude or Gemini to SiteViral over MCP, embed checkout on your site and automate book and formation creation.'
        }
        canonicalUrl="https://siteviral.com/developers"
      />
      <LandingNav />

      <section className="relative overflow-hidden border-b border-border/60">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/3 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="container relative px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            {isFr ? 'Développeurs' : 'Developers'}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            {isFr ? 'Branche SiteViral à tes outils.' : 'Plug SiteViral into your tools.'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {isFr
              ? 'Un serveur MCP pour que ton assistant IA écrive dans ta plateforme, un widget de paiement pour vendre depuis ton propre site, et une documentation claire pour tout relier.'
              : 'An MCP server so your AI assistant writes into your platform, a checkout widget to sell from your own site, and clear docs to wire it all together.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 rounded-xl">
              <Link to="/docs">
                {isFr ? 'Lire la documentation' : 'Read the docs'} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 rounded-xl">
              <Link to="/docs/api">
                <Code2 className="h-4 w-4" /> {isFr ? 'Référence des outils' : 'Tool reference'}
              </Link>
            </Button>
          </div>

          <div className="mt-12 max-w-xl">
            <CodeBlock
              label={isFr ? 'url du connecteur' : 'connector url'}
              code={'https://<your-project>.supabase.co/functions/v1/mcp'}
            />
            <p className="mt-2.5 text-xs text-muted-foreground">
              {isFr
                ? 'Ton URL exacte se trouve dans Réglages → Connexions assistants.'
                : 'Your exact URL lives in Settings → Assistant connections.'}
            </p>
          </div>
        </div>
      </section>

      <section className="container px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 flex items-center gap-2 text-lg font-black tracking-tight">
                {c.title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="container px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {isFr ? 'Comment on protège ton compte' : 'How we protect your account'}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {principles.map((pr) => (
              <div key={pr.title}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                  <pr.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold">{pr.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pr.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCompact />
    </div>
  );
}
