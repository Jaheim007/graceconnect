import { useParams, Link, useNavigate } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getArticleBySlug, blogArticles } from '@/lib/blogArticles';
import { useToast } from '@/hooks/use-toast';
import { useShortLink } from '@/hooks/useShortLink';

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const article = getArticleBySlug(slug || '');

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <LandingNav />
        <div className="container max-w-3xl px-4 pt-32 text-center space-y-4">
          <h1 className="text-2xl font-bold">Article non trouvé</h1>
          <p className="text-muted-foreground">Cet article n'existe pas ou a été déplacé.</p>
          <Button onClick={() => navigate('/blog')}>Voir tous les articles</Button>
        </div>
        <LandingFooter />
      </div>
    );
  }

  const currentIndex = blogArticles.findIndex(a => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? blogArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < blogArticles.length - 1 ? blogArticles[currentIndex + 1] : null;

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: `/blog/${article.slug}`,
    title: article.title,
    description: article.description,
  });

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.description, url: socialShareUrl });
    } else {
      await navigator.clipboard.writeText(socialShareUrl);
      toast({ title: 'Lien copié ✅' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${article.title} — Blog Siteviral`}
        description={article.description}
        canonicalUrl={`https://siteviral.com/blog/${article.slug}`}
      />
      <LandingNav />

      <article className="pt-14">
        {/* Header */}
        <div className="container max-w-3xl px-4 pt-24 pb-8 sm:pt-32 space-y-5">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Tous les articles
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">{article.category}</Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.readTime} de lecture
            </span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl font-extrabold leading-tight"
          >
            {article.title}
          </motion.h1>
          <p className="text-muted-foreground leading-relaxed">{article.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {article.personas.map(p => (
              <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{p}</Badge>
            ))}
            <button onClick={handleShare} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-3.5 w-3.5" /> Partager
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-3xl px-4 pb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="prose prose-sm sm:prose-base max-w-none
              prose-headings:font-extrabold prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-ul:space-y-1 prose-ol:space-y-1
              dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* CTA banner */}
        <div className="container max-w-3xl px-4 pb-12">
          <div className="p-6 sm:p-8 rounded-2xl bg-primary text-primary-foreground text-center space-y-4">
            <h3 className="text-xl font-extrabold">Prêt à commencer ?</h3>
            <p className="text-primary-foreground/80 text-sm">Créez votre plateforme gratuitement. Pas d'abonnement, pas de carte requise.</p>
            <Button size="lg" variant="secondary" className="px-8 gap-2 group" onClick={() => navigate('/auth?mode=signup')}>
              Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Prev/Next navigation */}
        <div className="container max-w-3xl px-4 pb-16">
          <div className="grid sm:grid-cols-2 gap-4">
            {prevArticle && (
              <Link to={`/blog/${prevArticle.slug}`} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group">
                <span className="text-[10px] text-muted-foreground">← Article précédent</span>
                <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors line-clamp-2">{prevArticle.title}</p>
              </Link>
            )}
            {nextArticle && (
              <Link to={`/blog/${nextArticle.slug}`} className={`p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group text-right ${!prevArticle ? 'sm:col-start-2' : ''}`}>
                <span className="text-[10px] text-muted-foreground">Article suivant →</span>
                <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors line-clamp-2">{nextArticle.title}</p>
              </Link>
            )}
          </div>
        </div>
      </article>

      <LandingFooter />
    </div>
  );
}
