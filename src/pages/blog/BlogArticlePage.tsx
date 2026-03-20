import { useParams, Link, useNavigate } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock, Share2, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { getArticleBySlug, blogArticles, getArticleOgImage, getLocalizedTitle, getLocalizedDescription, getLocalizedCategory, getLocalizedContent } from '@/lib/blogArticles';
import { useToast } from '@/hooks/use-toast';
import { useShortLink } from '@/hooks/useShortLink';
import { useI18n } from '@/i18n/I18nContext';
import { useMemo } from 'react';

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const article = getArticleBySlug(slug || '');

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <LandingNav />
        <div className="container max-w-3xl px-4 pt-32 text-center space-y-4">
          <h1 className="text-2xl font-bold">{isFr ? 'Article non trouvé' : 'Article not found'}</h1>
          <p className="text-muted-foreground">{isFr ? 'Cet article n\'existe pas ou a été déplacé.' : 'This article doesn\'t exist or has been moved.'}</p>
          <Button onClick={() => navigate('/blog')}>{isFr ? 'Voir tous les articles' : 'View all articles'}</Button>
        </div>
        <LandingFooter />
      </div>
    );
  }

  const ogImage = getArticleOgImage(article);
  const currentIndex = blogArticles.findIndex(a => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? blogArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < blogArticles.length - 1 ? blogArticles[currentIndex + 1] : null;

  const localizedTitle = getLocalizedTitle(article, locale);
  const localizedDesc = getLocalizedDescription(article, locale);
  const localizedContent = getLocalizedContent(article, locale);
  const localizedCategory = getLocalizedCategory(article.category, locale);

  // Related articles: same category first, then others, excluding current
  const relatedArticles = useMemo(() => {
    const sameCat = blogArticles.filter(a => a.slug !== article.slug && a.category === article.category);
    const others = blogArticles.filter(a => a.slug !== article.slug && a.category !== article.category);
    return [...sameCat, ...others].slice(0, 5);
  }, [article.slug, article.category]);

  // Popular / trending (pick from different categories for variety)
  const trendingArticles = useMemo(() => {
    const seen = new Set<string>();
    return blogArticles
      .filter(a => a.slug !== article.slug)
      .filter(a => {
        if (seen.has(a.category)) return false;
        seen.add(a.category);
        return true;
      })
      .slice(0, 4);
  }, [article.slug]);

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: `/blog/${article.slug}`,
    title: localizedTitle,
    description: localizedDesc,
  });

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: localizedTitle, text: localizedDesc, url: socialShareUrl });
    } else {
      await navigator.clipboard.writeText(socialShareUrl);
      toast({ title: isFr ? 'Lien copié ✅' : 'Link copied ✅' });
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${localizedTitle} — Blog Siteviral`}
        description={localizedDesc}
        ogImage={ogImage}
        ogType="article"
        canonicalUrl={`https://siteviral.com/blog/${article.slug}`}
        article={{
          publishedTime: article.publishedAt,
          section: localizedCategory,
          tags: article.personas,
        }}
      />
      <LandingNav />

      <article className="pt-14">
        {/* Hero banner */}
        <motion.div {...fadeUp} className="w-full pt-20 sm:pt-24">
          <div className="container max-w-6xl px-4">
            <div className="rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[3/1] bg-muted relative">
              <img src={ogImage} alt={localizedTitle} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/90 text-foreground border-white/60 mb-3">
                  {localizedCategory}
                </Badge>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-[1.15] max-w-3xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
                  {localizedTitle}
                </h1>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main layout: content + sidebar */}
        <div className="container max-w-6xl px-4 pt-8 pb-16">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

            {/* ── Main column ── */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {/* Meta bar */}
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex items-center gap-3 flex-wrap pb-6 border-b border-border mb-8">
                <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Tous les articles' : 'All articles'}
                </Link>
                <span className="text-border">|</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.readTime} {isFr ? 'de lecture' : 'read'}
                </span>
                <span className="text-border">|</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(article.publishedAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button onClick={handleShare} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-3.5 w-3.5" /> {isFr ? 'Partager' : 'Share'}
                </button>
              </motion.div>

              {/* Description */}
              <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 font-medium italic border-l-4 border-primary/30 pl-5">
                {localizedDesc}
              </motion.p>

              {/* Personas */}
              <div className="flex items-center gap-2 flex-wrap mb-10">
                {article.personas.map(p => (
                  <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{p}</Badge>
                ))}
              </div>

              {/* Article body */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="prose prose-base sm:prose-lg max-w-none
                  prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h2:text-2xl sm:prose-h2:text-[1.65rem] prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
                  prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                  prose-p:text-muted-foreground prose-p:leading-[1.85] prose-p:mb-5
                  prose-li:text-muted-foreground prose-li:leading-[1.8]
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:space-y-2 prose-ol:space-y-2 prose-ul:my-6 prose-ol:my-6
                  prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-muted-foreground/80
                  prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                  dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: localizedContent }}
              />

              {/* CTA banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-16 p-6 sm:p-10 rounded-2xl bg-primary text-primary-foreground text-center space-y-4"
              >
                <h3 className="text-xl sm:text-2xl font-extrabold">{isFr ? 'Prêt à commencer ?' : 'Ready to get started?'}</h3>
                <p className="text-primary-foreground/80 text-sm sm:text-base max-w-lg mx-auto">{isFr ? 'Créez votre plateforme gratuitement. Pas d\'abonnement, pas de carte requise.' : 'Create your platform for free. No subscription, no credit card required.'}</p>
                <Button size="lg" variant="secondary" className="px-8 gap-2 group" onClick={() => navigate('/auth?mode=signup')}>
                  {isFr ? 'Commencer gratuitement' : 'Get started for free'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              {/* Prev/Next navigation */}
              <div className="mt-12 grid sm:grid-cols-2 gap-4">
                {prevArticle && (
                  <Link to={`/blog/${prevArticle.slug}`} className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-elevated transition-all duration-200 group">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{isFr ? '← Précédent' : '← Previous'}</span>
                    <p className="text-sm font-semibold mt-2 group-hover:text-primary transition-colors line-clamp-2">{getLocalizedTitle(prevArticle, locale)}</p>
                  </Link>
                )}
                {nextArticle && (
                  <Link to={`/blog/${nextArticle.slug}`} className={`p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-elevated transition-all duration-200 group text-right ${!prevArticle ? 'sm:col-start-2' : ''}`}>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{isFr ? 'Suivant →' : 'Next →'}</span>
                    <p className="text-sm font-semibold mt-2 group-hover:text-primary transition-colors line-clamp-2">{getLocalizedTitle(nextArticle, locale)}</p>
                  </Link>
                )}
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className="w-full lg:w-[300px] xl:w-[340px] shrink-0">
              <div className="lg:sticky lg:top-24 space-y-8">

                {/* Related articles */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isFr ? 'Articles similaires' : 'Related articles'}
                  </h4>
                  <div className="space-y-4">
                    {relatedArticles.map((ra, i) => (
                      <motion.div
                        key={ra.slug}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
                      >
                        <Link
                          to={`/blog/${ra.slug}`}
                          className="flex gap-3 group items-start"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img src={getArticleOgImage(ra)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {getLocalizedTitle(ra, locale)}
                            </p>
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {getLocalizedCategory(ra.category, locale)} · {ra.readTime}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Trending / popular */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    {isFr ? 'Les plus lus' : 'Most read'}
                  </h4>
                  <div className="space-y-3">
                    {trendingArticles.map((ta, i) => (
                      <Link
                        key={ta.slug}
                        to={`/blog/${ta.slug}`}
                        className="flex items-start gap-3 group"
                      >
                        <span className="text-2xl font-extrabold text-muted-foreground/30 leading-none mt-0.5 tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {getLocalizedTitle(ta, locale)}
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">{ta.readTime} {isFr ? 'de lecture' : 'read'}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>

                {/* Sidebar CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="p-5 rounded-xl bg-secondary/60 border border-border space-y-3"
                >
                  <p className="text-sm font-bold text-foreground">{isFr ? '🚀 Lancez-vous gratuitement' : '🚀 Get started for free'}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isFr
                      ? 'Créez votre boutique digitale, vendez vos produits et recevez des paiements Mobile Money.'
                      : 'Create your digital store, sell your products and receive Mobile Money payments.'}
                  </p>
                  <Button size="sm" className="w-full gap-1.5 group" onClick={() => navigate('/auth?mode=signup')}>
                    {isFr ? 'Créer mon compte' : 'Create my account'}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <LandingFooter />
    </div>
  );
}
