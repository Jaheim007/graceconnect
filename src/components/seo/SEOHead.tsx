import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any>;
}

export function SEOHead({ title, description, ogImage, ogType = 'website', canonicalUrl, jsonLd }: SEOHeadProps) {
  useEffect(() => {
    // Title
    document.title = title.includes('Siteviral') ? title : `${title} | Siteviral`;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description || 'Siteviral — Infrastructure Platform for Digital Organizations. Vendez, collectez, formez et développez votre communauté.');
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // OG tags
    const setOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.createElement('meta');
      el.setAttribute('property', property);
      el.setAttribute('content', content);
      if (!el.parentNode) document.head.appendChild(el);
    };

    setOG('og:title', title);
    if (description) setOG('og:description', description);
    if (ogImage) setOG('og:image', ogImage);
    setOG('og:type', ogType);
    if (canonicalUrl) setOG('og:url', canonicalUrl);

    // Twitter card
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      if (!el.parentNode) document.head.appendChild(el);
    };

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    if (description) setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    // Canonical
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      if (!link.parentNode) document.head.appendChild(link);
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
      // Cleanup JSON-LD on unmount
      const script = document.querySelector('script[data-seo-jsonld]');
      if (script) script.remove();
    };
  }, [title, description, ogImage, ogType, canonicalUrl, jsonLd]);

  return null;
}
