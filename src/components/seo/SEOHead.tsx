import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noindex?: boolean;
  locale?: string;
  keywords?: string;
}

const SITE_NAME = 'Siteviral';
const DEFAULT_OG_IMAGE = 'https://siteviral.com/og-image.png';
const DEFAULT_DESCRIPTION = 'Your all-in-one digital platform. Sell digital products, collect donations via Mobile Money & cards, and earn by sharing.';
const DEFAULT_KEYWORDS = 'digital platform, sell digital products, Mobile Money, affiliate Africa, earn money online, ebook, online course, digital ambassador, digital content, online store, donation collection, content creator, monetization, Siteviral';
const TWITTER_SITE = '@siteviral';
const SITE_URL = 'https://siteviral.com';

export function SEOHead({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  jsonLd,
  article,
  noindex = false,
  locale = 'fr_FR',
  keywords,
}: SEOHeadProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc = description || DEFAULT_DESCRIPTION;
    const image = ogImage || DEFAULT_OG_IMAGE;
    const url = canonicalUrl || `${SITE_URL}${pathname}`;

    setMeta('name', 'description', desc);
    setMeta('name', 'keywords', keywords || DEFAULT_KEYWORDS);

    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const existingRobots = document.querySelector('meta[name="robots"]');
      if (existingRobots) existingRobots.remove();
    }

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', locale);
    setMeta('property', 'og:url', url);

    if (article && ogType === 'article') {
      if (article.publishedTime) setMeta('property', 'article:published_time', article.publishedTime);
      if (article.modifiedTime) setMeta('property', 'article:modified_time', article.modifiedTime);
      if (article.author) setMeta('property', 'article:author', article.author);
      if (article.section) setMeta('property', 'article:section', article.section);
      article.tags?.forEach((tag) => {
        setMeta('property', 'article:tag', tag);
      });
    }

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:site', TWITTER_SITE);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);

    // hreflang alternates for bilingual SEO
    const setHreflang = (hrefLang: string, href: string) => {
      const selector = `link[rel="alternate"][hreflang="${hrefLang}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'alternate');
        el.setAttribute('hreflang', hrefLang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };
    setHreflang('fr', `${SITE_URL}${pathname}?lang=fr`);
    setHreflang('en', `${SITE_URL}${pathname}?lang=en`);
    setHreflang('x-default', url);

    // JSON-LD
    document.querySelectorAll('script[data-seo-jsonld]').forEach(s => s.remove());
    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach((schema) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(s => s.remove());
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(s => s.remove());
    };
  }, [title, description, ogImage, ogType, canonicalUrl, jsonLd, article, noindex, locale, pathname, keywords]);

  return null;
}
