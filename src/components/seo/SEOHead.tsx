import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any>;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noindex?: boolean;
  locale?: string;
}

const SITE_NAME = 'Siteviral';
const DEFAULT_OG_IMAGE = 'https://siteviral.com/og-image.png';
const DEFAULT_DESCRIPTION = 'Siteviral — Infrastructure Platform for Digital Platforms. Vendez, collectez, formez et développez votre communauté.';
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
}: SEOHeadProps) {
  useEffect(() => {
    // Title
    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Meta description
    setMeta('name', 'description', description || DEFAULT_DESCRIPTION);

    // Robots
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const existingRobots = document.querySelector('meta[name="robots"]');
      if (existingRobots) existingRobots.remove();
    }

    // OG tags
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:image', ogImage || DEFAULT_OG_IMAGE);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', locale);
    if (canonicalUrl) {
      setMeta('property', 'og:url', canonicalUrl);
    }

    // Article-specific OG tags
    if (article && ogType === 'article') {
      if (article.publishedTime) setMeta('property', 'article:published_time', article.publishedTime);
      if (article.modifiedTime) setMeta('property', 'article:modified_time', article.modifiedTime);
      if (article.author) setMeta('property', 'article:author', article.author);
      if (article.section) setMeta('property', 'article:section', article.section);
      article.tags?.forEach((tag, i) => {
        setMeta('property', `article:tag`, tag);
      });
    }

    // Twitter card
    setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:site', TWITTER_SITE);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'twitter:image', ogImage || DEFAULT_OG_IMAGE);

    // Canonical
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // JSON-LD
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) existingScript.remove();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.querySelector('script[data-seo-jsonld]');
      if (script) script.remove();
    };
  }, [title, description, ogImage, ogType, canonicalUrl, jsonLd, article, noindex, locale]);

  return null;
}
