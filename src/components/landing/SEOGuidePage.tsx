import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

export interface SEOGuideProps {
  seo: { title: string; description: string; url: string };
  badge: string;
  title: ReactNode;
  intro: string;
  sections: { heading: string; content: string }[];
  cta: { label: string; path: string };
}

export function SEOGuidePage({ seo, badge, title, intro, sections, cta }: SEOGuideProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seo.title} description={seo.description} canonicalUrl={seo.url} />
      <LandingNav />

      <article className="pt-14">
        <div className="container max-w-3xl px-4 pt-24 pb-8">
          <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 rounded-full">{badge}</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-6">{title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-10">{intro}</p>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold mb-3">{s.heading}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="container max-w-3xl px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-extrabold">Prêt à passer à l'action ?</h2>
          <Button size="lg" className="px-8 gap-2 h-13 text-base group" onClick={() => navigate(cta.path)}>
            {cta.label} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </article>

      <LandingFooter />
    </div>
  );
}
