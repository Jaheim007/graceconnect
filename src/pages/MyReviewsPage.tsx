import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Star, MessageSquare, ExternalLink, Loader2, Pencil } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedStarRating } from '@/components/products/AnimatedStarRating';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';

interface MyReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  product_id: string;
  seller_reply: string | null;
  is_verified_purchase: boolean;
  digital_products: {
    id: string;
    title: string | null;
    slug: string | null;
    cover_image_url: string | null;
    organizations: { name: string | null; slug: string | null } | null;
  } | null;
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dfl = isFr ? fr : enUS;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('product_reviews')
        .select('id, rating, title, comment, created_at, product_id, seller_reply, is_verified_purchase, digital_products(id, title, slug, cover_image_url, organizations(name, slug))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MyReviewRow[];
    },
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Mes avis — Siteviral' : 'My reviews — Siteviral'}
        description={isFr ? 'Tous les avis que vous avez laissés sur Siteviral.' : 'All the reviews you have left on Siteviral.'}
        canonicalUrl="https://siteviral.com/my-reviews"
      />
      <LandingNav />

      <main className="container max-w-4xl px-4 pt-24 pb-16 space-y-8">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-background to-accent/10 border border-border p-8 space-y-4">
          <Badge variant="secondary" className="text-[11px] px-3 py-1 rounded-full">
            <MessageSquare className="h-3 w-3 mr-1" /> {isFr ? 'Mes avis' : 'My reviews'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isFr ? 'Vos contributions' : 'Your contributions'}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {isFr
              ? "Retrouvez et gérez tous les avis que vous avez publiés sur les produits achetés."
              : 'Find and manage all the reviews you have published on the products you purchased.'}
          </p>

          {reviews.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Card className="px-4 py-3 flex items-center gap-3 bg-card/80 backdrop-blur">
                <Star className="h-5 w-5 text-[hsl(var(--accent))] fill-[hsl(var(--accent))]" />
                <div>
                  <p className="text-xs text-muted-foreground">{isFr ? 'Note moyenne donnée' : 'Average rating given'}</p>
                  <p className="text-lg font-bold">{avg.toFixed(1)}/5</p>
                </div>
              </Card>
              <Card className="px-4 py-3 flex items-center gap-3 bg-card/80 backdrop-blur">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{isFr ? 'Avis publiés' : 'Reviews published'}</p>
                  <p className="text-lg font-bold">{reviews.length}</p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-10 text-center space-y-4 border-dashed">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              {isFr ? "Vous n'avez pas encore laissé d'avis" : "You haven't left any review yet"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isFr
                ? 'Après chaque achat, vous pouvez partager votre expérience pour aider la communauté.'
                : 'After each purchase, you can share your experience to help the community.'}
            </p>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/my-purchases?tab=courses">
                <Pencil className="h-3.5 w-3.5" />
                {isFr ? 'Voir mes achats' : 'See my purchases'}
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const product = r.digital_products;
              const org = product?.organizations;
              const productUrl = product && org
                ? `/org/${org.slug}/product/${product.id}`
                : '#';

              return (
                <Card key={r.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {product?.cover_image_url ? (
                      <img
                        src={product.cover_image_url}
                        alt={product.title || ''}
                        className="h-20 w-20 rounded-xl object-cover border border-border shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-7 w-7 text-primary/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <Link
                            to={productUrl}
                            className="text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {product?.title || (isFr ? 'Produit indisponible' : 'Product unavailable')}
                          </Link>
                          {org?.name && (
                            <p className="text-[11px] text-muted-foreground">
                              {isFr ? 'par' : 'by'} {org.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <AnimatedStarRating rating={r.rating} size="sm" />
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(r.created_at), 'dd MMM yyyy', { locale: dfl })}
                          </span>
                        </div>
                      </div>

                      {r.title && (
                        <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                      )}
                      {r.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {r.comment}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {r.is_verified_purchase && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">
                            ✓ {isFr ? 'Achat vérifié' : 'Verified purchase'}
                          </Badge>
                        )}
                        {r.seller_reply && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                            ↩ {isFr ? 'Réponse du vendeur' : 'Seller replied'}
                          </Badge>
                        )}
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] gap-1 ml-auto">
                          <Link to={productUrl}>
                            {isFr ? 'Voir / modifier' : 'View / edit'}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
