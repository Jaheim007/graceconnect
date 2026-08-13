import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Share2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { SEOHead } from '@/components/seo/SEOHead';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function mapProduct(p: any) {
  return {
    ...p,
    organization_name: p.organizations?.name,
    organization_slug: p.organizations?.slug,
    organization_logo: p.organizations?.logo_url,
    is_org_verified: p.organizations?.is_verified,
    org_kyc_status: p.organizations?.kyc_status,
    org_category: p.organizations?.category,
  };
}

export default function NewThisWeekPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['new-this-week'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category, is_internal)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(48);
      return (data || []).filter((p: any) => !p.organizations?.is_internal).map(mapProduct);
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: freebies = [] } = useQuery({
    queryKey: ['new-this-week-free'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category, is_internal)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('is_free', true)
        .order('created_at', { ascending: false })
        .limit(8);
      return (data || []).filter((p: any) => !p.organizations?.is_internal).map(mapProduct);
    },
    staleTime: 1000 * 60 * 10,
  });

  const weekLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [isFr]);

  const share = async () => {
    const url = `${window.location.origin}/new-this-week`;
    const text = isFr ? 'Les nouveautés de la semaine sur SiteViral' : 'New this week on SiteViral';
    if (navigator.share) {
      try { await navigator.share({ title: text, text, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success(isFr ? 'Lien copié' : 'Link copied');
  };

  return (
    <AdaptiveLayout>
      <SEOHead
        title={isFr ? 'Nouveau cette semaine — SiteViral' : 'New this week — SiteViral'}
        description={
          isFr
            ? 'Les livres, formations et contenus publiés cette semaine par les créateurs SiteViral. Mis à jour chaque semaine.'
            : 'Books, courses and content published this week by SiteViral creators. Updated every week.'
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {isFr ? 'Mis à jour chaque semaine' : 'Updated every week'}
          </div>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {isFr ? 'Nouveau cette semaine' : 'New this week'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {isFr
              ? `Tout ce que les créateurs ont publié ces 7 derniers jours — au ${weekLabel}.`
              : `Everything creators published in the last 7 days — as of ${weekLabel}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-xl" onClick={share}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {isFr ? 'Partager la page' : 'Share this page'}
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/discover">
                {isFr ? 'Explorer tout' : 'Explore everything'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        {freebies.length > 0 && (
          <section className="mb-10">
            <div className="mb-1 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-sm font-bold tracking-tight">
                {isFr ? 'Gratuit pour commencer' : 'Free to start'}
              </h2>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              {isFr ? 'Aucun paiement requis — téléchargez et découvrez.' : 'No payment needed — download and see.'}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {freebies.map((p: any, i: number) => (
                <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
                  <ProductCard product={p} hideCommission hideShare />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-heading text-sm font-bold tracking-tight">
            {isFr ? 'Publié ces 7 derniers jours' : 'Published in the last 7 days'}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isFr ? 'Rien de nouveau cette semaine. Revenez lundi.' : 'Nothing new this week. Come back Monday.'}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-4 rounded-xl">
                <Link to="/discover">{isFr ? 'Explorer le catalogue' : 'Browse the catalogue'}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((p: any, i: number) => (
                <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: Math.min(i, 8) * 0.04 }}>
                  <ProductCard product={p} hideCommission hideShare />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdaptiveLayout>
  );
}
