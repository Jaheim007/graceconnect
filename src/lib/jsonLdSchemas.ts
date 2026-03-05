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
};
