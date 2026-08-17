/**
 * JSON-LD schema helpers for structured data.
 * Use with SEOHead's jsonLd prop.
 *
 * Usage:
 *   import { jsonLdSchemas } from '@/lib/jsonLdSchemas';
 *   <SEOHead jsonLd={jsonLdSchemas.product({ name: '...', price: 5000 })} />
 */

const SITE_URL = 'https://siteviral.com';

export const jsonLdSchemas = {
  product: (p: { name: string; description?: string; price?: number; currency?: string; image?: string; url?: string; rating?: number; reviewCount?: number }) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.image,
    url: p.url,
    ...(p.price != null && {
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: p.currency || 'XOF',
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(p.rating != null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.reviewCount || 1,
      },
    }),
  }),

  organization: (o: { name: string; slug: string; logo?: string; description?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: o.name,
    url: `${SITE_URL}/org/${o.slug}`,
    logo: o.logo,
    description: o.description,
  }),

  article: (a: { title: string; description?: string; author?: string; datePublished?: string; dateModified?: string; image?: string; url?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    author: a.author ? { '@type': 'Person', name: a.author } : undefined,
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    image: a.image,
    url: a.url,
  }),

  event: (e: { name: string; startDate?: string; location?: string; description?: string; image?: string; url?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    startDate: e.startDate,
    location: e.location ? { '@type': 'Place', name: e.location } : undefined,
    description: e.description,
    image: e.image,
    url: e.url,
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }),

  faqPage: (questions: Array<{ q: string; a: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }),

  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Siteviral',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/marketplace?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }),

  /** Digital book / ebook — use for product_type ebook|book. */
  book: (b: {
    name: string;
    description?: string;
    author?: string;
    image?: string;
    url?: string;
    price?: number;
    currency?: string;
    isFree?: boolean;
    pageCount?: number;
    language?: string;
    rating?: number;
    reviewCount?: number;
  }) => ({
    '@context': 'https://schema.org',
    '@type': ['Product', 'Book'],
    name: b.name,
    description: b.description,
    image: b.image,
    url: b.url,
    bookFormat: 'https://schema.org/EBook',
    numberOfPages: b.pageCount,
    inLanguage: b.language || 'fr',
    author: b.author ? { '@type': 'Person', name: b.author } : undefined,
    offers: {
      '@type': 'Offer',
      url: b.url,
      price: b.isFree ? 0 : (b.price ?? 0),
      priceCurrency: b.currency || 'XOF',
      availability: 'https://schema.org/InStock',
      category: b.isFree ? 'Free' : 'Paid',
    },
    ...(b.rating != null && b.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: b.rating,
            reviewCount: b.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }),

  /** Individual behind an organization (pastor, author, tutor, artisan…). */
  person: (p: { name: string; jobTitle?: string; description?: string; image?: string; orgName?: string; url?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    description: p.description,
    image: p.image,
    url: p.url,
    worksFor: p.orgName ? { '@type': 'Organization', name: p.orgName } : undefined,
  }),

  /** Church / NGO / creator organization with the right schema.org subtype. */
  orgProfile: (o: {
    name: string;
    slug?: string;
    url?: string;
    category?: string | null;
    description?: string;
    logo?: string;
    website?: string;
    country?: string | null;
  }) => {
    const type =
      o.category === 'church' || o.category === 'ministry'
        ? 'Church'
        : o.category === 'ngo' || o.category === 'association'
          ? 'NGO'
          : 'Organization';
    return {
      '@context': 'https://schema.org',
      '@type': type,
      name: o.name,
      url: o.url || (o.slug ? `${SITE_URL}/org/${o.slug}` : SITE_URL),
      description: o.description,
      logo: o.logo,
      image: o.logo,
      address: o.country ? { '@type': 'PostalAddress', addressCountry: o.country } : undefined,
      sameAs: o.website ? [o.website] : undefined,
    };
  },

  /** Catalogue listing (org store, discover rails…). */
  itemList: (name: string, items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  }),
};

