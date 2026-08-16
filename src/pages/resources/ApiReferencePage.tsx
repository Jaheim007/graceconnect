import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { DocsLayout, DocsNavSection } from '@/components/docs/DocsLayout';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { MCP_TOOLS, TOOL_GROUPS } from '@/content/docs/mcpTools';

export default function ApiReferencePage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { hash } = useLocation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [hash]);

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MCP_TOOLS;
    return MCP_TOOLS.filter((t) =>
      [t.name, t.titleFr, t.titleEn, t.descFr, t.descEn].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  const nav: DocsNavSection[] = TOOL_GROUPS.map((g) => ({
    title: isFr ? g.fr : g.en,
    items: MCP_TOOLS.filter((t) => t.group === g.id).map((t) => ({
      label: t.name,
      to: `/docs/api#${t.id}`,
    })),
  }));

  return (
    <>
      <SEOHead
        title={isFr ? 'Référence des outils MCP — SiteViral' : 'MCP tool reference — SiteViral'}
        description={
          isFr
            ? 'Référence complète des outils du serveur MCP SiteViral : créer des livres, importer des formations, lire produits, analytics et crédits.'
            : 'Full reference of the SiteViral MCP server tools: create books, import formations, read products, analytics and credits.'
        }
        canonicalUrl="https://siteviral.com/docs/api"
      />
      <DocsLayout
        eyebrow={isFr ? 'Référence' : 'Reference'}
        title={isFr ? 'Outils du serveur MCP' : 'MCP server tools'}
        intro={
          isFr
            ? `Les ${MCP_TOOLS.length} outils que ton assistant peut appeler après connexion du connecteur. Tout ce qui est créé arrive en brouillon dans ta plateforme.`
            : `The ${MCP_TOOLS.length} tools your assistant can call once the connector is linked. Anything created lands as a draft in your platform.`
        }
        nav={nav}
        searchValue={query}
        onSearch={setQuery}
        searchPlaceholder={isFr ? 'Rechercher un outil…' : 'Search a tool…'}
      >
        <div className="max-w-2xl space-y-12">
          {TOOL_GROUPS.map((group) => {
            const groupTools = tools.filter((t) => t.group === group.id);
            if (!groupTools.length) return null;
            return (
              <section key={group.id}>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {isFr ? group.fr : group.en}
                </h2>
                <div className="mt-5 space-y-8">
                  {groupTools.map((tool) => (
                    <article
                      key={tool.id}
                      id={tool.id}
                      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded-lg bg-primary/10 px-2 py-1 font-mono text-[13px] font-semibold text-primary">
                          {tool.name}
                        </code>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                          {isFr ? tool.titleFr : tool.titleEn}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {isFr ? tool.descFr : tool.descEn}
                      </p>

                      {tool.params.length > 0 ? (
                        <div className="mt-5 overflow-hidden rounded-xl border border-border">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                  {isFr ? 'Paramètre' : 'Parameter'}
                                </th>
                                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                  {isFr ? 'Description' : 'Description'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tool.params.map((param) => (
                                <tr key={param.name} className="border-t border-border/60 align-top">
                                  <td className="whitespace-nowrap px-3 py-2.5">
                                    <code className="font-mono text-[12.5px] font-semibold">{param.name}</code>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {param.type}
                                      </span>
                                      {param.required && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                          {isFr ? 'requis' : 'required'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
                                    {isFr ? param.fr : param.en}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 text-[13px] italic text-muted-foreground">
                          {isFr ? 'Aucun paramètre.' : 'No parameters.'}
                        </p>
                      )}

                      <div className="mt-5">
                        <CodeBlock label={isFr ? 'exemple d’appel' : 'example call'} code={tool.example} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {!tools.length && (
            <p className="text-sm text-muted-foreground">
              {isFr ? 'Aucun outil ne correspond à cette recherche.' : 'No tool matches this search.'}
            </p>
          )}

          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="text-lg font-black tracking-tight">
              {isFr ? 'Connecter ton assistant' : 'Connect your assistant'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isFr
                ? 'Le guide de connexion explique où trouver ton URL et comment l’ajouter dans ChatGPT, Claude ou Gemini.'
                : 'The connection guide shows where to find your URL and how to add it in ChatGPT, Claude or Gemini.'}
            </p>
            <Link
              to="/docs#connect-assistant"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {isFr ? 'Lire le guide' : 'Read the guide'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </DocsLayout>
    </>
  );
}
