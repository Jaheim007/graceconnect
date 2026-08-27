import { useEffect } from 'react';
import { Link, useLocation } from '@/lib/router-compat';
import { ArrowRight, Info } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { DocsLayout, DocsNavSection } from '@/components/docs/DocsLayout';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { useI18n } from '@/i18n/I18nContext';
import { DOCS_SECTIONS } from '@/content/docs/sections';

export default function DocsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [hash]);

  const nav: DocsNavSection[] = [
    {
      title: isFr ? 'Guides' : 'Guides',
      items: DOCS_SECTIONS.map((s) => ({
        label: isFr ? s.titleFr : s.titleEn,
        to: `/docs#${s.id}`,
      })),
    },
    {
      title: isFr ? 'Aller plus loin' : 'Go further',
      items: [
        { label: isFr ? 'Référence des outils' : 'Tool reference', to: '/docs/api' },
        { label: isFr ? 'Intégrations' : 'Integrations', to: '/integrations' },
        { label: isFr ? "Centre d'aide" : 'Help center', to: '/help' },
        { label: isFr ? 'Statut du service' : 'Service status', to: '/status' },
      ],
    },
  ];

  return (
    <>
      <SEOHead
        title={isFr ? 'Documentation SiteViral' : 'SiteViral documentation'}
        description={
          isFr
            ? 'Guides SiteViral : démarrer, connecter un assistant IA via MCP, intégrer le paiement, gérer produits, paiements et versements.'
            : 'SiteViral guides: get started, connect an AI assistant over MCP, embed checkout, manage products, payments and payouts.'
        }
        canonicalUrl="https://siteviral.com/docs"
      />
      <DocsLayout
        eyebrow={isFr ? 'Documentation' : 'Documentation'}
        title={isFr ? 'Tout ce qu’il faut pour construire sur SiteViral' : 'Everything you need to build on SiteViral'}
        intro={
          isFr
            ? 'Des guides courts et concrets pour lancer ta plateforme, brancher ton assistant IA et encaisser tes ventes sans friction.'
            : 'Short, concrete guides to launch your platform, connect your AI assistant and collect sales without friction.'
        }
        nav={nav}
        searchPlaceholder=""
        aside={
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {isFr ? 'Besoin d’aide ?' : 'Need help?'}
            </h4>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {isFr
                ? 'Une question qui n’est pas ici ? Notre équipe répond depuis le centre d’aide.'
                : 'A question that isn’t here? Our team answers from the help center.'}
            </p>
            <Link
              to="/help"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {isFr ? "Ouvrir le centre d'aide" : 'Open the help center'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      >
        <div className="max-w-2xl space-y-16">
          {DOCS_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {isFr ? section.titleFr : section.titleEn}
              </h2>
              <div className="mt-5 space-y-5">
                {section.blocks.map((block, i) => {
                  if (block.kind === 'p') {
                    return (
                      <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                        {isFr ? block.fr : block.en}
                      </p>
                    );
                  }
                  if (block.kind === 'steps') {
                    const items = isFr ? block.fr : block.en;
                    return (
                      <ol key={i} className="space-y-3">
                        {items.map((item, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                              {idx + 1}
                            </span>
                            <span className="text-[15px] leading-relaxed text-foreground/90">{item}</span>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  if (block.kind === 'code') {
                    return <CodeBlock key={i} label={block.label} code={block.code} />;
                  }
                  return (
                    <div
                      key={i}
                      className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
                    >
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-relaxed text-foreground/90">{isFr ? block.fr : block.en}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="text-lg font-black tracking-tight">
              {isFr ? 'Et ensuite : la référence des outils' : 'Next up: the tool reference'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isFr
                ? 'Chaque outil MCP, ses paramètres et un exemple d’appel prêt à copier.'
                : 'Every MCP tool, its parameters and a ready-to-copy call example.'}
            </p>
            <Link
              to="/docs/api"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {isFr ? 'Voir la référence' : 'View the reference'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </DocsLayout>
    </>
  );
}
