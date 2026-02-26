import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  keywords?: string;
}

const SITE_NAME = 'Siteviral';
const DEFAULT_OG_IMAGE = 'https://siteviral.com/og-image.png';
const DEFAULT_DESCRIPTION = 'Créez votre plateforme digitale, vendez vos produits numériques, collectez des dons via Mobile Money ou gagnez de l\'argent en partageant du contenu. Gratuit et sans compétences techniques.';
const DEFAULT_KEYWORDS = 'plateforme digitale, vendre produits numériques, Mobile Money, affiliation Afrique, gagner argent en ligne, ebook, formation en ligne, ambassadeur digital, contenu numérique, boutique en ligne, collecte de dons, créateur de contenu, monétisation, Siteviral';
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
    // Title
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

    // Meta description
    setMeta('name', 'description', desc);

    // Keywords — always set (use page-specific or default)
    setMeta('name', 'keywords', keywords || DEFAULT_KEYWORDS);

    // Robots
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const existingRobots = document.querySelector('meta[name="robots"]');
      if (existingRobots) existingRobots.remove();
    }

    // OG tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', locale);
    setMeta('property', 'og:url', url);

    // Article-specific OG tags
    if (article && ogType === 'article') {
      if (article.publishedTime) setMeta('property', 'article:published_time', article.publishedTime);
      if (article.modifiedTime) setMeta('property', 'article:modified_time', article.modifiedTime);
      if (article.author) setMeta('property', 'article:author', article.author);
      if (article.section) setMeta('property', 'article:section', article.section);
      article.tags?.forEach((tag) => {
        setMeta('property', 'article:tag', tag);
      });
    }

    // Twitter card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:site', TWITTER_SITE);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image);

    // Canonical — always set from url
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);

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
  }, [title, description, ogImage, ogType, canonicalUrl, jsonLd, article, noindex, locale, pathname, keywords]);

  return null;
}
