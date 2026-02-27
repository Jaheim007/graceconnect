import { Link } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { blogArticles } from '@/lib/blogArticles';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const categories = ['Tous', ...Array.from(new Set(blogArticles.map(a => a.category)))];

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const filtered = activeCategory === 'Tous' ? blogArticles : blogArticles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog Siteviral — Guides, comparaisons et stratégies"
        description="Découvrez nos guides complets, comparaisons et stratégies pour réussir avec Siteviral. Articles pour créateurs, leaders, ONG et ambassadeurs."
        canonicalUrl="https://siteviral.com/blog"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-12 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Blog & Ressources
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Guides, comparaisons & <span className="text-primary">stratégies</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tout ce que vous devez savoir pour réussir avec Siteviral. Articles clairs, actionnables, sans jargon.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section className="py-12 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <motion.div key={article.slug} variants={fadeUp}>
                <Link
                  to={`/blog/${article.slug}`}
                  className="block p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group h-full"
                >
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full mb-3">
                    {article.category}
                  </Badge>
                  <h2 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.readTime}
                    </span>
                    <span>•</span>
                    <span>{article.personas.join(', ')}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à passer à l'action ?</h2>
          <p className="text-primary-foreground/80">
            Créez votre plateforme gratuitement et commencez à vendre ou partager dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" className="px-8 h-13 text-base gap-2 group" onClick={() => window.location.href = '/auth?mode=signup'}>
              Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
