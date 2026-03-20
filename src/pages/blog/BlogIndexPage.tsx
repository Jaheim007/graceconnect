import { Link } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, BookOpen, Users, Megaphone, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { blogArticles, BlogUniverse, getArticleOgImage } from '@/lib/blogArticles';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const categories = ['Tous', ...Array.from(new Set(blogArticles.map(a => a.category)))];

/** Infer universe from personas when no explicit universe tag is set */
function inferUniverse(personas: string[]): BlogUniverse {
  const joined = personas.join(' ').toLowerCase();
  if (personas.includes('Tous')) return 'all';
  if (joined.includes('ambassadeur') || joined.includes('étudiant') || joined.includes('jeune')) return 'ambassador';
  const creatorKeywords = ['créateur', 'formateur', 'coach', 'auteur', 'musicien', 'photographe', 'designer', 'consultant', 'agence', 'professionnel'];
  if (creatorKeywords.some(k => joined.includes(k))) return 'creator';
  const buyerKeywords = ['ong', 'association', 'église', 'diaspora', 'leader'];
  if (buyerKeywords.some(k => joined.includes(k))) return 'buyer';
  return 'all';
}

export default function BlogIndexPage() {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [activeUniverse, setActiveUniverse] = useState<BlogUniverse | 'all'>('all');

  const universeFilters: { value: BlogUniverse | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: isFr ? 'Tous' : 'All', icon: <BookOpen className="h-3 w-3" /> },
    { value: 'buyer', label: isFr ? 'Acheteurs' : 'Buyers', icon: <Users className="h-3 w-3" /> },
    { value: 'ambassador', label: isFr ? 'Ambassadeurs' : 'Ambassadors', icon: <Megaphone className="h-3 w-3" /> },
    { value: 'creator', label: isFr ? 'Créateurs' : 'Creators', icon: <Palette className="h-3 w-3" /> },
  ];

  const filtered = blogArticles.filter(a => {
    if (activeCategory !== 'Tous' && a.category !== activeCategory) return false;
    if (activeUniverse !== 'all') {
      const articleUniverse = a.universe || inferUniverse(a.personas);
      if (articleUniverse !== 'all' && articleUniverse !== activeUniverse) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Blog Siteviral — Guides, comparaisons et stratégies' : 'Siteviral Blog — Guides, comparisons & strategies'}
        description={isFr ? 'Découvrez nos guides complets, comparaisons et stratégies pour réussir avec Siteviral.' : 'Discover our complete guides, comparisons and strategies to succeed with Siteviral.'}
        canonicalUrl="https://siteviral.com/blog"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-12 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> {isFr ? 'Blog & Ressources' : 'Blog & Resources'}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            {isFr ? <>Guides, comparaisons & <span className="text-primary">stratégies</span></> : <>Guides, comparisons & <span className="text-primary">strategies</span></>}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isFr ? 'Tout ce que vous devez savoir pour réussir avec Siteviral. Articles clairs, actionnables, sans jargon.' : 'Everything you need to know to succeed with Siteviral. Clear, actionable articles, no jargon.'}
          </p>
        </div>
      </section>

      {/* Universe + Category filters */}
      <section className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container max-w-5xl px-4 space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {universeFilters.map(u => (
              <button
                key={u.value}
                onClick={() => setActiveUniverse(u.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  activeUniverse === u.value
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {u.icon} {u.label}
              </button>
            ))}
          </div>
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
                {cat === 'Tous' && !isFr ? 'All' : cat}
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
                  className="block rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group h-full overflow-hidden"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={getArticleOgImage(article)}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {isFr ? 'Prêt à passer à l\'action ?' : 'Ready to take action?'}
          </h2>
          <p className="text-primary-foreground/80">
            {isFr ? 'Créez votre plateforme gratuitement et commencez à vendre ou partager dès aujourd\'hui.' : 'Create your platform for free and start selling or sharing today.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" className="px-8 h-13 text-base gap-2 group" onClick={() => window.location.href = '/auth?mode=signup'}>
              {isFr ? 'Commencer gratuitement' : 'Get started for free'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
