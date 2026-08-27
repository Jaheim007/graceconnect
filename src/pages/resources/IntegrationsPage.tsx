import { Link } from '@/lib/router-compat';
import { ArrowRight, Bot, CreditCard, Globe, Landmark, MessageSquare, Smartphone } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';

export default function IntegrationsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const groups = [
    {
      icon: Bot,
      title: isFr ? 'Assistants IA (MCP)' : 'AI assistants (MCP)',
      desc: isFr
        ? 'Branche ton assistant au connecteur SiteViral : il crée des brouillons de livres et de formations dans ta plateforme.'
        : 'Link your assistant to the SiteViral connector: it creates book and formation drafts inside your platform.',
      to: '/docs#connect-assistant',
      items: ['ChatGPT', 'Claude', 'Gemini', isFr ? 'Tout client MCP' : 'Any MCP client'],
    },
    {
      icon: Globe,
      title: isFr ? 'Ton site web' : 'Your website',
      desc: isFr
        ? 'Le widget de paiement s’ajoute avec deux lignes de HTML, sur n’importe quel site.'
        : 'The checkout widget drops in with two lines of HTML, on any site.',
      to: '/docs#embed-checkout',
      items: ['WordPress', 'Wix', 'Shopify', isFr ? 'HTML statique' : 'Static HTML'],
    },
    {
      icon: Smartphone,
      title: isFr ? 'Paiement Mobile Money' : 'Mobile Money payments',
      desc: isFr
        ? 'Tes acheteurs paient avec le moyen qu’ils utilisent déjà chaque jour.'
        : 'Your buyers pay with the method they already use every day.',
      to: '/docs#payments-payouts',
      items: ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'],
    },
    {
      icon: CreditCard,
      title: isFr ? 'Cartes internationales' : 'International cards',
      desc: isFr
        ? 'Encaisse la diaspora et les acheteurs hors zone Mobile Money.'
        : 'Collect from the diaspora and buyers outside Mobile Money zones.',
      to: '/docs#payments-payouts',
      items: ['Visa', 'Mastercard', isFr ? 'Paiement 3-D Secure' : '3-D Secure checkout'],
    },
    {
      icon: MessageSquare,
      title: isFr ? 'Partage & diffusion' : 'Share & distribution',
      desc: isFr
        ? 'Flyers, affiches QR et liens courts générés depuis chaque produit.'
        : 'Flyers, QR posters and short links generated from every product.',
      to: '/docs#products-pricing',
      items: ['WhatsApp', 'Facebook', isFr ? 'Affiche QR imprimable' : 'Printable QR poster', isFr ? 'Liens courts' : 'Short links'],
    },
    {
      icon: Landmark,
      title: isFr ? 'Versements' : 'Payouts',
      desc: isFr
        ? 'Reçois tes revenus sur ton portefeuille mobile ou ton compte bancaire, après vérification.'
        : 'Receive your revenue on your mobile wallet or bank account, after verification.',
      to: '/docs#payments-payouts',
      items: [isFr ? 'Portefeuille mobile' : 'Mobile wallet', isFr ? 'Virement bancaire' : 'Bank transfer'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Intégrations SiteViral' : 'SiteViral integrations'}
        description={
          isFr
            ? 'Assistants IA via MCP, widget de paiement pour ton site, Mobile Money, cartes et versements : tout ce à quoi SiteViral se connecte.'
            : 'AI assistants over MCP, checkout widget for your site, Mobile Money, cards and payouts: everything SiteViral connects to.'
        }
        canonicalUrl="https://siteviral.com/integrations"
      />
      <LandingNav />

      <section className="relative overflow-hidden border-b border-border/60">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="container relative px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            {isFr ? 'Intégrations' : 'Integrations'}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            {isFr ? 'SiteViral s’intègre là où tu travailles déjà.' : 'SiteViral fits where you already work.'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isFr
              ? 'Ton assistant IA, ton site, tes moyens de paiement locaux et tes canaux de partage — reliés à une seule plateforme.'
              : 'Your AI assistant, your site, your local payment methods and your sharing channels — wired into one platform.'}
          </p>
        </div>
      </section>

      <section className="container px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.title}
              to={g.to}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <g.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-black tracking-tight">{g.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{g.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <Badge key={item} variant="secondary" className="text-[11px] font-medium">
                    {item}
                  </Badge>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                {isFr ? 'Voir le guide' : 'View the guide'}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 max-w-2xl">
          <h2 className="text-xl font-black tracking-tight">
            {isFr ? 'Exemple : bouton d’achat sur ton site' : 'Example: buy button on your site'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isFr
              ? 'Remplace `PRODUCT_ID` par l’identifiant de ton produit et le bouton est prêt.'
              : 'Replace `PRODUCT_ID` with your product id and the button is live.'}
          </p>
          <div className="mt-4">
            <CodeBlock
              label="html"
              code={`<div data-siteviral-product="PRODUCT_ID"
     data-siteviral-text="Acheter maintenant"></div>
<script src="https://siteviral.com/embed.js" defer></script>`}
            />
          </div>
        </div>
      </section>

      <LandingFooterCompact />
    </div>
  );
}
