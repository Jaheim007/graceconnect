import { ReactNode } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useUtmCapture } from '@/hooks/useUtmCapture';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoLayoutProps {
  title: string;
  description: string;
  seoTitle: string;
  seoDesc: string;
  emoji: string;
  children: ReactNode;
  ctaText?: string;
  ctaHref?: string;
}

export function PromoLayout({ title, description, seoTitle, seoDesc, emoji, children, ctaText, ctaHref }: PromoLayoutProps) {
  useUtmCapture();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seoTitle} description={seoDesc} canonicalUrl={`https://siteviral.com${pathname}`} />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container max-w-5xl px-4 py-10 relative">
          <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Discover
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{emoji}</span>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground max-w-xl">{description}</p>
          {ctaText && ctaHref && (
            <Link to={ctaHref}>
              <Button className="mt-4" size="lg">{ctaText}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl px-4 py-8">
        {children}
      </div>
    </div>
  );
}
