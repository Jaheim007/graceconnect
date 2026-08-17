/**
 * Rich bot rendering for Siteviral.
 *
 * The app is a client-side SPA, so crawlers that don't execute JavaScript
 * (GPTBot, ClaudeBot, PerplexityBot, Googlebot's non-render pass, social
 * preview bots…) only see an empty <div id="root">.
 *
 * This module resolves a public path against the database and renders a
 * complete, readable HTML document containing exactly the same substantive
 * content the React page renders: heading, description prose, key facts,
 * internal links and schema.org JSON-LD. Every document canonicalises to the
 * normal public URL, so this is progressive enhancement for crawlers, not
 * cloaking.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SITE_URL = 'https://siteviral.com';
export const DEFAULT_IMAGE = 'https://siteviral.com/og-image.png';

/* ─── AI + search + social crawlers ─── */

export const AI_BOT_UA_PATTERNS = [
  // OpenAI
  'gptbot', 'oai-searchbot', 'chatgpt-user',
  // Anthropic
  'claudebot', 'claude-web', 'claude-user', 'claude-searchbot', 'anthropic-ai',
  // Perplexity
  'perplexitybot', 'perplexity-user',
  // Google / Apple AI surfaces
  'google-extended', 'googleother', 'applebot-extended',
  // Others
  'ccbot', 'bytespider', 'amazonbot', 'meta-externalagent', 'meta-externalfetcher',
  'duckassistbot', 'cohere-ai', 'cohere-training-data-crawler', 'youbot',
  'mistralai-user', 'timpibot', 'diffbot', 'omgili', 'ai2bot',
];

/* ─── Text helpers ─── */

export const escapeHtml = (v: string) =>
  String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function stripHtml(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function clip(text: string, max = 200): string {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,;:.!?\u2014\u2013-]+$/, '') + '\u2026';
}

/** Split long prose into readable paragraphs (max ~8 for very long texts). */
function paragraphs(raw: string | null | undefined, limit = 8): string[] {
  const text = stripHtml(raw || '');
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    buf += s;
    if (buf.length > 320) { out.push(buf.trim()); buf = ''; }
    if (out.length >= limit) break;
  }
  if (buf.trim() && out.length < limit) out.push(buf.trim());
  return out;
}

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function money(price: number | null | undefined, currency: string | null | undefined, isFree?: boolean | null) {
  if (isFree || !price) return 'Gratuit / Free';
  return `${Number(price).toLocaleString('fr-FR')} ${currency || 'XOF'}`;
}

/* ─── Rich page model ─── */

export interface RichFaq { q: string; a: string }
export interface RichLink { label: string; href: string }

export interface RichPage {
  title: string;
  description: string;
  image: string;
  h1: string;
  ogType: string;
  lang: string;
  intro?: string;
  body: string[];
  facts: Array<[string, string]>;
  faqs: RichFaq[];
  links: RichLink[];
  jsonLd: Record<string, unknown>[];
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

function baseOrgLd(org: { name?: string; slug?: string; description?: string | null; logo_url?: string | null; website?: string | null; category?: string | null }) {
  const type = org.category === 'church' || org.category === 'ministry'
    ? 'Church'
    : org.category === 'ngo'
      ? 'NGO'
      : 'Organization';
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: org.name,
    url: `${SITE_URL}/org/${org.slug}`,
    description: org.description ? clip(org.description, 300) : undefined,
    logo: org.logo_url || undefined,
    image: org.logo_url || undefined,
    sameAs: org.website ? [org.website] : undefined,
  };
}

function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.url}`,
    })),
  };
}

function faqLd(faqs: RichFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function parseFaqJson(value: unknown): RichFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row: any) => ({
      q: stripHtml(row?.question ?? row?.q ?? ''),
      a: stripHtml(row?.answer ?? row?.a ?? ''),
    }))
    .filter((f) => f.q && f.a)
    .slice(0, 12);
}

/* ─── Resolvers ─── */

async function resolveProduct(sb: SupabaseClient, identifier: string, orgSlug?: string): Promise<RichPage | null> {
  const columns =
    'id, slug, title, description, seo_title, seo_description, cover_image_url, price, sale_price, currency, is_free, product_type, page_count, average_rating, review_count, faq_json, content_language, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)';

  let data: any = null;
  if (isUuid(identifier)) {
    ({ data } = await sb.from('digital_products').select(columns).eq('id', identifier).eq('is_published', true).maybeSingle());
  }
  if (!data) {
    ({ data } = await sb.from('digital_products').select(columns).eq('slug', identifier).eq('is_published', true).maybeSingle());
  }
  if (!data) return null;

  const org = data.organizations || {};
  const path = `/org/${org.slug || orgSlug}/product/${data.id}`;
  const url = `${SITE_URL}${path}`;
  const price = data.sale_price ?? data.price;
  const isBook = (data.product_type || '').toLowerCase().includes('book') || (data.product_type || '').toLowerCase().includes('ebook');

  const offer = {
    '@type': 'Offer',
    url,
    price: data.is_free ? 0 : Number(price || 0),
    priceCurrency: data.currency || 'XOF',
    availability: 'https://schema.org/InStock',
  };

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isBook ? ['Product', 'Book'] : 'Product',
    name: data.title,
    description: clip(data.seo_description || data.description || '', 400),
    image: data.cover_image_url || DEFAULT_IMAGE,
    url,
    brand: org.name ? { '@type': 'Organization', name: org.name } : undefined,
    inLanguage: data.content_language || 'fr',
    offers: offer,
  };
  if (isBook) {
    productLd.bookFormat = 'https://schema.org/EBook';
    productLd.numberOfPages = data.page_count || undefined;
    productLd.author = org.name ? { '@type': 'Organization', name: org.name } : undefined;
  }
  if (data.average_rating && data.review_count) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.average_rating,
      reviewCount: data.review_count,
    };
  }

  const faqs = parseFaqJson(data.faq_json);
  const jsonLd: Record<string, unknown>[] = [
    productLd,
    baseOrgLd(org),
    breadcrumbLd([
      { name: 'Siteviral', url: '/' },
      { name: org.name || 'Boutique', url: `/org/${org.slug}` },
      { name: data.title, url: path },
    ]),
  ];
  if (faqs.length) jsonLd.push(faqLd(faqs));

  return {
    title: `${data.seo_title || data.title} — ${org.name || 'Siteviral'}`,
    description: clip(data.seo_description || data.description || `Découvrez ${data.title} sur Siteviral.`, 200),
    image: data.cover_image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'product',
    lang: data.content_language || 'fr',
    intro: `${data.title} est un produit numérique publié par ${org.name || 'un créateur'} sur Siteviral. Prix : ${money(price, data.currency, data.is_free)}. Paiement par Mobile Money (Orange Money, MTN, Wave) ou carte bancaire, avec livraison automatique du fichier après paiement.`,
    body: paragraphs(data.description),
    facts: [
      ['Type', isBook ? 'Livre numérique (ebook)' : (data.product_type || 'Produit numérique')],
      ['Prix', money(price, data.currency, data.is_free)],
      ['Vendeur', org.name || 'Siteviral'],
      ...(data.page_count ? [['Pages', String(data.page_count)] as [string, string]] : []),
      ...(data.average_rating ? [['Note', `${data.average_rating}/5 (${data.review_count || 0} avis)`] as [string, string]] : []),
      ['Paiement', 'Mobile Money & carte bancaire'],
      ['Livraison', 'Téléchargement immédiat après paiement'],
    ],
    faqs: faqs.length ? faqs : [
      { q: `Comment acheter ${data.title} ?`, a: `Ouvrez la page du produit sur Siteviral, choisissez Mobile Money (Orange Money, MTN, Wave) ou carte bancaire, puis payez. Le fichier est disponible immédiatement après confirmation du paiement.` },
      { q: `Combien coûte ${data.title} ?`, a: `${money(price, data.currency, data.is_free)}.` },
      { q: 'Faut-il un compte bancaire ?', a: "Non. Le paiement Mobile Money suffit ; aucun compte bancaire n'est nécessaire pour acheter." },
    ],
    links: [
      { label: org.name || 'Voir la boutique', href: `/org/${org.slug}` },
      { label: 'Explorer d\'autres produits', href: '/discover' },
      { label: 'Comment vendre sur Siteviral', href: '/vendre' },
    ],
    jsonLd,
    publishedTime: data.created_at,
    modifiedTime: data.updated_at,
  };
}

async function resolveProgram(sb: SupabaseClient, id: string): Promise<RichPage | null> {
  if (!isUuid(id)) return null;
  const { data } = await sb
    .from('programs')
    .select('id, title, description, cover_image_url, price, currency, is_free, content_language, enrollment_count, certificate_enabled, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;

  const org = (data as any).organizations || {};
  const path = `/program/${data.id}`;
  const url = `${SITE_URL}${path}`;

  const { data: modules } = await sb
    .from('program_modules')
    .select('title, description, order_index')
    .eq('program_id', data.id)
    .order('order_index', { ascending: true })
    .limit(40);

  const courseLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: data.title,
    description: clip(data.description || '', 400),
    image: data.cover_image_url || DEFAULT_IMAGE,
    url,
    inLanguage: data.content_language || 'fr',
    provider: { '@type': 'Organization', name: org.name || 'Siteviral', url: `${SITE_URL}/org/${org.slug || ''}` },
    offers: {
      '@type': 'Offer',
      url,
      price: data.is_free ? 0 : Number(data.price || 0),
      priceCurrency: data.currency || 'XOF',
      category: data.is_free ? 'Free' : 'Paid',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: modules?.length ? `${modules.length} modules` : undefined,
      inLanguage: data.content_language || 'fr',
    },
    ...(modules?.length
      ? {
          syllabusSections: modules.map((m: any, i: number) => ({
            '@type': 'Syllabus',
            position: i + 1,
            name: m.title,
            description: m.description ? clip(m.description, 200) : undefined,
          })),
        }
      : {}),
    ...(data.enrollment_count ? { aggregateRating: undefined, numberOfCredits: undefined } : {}),
  };

  const faqs: RichFaq[] = [
    { q: `Que contient la formation « ${data.title} » ?`, a: modules?.length ? `La formation contient ${modules.length} modules : ${modules.map((m: any) => m.title).slice(0, 8).join(', ')}.` : clip(data.description || 'Une formation en ligne complète, accessible sur mobile et ordinateur.', 300) },
    { q: 'Combien coûte cette formation ?', a: money(data.price, data.currency, data.is_free) + '. Paiement par Mobile Money ou carte bancaire.' },
    { q: 'Y a-t-il un certificat ?', a: data.certificate_enabled ? 'Oui, un certificat vérifiable est délivré à la fin de la formation.' : "Cette formation ne délivre pas de certificat." },
  ];

  return {
    title: `${data.title} — Formation en ligne | Siteviral`,
    description: clip(data.description || `Suivez la formation ${data.title} sur Siteviral.`, 200),
    image: data.cover_image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'article',
    lang: data.content_language || 'fr',
    intro: `« ${data.title} » est une formation en ligne publiée par ${org.name || 'un créateur'} sur Siteviral. Prix : ${money(data.price, data.currency, data.is_free)}. Accessible sur mobile et ordinateur, paiement Mobile Money ou carte bancaire.`,
    body: paragraphs(data.description),
    facts: [
      ['Format', 'Formation en ligne (leçons, quiz, flashcards)'],
      ['Modules', modules?.length ? String(modules.length) : '—'],
      ['Prix', money(data.price, data.currency, data.is_free)],
      ['Formateur', org.name || 'Siteviral'],
      ['Certificat', data.certificate_enabled ? 'Oui, vérifiable' : 'Non'],
      ...(data.enrollment_count ? [['Inscrits', String(data.enrollment_count)] as [string, string]] : []),
    ],
    faqs,
    links: [
      ...(modules || []).slice(0, 20).map((m: any) => ({ label: m.title, href: path })),
      { label: org.name || 'Voir le créateur', href: `/org/${org.slug}` },
      { label: 'Toutes les formations', href: '/courses' },
    ],
    jsonLd: [
      courseLd,
      baseOrgLd(org),
      faqLd(faqs),
      breadcrumbLd([
        { name: 'Siteviral', url: '/' },
        { name: 'Formations', url: '/courses' },
        { name: data.title, url: path },
      ]),
    ],
    publishedTime: data.created_at,
    modifiedTime: data.updated_at,
  };
}

async function resolveOrg(sb: SupabaseClient, slug: string, sub: string): Promise<RichPage | null> {
  const { data: org } = await sb
    .from('organizations')
    .select('id, name, slug, description, seo_title, seo_description, seo_image, logo_url, banner_url, website, category, country, is_verified, leader_name, leader_title, leader_bio, leader_image_url, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!org) return null;

  const [{ data: products }, { data: programs }] = await Promise.all([
    sb.from('digital_products').select('id, title, price, currency, is_free, description').eq('organization_id', org.id).eq('is_published', true).limit(30),
    sb.from('programs').select('id, title, price, currency, is_free').eq('organization_id', org.id).eq('is_published', true).limit(30),
  ]);

  const path = `/org/${org.slug}${sub}`;
  const kindLabel = org.category === 'church' || org.category === 'ministry'
    ? 'église / ministère'
    : org.category === 'ngo'
      ? 'ONG / association'
      : 'créateur';

  const catalogue = [
    ...(products || []).map((p: any) => ({ label: `${p.title} — ${money(p.price, p.currency, p.is_free)}`, href: `/org/${org.slug}/product/${p.id}` })),
    ...(programs || []).map((p: any) => ({ label: `${p.title} — ${money(p.price, p.currency, p.is_free)}`, href: `/program/${p.id}` })),
  ];

  const faqs: RichFaq[] = [
    { q: `Qu'est-ce que ${org.name} ?`, a: clip(org.seo_description || org.description || `${org.name} est un ${kindLabel} présent sur Siteviral.`, 300) },
    { q: `Que propose ${org.name} ?`, a: catalogue.length ? `${catalogue.length} publications : ${catalogue.slice(0, 6).map((c) => c.label).join(' ; ')}.` : `${org.name} publie ses contenus et actualités sur Siteviral.` },
    { q: `Comment soutenir ou acheter chez ${org.name} ?`, a: 'Directement sur la page Siteviral, par Mobile Money (Orange Money, MTN, Wave) ou carte bancaire. Aucun compte bancaire requis pour payer.' },
  ];

  const jsonLd: Record<string, unknown>[] = [
    { ...baseOrgLd(org), address: org.country ? { '@type': 'PostalAddress', addressCountry: org.country } : undefined },
    faqLd(faqs),
    breadcrumbLd([
      { name: 'Siteviral', url: '/' },
      { name: 'Explorer', url: '/discover' },
      { name: org.name, url: `/org/${org.slug}` },
    ]),
  ];
  if (catalogue.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Catalogue de ${org.name}`,
      numberOfItems: catalogue.length,
      itemListElement: catalogue.slice(0, 30).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        url: `${SITE_URL}${c.href}`,
      })),
    });
  }
  if (org.leader_name) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: org.leader_name,
      jobTitle: org.leader_title || undefined,
      description: org.leader_bio ? clip(org.leader_bio, 300) : undefined,
      image: org.leader_image_url || undefined,
      worksFor: { '@type': 'Organization', name: org.name },
      url: `${SITE_URL}/org/${org.slug}`,
    });
  }

  return {
    title: `${org.seo_title || org.name} — Siteviral`,
    description: clip(org.seo_description || org.description || `Découvrez ${org.name} sur Siteviral.`, 200),
    image: org.seo_image || org.banner_url || org.logo_url || DEFAULT_IMAGE,
    h1: org.name,
    ogType: 'profile',
    lang: 'fr',
    intro: `${org.name} est un ${kindLabel} sur Siteviral${org.country ? ` (${org.country})` : ''}${org.is_verified ? ', profil vérifié' : ''}. Cette page regroupe ses produits numériques, formations, événements et options de soutien, avec paiement Mobile Money et carte bancaire.`,
    body: [...paragraphs(org.description), ...(org.leader_bio ? paragraphs(org.leader_bio, 3) : [])],
    facts: [
      ['Type', kindLabel],
      ...(org.country ? [['Pays', org.country] as [string, string]] : []),
      ...(org.leader_name ? [['Responsable', `${org.leader_name}${org.leader_title ? ` — ${org.leader_title}` : ''}`] as [string, string]] : []),
      ['Publications', String(catalogue.length)],
      ['Paiements', 'Mobile Money (Orange, MTN, Wave) & carte bancaire'],
      ...(org.website ? [['Site web', org.website] as [string, string]] : []),
    ],
    faqs,
    links: [
      ...catalogue.slice(0, 30),
      { label: 'Boutique', href: `/org/${org.slug}/store` },
      { label: 'Contenus', href: `/org/${org.slug}/content` },
      { label: 'Événements', href: `/org/${org.slug}/events` },
      { label: 'Soutenir', href: `/org/${org.slug}/donate` },
    ],
    jsonLd,
    publishedTime: org.created_at,
    modifiedTime: org.updated_at,
  };
}

async function resolveCampaign(sb: SupabaseClient, id: string): Promise<RichPage | null> {
  const { data } = await sb
    .from('donation_campaigns')
    .select('id, title, description, image_url, goal_amount, current_amount, currency, end_date, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;
  const org = (data as any).organizations || {};
  const path = `/campaign/${data.id}`;
  const faqs: RichFaq[] = [
    { q: `À quoi sert la campagne « ${data.title} » ?`, a: clip(data.description || `Une collecte de fonds organisée par ${org.name || 'une organisation'} sur Siteviral.`, 300) },
    { q: 'Comment faire un don ?', a: 'Par Mobile Money (Orange Money, MTN, Wave) ou carte bancaire, directement depuis la page de la campagne. Un reçu est envoyé automatiquement.' },
  ];
  return {
    title: `${data.title} — ${org.name || 'Siteviral'}`,
    description: clip(data.description || `Soutenez ${data.title}.`, 200),
    image: data.image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'article',
    lang: 'fr',
    intro: `« ${data.title} » est une campagne de dons organisée par ${org.name || 'une organisation'} sur Siteviral${data.goal_amount ? `, avec un objectif de ${money(data.goal_amount, data.currency)}` : ''}. Les dons se font par Mobile Money ou carte bancaire.`,
    body: paragraphs(data.description),
    facts: [
      ...(data.goal_amount ? [['Objectif', money(data.goal_amount, data.currency)] as [string, string]] : []),
      ...(data.current_amount ? [['Collecté', money(data.current_amount, data.currency)] as [string, string]] : []),
      ...(data.end_date ? [['Fin', String(data.end_date).slice(0, 10)] as [string, string]] : []),
      ['Organisateur', org.name || 'Siteviral'],
      ['Moyens de don', 'Mobile Money & carte bancaire'],
    ],
    faqs,
    links: [
      { label: org.name || 'Organisateur', href: `/org/${org.slug}` },
      { label: 'Autres campagnes', href: '/discover' },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'DonateAction',
        name: data.title,
        description: clip(data.description || '', 300),
        url: `${SITE_URL}${path}`,
        recipient: { '@type': 'Organization', name: org.name || 'Siteviral' },
      },
      baseOrgLd(org),
      faqLd(faqs),
    ],
    publishedTime: data.created_at,
    modifiedTime: data.updated_at,
  };
}

async function resolveEvent(sb: SupabaseClient, id: string): Promise<RichPage | null> {
  const { data } = await sb
    .from('events')
    .select('id, title, description, image_url, event_date, location, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;
  const org = (data as any).organizations || {};
  return {
    title: `${data.title} — ${org.name || 'Siteviral'}`,
    description: clip(data.description || `Événement organisé par ${org.name || 'Siteviral'}.`, 200),
    image: data.image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'article',
    lang: 'fr',
    intro: `« ${data.title} » est un événement organisé par ${org.name || 'une organisation'}${data.event_date ? ` le ${String(data.event_date).slice(0, 10)}` : ''}${data.location ? ` à ${data.location}` : ''}, avec billetterie et inscription sur Siteviral.`,
    body: paragraphs(data.description),
    facts: [
      ...(data.event_date ? [['Date', String(data.event_date).slice(0, 16).replace('T', ' ')] as [string, string]] : []),
      ...(data.location ? [['Lieu', data.location] as [string, string]] : []),
      ['Organisateur', org.name || 'Siteviral'],
    ],
    faqs: [
      { q: `Quand a lieu « ${data.title} » ?`, a: data.event_date ? `Le ${String(data.event_date).slice(0, 16).replace('T', ' ')}${data.location ? ` à ${data.location}` : ''}.` : 'La date est annoncée sur la page de l\'événement.' },
      { q: 'Comment participer ?', a: "Réservez votre place depuis la page de l'événement ; le paiement éventuel se fait par Mobile Money ou carte bancaire." },
    ],
    links: [{ label: org.name || 'Organisateur', href: `/org/${org.slug}` }],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.title,
        description: clip(data.description || '', 300),
        startDate: data.event_date || undefined,
        image: data.image_url || undefined,
        url: `${SITE_URL}/event/${data.id}`,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: data.location ? { '@type': 'Place', name: data.location } : { '@type': 'VirtualLocation', url: `${SITE_URL}/event/${data.id}` },
        organizer: { '@type': 'Organization', name: org.name || 'Siteviral' },
      },
      baseOrgLd(org),
    ],
    publishedTime: data.created_at,
    modifiedTime: data.updated_at,
  };
}

async function resolveAnnouncement(sb: SupabaseClient, id: string): Promise<RichPage | null> {
  const { data } = await sb
    .from('announcements')
    .select('id, title, body, image_url, published_at, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;
  const org = (data as any).organizations || {};
  return {
    title: `${data.title} — ${org.name || 'Siteviral'}`,
    description: clip(data.body || '', 200),
    image: data.image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'article',
    lang: 'fr',
    intro: `Annonce publiée par ${org.name || 'une organisation'} sur Siteviral.`,
    body: paragraphs(data.body),
    facts: [['Publié par', org.name || 'Siteviral'], ...(data.published_at ? [['Date', String(data.published_at).slice(0, 10)] as [string, string]] : [])],
    faqs: [],
    links: [{ label: org.name || 'Organisation', href: `/org/${org.slug}` }],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        articleBody: clip(data.body || '', 1200),
        image: data.image_url || undefined,
        datePublished: data.published_at || data.created_at || undefined,
        dateModified: data.updated_at || undefined,
        author: { '@type': 'Organization', name: org.name || 'Siteviral' },
        url: `${SITE_URL}/announcement/${data.id}`,
      },
      baseOrgLd(org),
    ],
    publishedTime: data.published_at || data.created_at,
    modifiedTime: data.updated_at,
  };
}

async function resolveOffering(sb: SupabaseClient, id: string): Promise<RichPage | null> {
  const { data } = await sb
    .from('offerings')
    .select('id, title, description, image_url, currency, preset_amounts, created_at, updated_at, organizations(name, slug, logo_url, description, website, category)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return null;
  const org = (data as any).organizations || {};
  return {
    title: `${data.title} — ${org.name || 'Siteviral'}`,
    description: clip(data.description || `Soutenez ${data.title}.`, 200),
    image: data.image_url || DEFAULT_IMAGE,
    h1: data.title,
    ogType: 'article',
    lang: 'fr',
    intro: `« ${data.title} » est une offrande / contribution proposée par ${org.name || 'une organisation'} sur Siteviral, payable par Mobile Money ou carte bancaire.`,
    body: paragraphs(data.description),
    facts: [
      ['Organisation', org.name || 'Siteviral'],
      ...(data.preset_amounts?.length ? [['Montants suggérés', data.preset_amounts.map((a: number) => money(a, data.currency)).join(' · ')] as [string, string]] : []),
    ],
    faqs: [{ q: 'Comment contribuer ?', a: 'Choisissez un montant sur la page, puis payez par Mobile Money (Orange Money, MTN, Wave) ou carte bancaire.' }],
    links: [{ label: org.name || 'Organisation', href: `/org/${org.slug}` }],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'DonateAction',
        name: data.title,
        description: clip(data.description || '', 300),
        url: `${SITE_URL}/offering/${data.id}`,
        recipient: { '@type': 'Organization', name: org.name || 'Siteviral' },
      },
      baseOrgLd(org),
    ],
    publishedTime: data.created_at,
    modifiedTime: data.updated_at,
  };
}

/* ─── Static / marketing pages ─── */

const PLATFORM_FAQS: RichFaq[] = [
  { q: "Qu'est-ce que Siteviral ?", a: "Siteviral est une plateforme africaine qui permet de créer une page publique, vendre des produits numériques (ebooks, formations, audio, vidéo), collecter des dons et gagner des commissions en partageant les contenus des autres." },
  { q: 'Siteviral est-il gratuit ?', a: "Oui. La création d'un compte et d'une plateforme est gratuite. Siteviral se rémunère par une commission transparente sur les transactions réussies." },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'Mobile Money (Orange Money, MTN Mobile Money, Wave, Moov) et cartes bancaires, en FCFA (XOF), EUR et USD.' },
  { q: 'Faut-il un compte bancaire pour vendre ?', a: "Non. Vous pouvez recevoir vos revenus sur un compte Mobile Money ; un compte bancaire n'est pas obligatoire." },
  { q: "Comment gagner de l'argent sans créer de contenu ?", a: "Avec le programme ambassadeur : partagez le lien d'un produit existant et recevez une commission automatique sur chaque vente issue de votre lien." },
  { q: 'Peut-on créer un livre ou une formation avec l\'IA ?', a: 'Oui. Siteviral génère chapitres, leçons, quiz, couvertures et descriptions à partir d\'un simple sujet, d\'un texte, d\'un document, d\'une dictée vocale ou d\'une écriture manuscrite.' },
  { q: 'Siteviral convient-il aux églises et ONG ?', a: 'Oui. Les églises, ministères et associations disposent de pages dédiées : prédications audio, annonces, événements, dons et offrandes en ligne.' },
];

const STATIC_PAGES: Record<string, Partial<RichPage> & { title: string; description: string; h1: string }> = {
  '/': {
    title: 'Siteviral — Créez votre plateforme digitale, vendez et gagnez',
    description: 'Créez votre plateforme digitale gratuite : vendez ebooks et formations, collectez des dons via Mobile Money et gagnez en partageant.',
    h1: 'Siteviral — créez, vendez et gagnez en ligne en Afrique',
    intro: "Siteviral est une plateforme africaine tout-en-un pour créer une page publique, publier et vendre des produits numériques (ebooks, formations, audio, vidéo), collecter des dons par Mobile Money et carte bancaire, et gagner des commissions en partageant les contenus d'autres créateurs.",
    body: [
      "Créez votre plateforme en quelques minutes, sans code et sans frais fixes : vous choisissez votre nom public, vos produits et vos prix, et Siteviral s'occupe des paiements, de la livraison des fichiers et des reçus.",
      "L'assistant IA écrit vos livres et formations à partir d'un sujet, d'un document, d'une dictée vocale ou d'une écriture manuscrite, génère les couvertures, les descriptions et les quiz, puis publie la page de vente.",
      "Le programme ambassadeur permet à n'importe qui de gagner de l'argent sans créer de contenu : partagez un lien, recevez une commission automatique sur chaque vente attribuée à ce lien.",
      "Les églises, ministères et ONG disposent d'espaces dédiés : prédications, annonces, événements, dons et offrandes en ligne.",
    ],
    facts: [
      ['Prix', "Gratuit — commission uniquement sur les ventes réussies"],
      ['Paiements', 'Orange Money, MTN, Wave, Moov, cartes bancaires'],
      ['Devises', 'FCFA (XOF), EUR, USD'],
      ['Pour qui', 'Créateurs, auteurs, formateurs, églises, ONG, ambassadeurs'],
    ],
    links: [
      { label: 'Explorer', href: '/discover' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'Vendre', href: '/vendre' },
      { label: 'Gagner en partageant', href: '/gagner' },
      { label: 'Écrire un livre', href: '/ecrire' },
      { label: 'Églises & ONG', href: '/churches' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Documentation développeurs', href: '/developers' },
    ],
  },
  '/discover': {
    title: 'Explorer — produits numériques, formations et campagnes | Siteviral',
    description: 'Découvrez les plateformes, ebooks, formations, événements et campagnes de dons publiés sur Siteviral.',
    h1: 'Explorer les créateurs et contenus Siteviral',
    intro: "La page Explorer regroupe les publications publiques de Siteviral : ebooks, formations en ligne, contenus audio et vidéo, événements, campagnes de dons et pages d'églises ou d'associations.",
    body: ['Chaque publication est achetable par Mobile Money ou carte bancaire, avec livraison automatique après paiement.'],
    links: [
      { label: 'Formations', href: '/courses' },
      { label: 'Nouveautés de la semaine', href: '/new-this-week' },
      { label: 'Catalogue promotionnel', href: '/promo/catalogue' },
      { label: 'Contenus gratuits', href: '/promo/gratuits' },
    ],
  },
  '/pricing': {
    title: 'Tarifs — Siteviral',
    description: "Siteviral est gratuit à l'usage : commissions transparentes sur les transactions, pas d'abonnement obligatoire.",
    h1: 'Tarifs Siteviral',
    intro: "Créer un compte, publier une page et mettre en vente des produits est gratuit sur Siteviral. La plateforme prélève une commission transparente uniquement lorsqu'une transaction réussit.",
    body: ["Aucun frais fixe, aucun abonnement obligatoire, aucun frais d'installation. Les revenus sont reversés sur Mobile Money ou compte bancaire."],
  },
  '/faq': {
    title: 'FAQ — Siteviral',
    description: 'Questions fréquentes sur Siteviral : inscription, paiements Mobile Money, commissions, affiliation, produits numériques.',
    h1: 'Questions fréquentes sur Siteviral',
    intro: 'Réponses directes aux questions les plus posées sur Siteviral.',
  },
  '/vendre': {
    title: 'Vendre des produits numériques en Afrique — Siteviral',
    description: 'Vendez ebooks, formations et fichiers numériques avec paiement Mobile Money et livraison automatique.',
    h1: 'Vendre vos produits numériques avec Siteviral',
    intro: "Sur Siteviral vous pouvez vendre un ebook, une formation, un pack audio ou tout fichier numérique, encaisser par Mobile Money ou carte bancaire, et livrer automatiquement l'acheteur — sans site web, sans code et sans compte bancaire obligatoire.",
  },
  '/gagner': {
    title: "Gagner de l'argent en partageant — programme ambassadeur Siteviral",
    description: "Gagnez des commissions en partageant les produits des autres, sans créer de contenu ni investir.",
    h1: "Gagner de l'argent sans créer de contenu",
    intro: "Le programme ambassadeur Siteviral vous permet de gagner une commission sur chaque vente réalisée via votre lien de partage, sans stock, sans investissement et sans avoir à produire de contenu.",
  },
  '/ecrire': {
    title: 'Écrire et publier un livre avec l\'IA — Siteviral',
    description: "Écrivez un livre avec l'IA : chapitres, couverture, description et page de vente générés automatiquement.",
    h1: "Écrire et vendre votre livre avec l'IA",
    intro: "Donnez un sujet, un document, une dictée vocale ou une page manuscrite : Siteviral génère le plan, les chapitres, la couverture et la page de vente, puis met le livre en vente avec paiement Mobile Money.",
  },
  '/churches': {
    title: 'Siteviral pour les églises, ministères et ONG',
    description: 'Prédications, annonces, événements, dons et offrandes en ligne pour les églises, ministères et associations.',
    h1: 'Siteviral pour les églises, ministères et ONG',
    intro: "Les églises, ministères et associations utilisent Siteviral pour publier des prédications audio, des annonces et des événements, et pour collecter dons et offrandes par Mobile Money et carte bancaire.",
  },
  '/ambassador-program': {
    title: 'Programme ambassadeur — Siteviral',
    description: 'Commissions automatiques sur chaque vente issue de votre lien de partage.',
    h1: 'Programme ambassadeur Siteviral',
    intro: "Le programme ambassadeur attribue automatiquement une commission à la personne dont le lien a généré la vente. Le suivi, l'attribution et le paiement sont gérés par la plateforme.",
  },
  '/courses': {
    title: 'Formations en ligne — Siteviral',
    description: 'Parcourez les formations en ligne publiées sur Siteviral : leçons, quiz, certificats vérifiables.',
    h1: 'Formations en ligne sur Siteviral',
    intro: 'Catalogue des formations publiées sur Siteviral, avec leçons, quiz, flashcards et certificats vérifiables.',
  },
  '/about': {
    title: 'À propos — Siteviral',
    description: 'La mission de Siteviral : permettre à chaque créateur africain de vivre de son contenu.',
    h1: 'À propos de Siteviral',
    intro: "Siteviral est édité par Hacktualiz Inc. et conçu pour l'Afrique et sa diaspora : paiements Mobile Money, prix locaux, langues FR/EN et outils IA accessibles depuis un téléphone.",
  },
  '/contact': {
    title: 'Contact — Siteviral',
    description: "Contactez l'équipe Siteviral pour toute question, support ou partenariat.",
    h1: "Contacter l'équipe Siteviral",
    intro: "Support utilisateurs, questions commerciales et demandes de partenariat.",
  },
};

function staticPage(path: string): RichPage | null {
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const base = STATIC_PAGES[clean];
  if (!base) return null;
  const url = `${SITE_URL}${clean === '/' ? '/' : clean}`;
  const faqs = base.faqs ?? (clean === '/' || clean === '/faq' ? PLATFORM_FAQS : PLATFORM_FAQS.slice(0, 4));
  return {
    image: DEFAULT_IMAGE,
    ogType: 'website',
    lang: 'fr',
    body: [],
    facts: [],
    links: [],
    ...base,
    faqs,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: base.title,
        description: base.description,
        url,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Siteviral', url: SITE_URL },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Siteviral',
        url: SITE_URL,
        logo: `${SITE_URL}/pwa-512x512.png`,
        description: 'Plateforme africaine pour créer, vendre des produits numériques, collecter des dons via Mobile Money et gagner en partageant.',
        sameAs: ['https://x.com/siteviral'],
      },
      faqLd(faqs),
    ],
  } as RichPage;
}

/* ─── Public entry point ─── */

export async function resolveRichPage(path: string): Promise<RichPage | null> {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const clean = path.split('?')[0].split('#')[0];
  let m: RegExpMatchArray | null;

  try {
    m = clean.match(/^\/org\/([^\/]+)\/(?:product|p)\/([^\/]+)/);
    if (m) return await resolveProduct(sb, decodeURIComponent(m[2]), decodeURIComponent(m[1]));

    m = clean.match(/^\/product\/([^\/]+)/);
    if (m) return await resolveProduct(sb, decodeURIComponent(m[1]));

    m = clean.match(/^\/program\/([^\/]+)/);
    if (m) return await resolveProgram(sb, decodeURIComponent(m[1]));

    m = clean.match(/^\/org\/([^\/]+)(\/[a-z]+)?\/?$/);
    if (m) return await resolveOrg(sb, decodeURIComponent(m[1]), m[2] || '');

    m = clean.match(/^\/campaign(?:e)?\/([^\/]+)/);
    if (m) return await resolveCampaign(sb, decodeURIComponent(m[1]));

    m = clean.match(/^\/event\/([^\/]+)/);
    if (m) return await resolveEvent(sb, decodeURIComponent(m[1]));

    m = clean.match(/^\/(?:annonce|announcement)\/([^\/]+)/);
    if (m) return await resolveAnnouncement(sb, decodeURIComponent(m[1]));

    m = clean.match(/^\/offering\/([^\/]+)/);
    if (m) return await resolveOffering(sb, decodeURIComponent(m[1]));
  } catch (_e) {
    // fall through to static handling
  }

  return staticPage(clean);
}

/* ─── Renderer ─── */

export function renderRichHtml(page: RichPage, canonicalUrl: string): string {
  const e = escapeHtml;
  const facts = page.facts.filter(([, v]) => v && v !== '—');

  return `<!doctype html>
<html lang="${e(page.lang || 'fr')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${e(page.title)}</title>
    <meta name="description" content="${e(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="${e(canonicalUrl)}" />
    <link rel="alternate" hreflang="fr" href="${e(canonicalUrl)}?lang=fr" />
    <link rel="alternate" hreflang="en" href="${e(canonicalUrl)}?lang=en" />
    <link rel="alternate" hreflang="x-default" href="${e(canonicalUrl)}" />
    <meta property="og:site_name" content="Siteviral" />
    <meta property="og:type" content="${e(page.ogType)}" />
    <meta property="og:title" content="${e(page.title)}" />
    <meta property="og:description" content="${e(page.description)}" />
    <meta property="og:image" content="${e(page.image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${e(canonicalUrl)}" />
    <meta property="og:locale" content="fr_FR" />
    ${page.publishedTime ? `<meta property="article:published_time" content="${e(String(page.publishedTime))}" />` : ''}
    ${page.modifiedTime ? `<meta property="article:modified_time" content="${e(String(page.modifiedTime))}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@siteviral" />
    <meta name="twitter:title" content="${e(page.title)}" />
    <meta name="twitter:description" content="${e(page.description)}" />
    <meta name="twitter:image" content="${e(page.image)}" />
${page.jsonLd
  .filter(Boolean)
  .map((s) => `    <script type="application/ld+json">${JSON.stringify(s, (_k, v) => (v === undefined ? undefined : v))}</script>`)
  .join('\n')}
  </head>
  <body>
    <main>
      <h1>${e(page.h1)}</h1>
      ${page.intro ? `<p>${e(page.intro)}</p>` : ''}
      ${page.body.map((p) => `<p>${e(p)}</p>`).join('\n      ')}
      ${facts.length ? `<h2>Informations clés</h2>\n      <dl>\n${facts.map(([k, v]) => `        <dt>${e(k)}</dt><dd>${e(v)}</dd>`).join('\n')}\n      </dl>` : ''}
      ${page.faqs.length ? `<h2>Questions fréquentes</h2>\n${page.faqs.map((f) => `      <section>\n        <h3>${e(f.q)}</h3>\n        <p>${e(f.a)}</p>\n      </section>`).join('\n')}` : ''}
      ${page.links.length ? `<h2>Pages liées</h2>\n      <ul>\n${page.links.map((l) => `        <li><a href="${e(SITE_URL + l.href)}">${e(l.label)}</a></li>`).join('\n')}\n      </ul>` : ''}
      <hr />
      <p><a href="${e(canonicalUrl)}">Voir cette page sur Siteviral</a> — <a href="${SITE_URL}/">Accueil</a> · <a href="${SITE_URL}/discover">Explorer</a> · <a href="${SITE_URL}/llms.txt">llms.txt</a> · <a href="${SITE_URL}/sitemap.xml">sitemap.xml</a></p>
    </main>
  </body>
</html>`;
}
