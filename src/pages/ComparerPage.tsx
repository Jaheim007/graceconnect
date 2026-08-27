import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Star, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/hooks/useClientAnalytics';

interface Competitor {
  name: string;
  fee: string;
  monthly: string;
  highlight?: boolean;
  pros: string[];
  cons: string[];
}

export default function ComparerPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  const competitors: Competitor[] = [
    {
      name: 'SiteViral',
      fee: isFr ? '10% (0% en Pro)' : '10% (0% on Pro)',
      monthly: isFr ? 'Gratuit' : 'Free',
      highlight: true,
      pros: isFr
        ? [
            'Mobile Money natif (Orange, MTN, Wave, M-Pesa)',
            'IA incluse (livre, formation, images)',
            'Programme ambassadeur intégré',
            'Bilingue FR/EN, 48 devises',
            'Pas d’abonnement obligatoire',
          ]
        : [
            'Native Mobile Money (Orange, MTN, Wave, M-Pesa)',
            'AI included (book, course, images)',
            'Built-in ambassador program',
            'Bilingual FR/EN, 48 currencies',
            'No mandatory subscription',
          ],
      cons: isFr
        ? ['Plateforme jeune (moins de templates)']
        : ['Young platform (fewer templates)'],
    },
    {
      name: 'Gumroad',
      fee: '10% + Stripe',
      monthly: isFr ? 'Gratuit' : 'Free',
      pros: isFr
        ? ['Marque connue', 'Simple à utiliser']
        : ['Known brand', 'Simple to use'],
      cons: isFr
        ? [
            'Pas de Mobile Money',
            'Interface anglais uniquement',
            'Pas de programme ambassadeur natif',
            'Pas d’IA intégrée',
          ]
        : [
            'No Mobile Money',
            'English-only interface',
            'No native ambassador program',
            'No built-in AI',
          ],
    },
    {
      name: 'Podia',
      fee: isFr ? '0% (avec abonnement)' : '0% (with subscription)',
      monthly: '$33–$75/mo',
      pros: isFr
        ? ['Cours en ligne robustes', 'Email marketing inclus']
        : ['Robust online courses', 'Email marketing included'],
      cons: isFr
        ? [
            'Abonnement obligatoire pour vendre',
            'Pas de Mobile Money',
            'Cher pour démarrer',
            'Pas optimisé pour l’Afrique',
          ]
        : [
            'Mandatory subscription to sell',
            'No Mobile Money',
            'Expensive to start',
            'Not optimized for Africa',
          ],
    },
    {
      name: 'Systeme.io',
      fee: isFr ? '0% (avec abonnement)' : '0% (with subscription)',
      monthly: '€27–€97/mo',
      pros: isFr
        ? ['Tunnel marketing complet', 'Affiliation native']
        : ['Complete marketing funnel', 'Native affiliation'],
      cons: isFr
        ? [
            'Abonnement payant rapidement',
            'Mobile Money limité',
            'Courbe d’apprentissage',
            'Pas d’IA contenu intégrée',
          ]
        : [
            'Quickly becomes paid',
            'Limited Mobile Money',
            'Learning curve',
            'No built-in content AI',
          ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={
          isFr
            ? 'SiteViral vs Gumroad, Podia, Systeme.io — Comparatif 2026'
            : 'SiteViral vs Gumroad, Podia, Systeme.io — 2026 Comparison'
        }
        description={
          isFr
            ? 'Compare SiteViral aux meilleures plateformes pour vendre tes produits numériques en Afrique. Mobile Money, IA, ambassadeurs : on gagne sur 4 critères.'
            : 'Compare SiteViral with top platforms to sell digital products in Africa. Mobile Money, AI, ambassadors: we win on 4 criteria.'
        }
        canonicalUrl="https://siteviral.com/comparer"
        keywords="comparatif gumroad, alternative podia, alternative systeme.io, vendre ebook afrique, mobile money plateforme"
      />
      <LandingNav />

      <section className="container px-4 py-12 sm:py-16 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3">
            {isFr ? 'Comparatif 2026' : '2026 Comparison'}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            {isFr
              ? 'SiteViral vs Gumroad, Podia, Systeme.io'
              : 'SiteViral vs Gumroad, Podia, Systeme.io'}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {isFr
              ? 'On a mis les chiffres sur la table. Tu choisis ce qui compte pour toi.'
              : 'We put the numbers on the table. You pick what matters to you.'}
          </p>
        </motion.div>

        {/* Comparison table — desktop */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold">{isFr ? 'Critère' : 'Criterion'}</th>
                {competitors.map(c => (
                  <th
                    key={c.name}
                    className={cn(
                      'text-left p-4 font-semibold',
                      c.highlight && 'bg-primary/5 text-primary',
                    )}
                  >
                    {c.highlight && <Star className="inline h-3 w-3 mr-1 fill-current" />}
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">{isFr ? 'Commission' : 'Commission'}</td>
                {competitors.map(c => (
                  <td key={c.name} className={cn('p-4', c.highlight && 'bg-primary/5 font-semibold')}>
                    {c.fee}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{isFr ? 'Abonnement' : 'Subscription'}</td>
                {competitors.map(c => (
                  <td key={c.name} className={cn('p-4', c.highlight && 'bg-primary/5 font-semibold')}>
                    {c.monthly}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Mobile Money</td>
                <td className="p-4 bg-primary/5"><Check className="h-4 w-4 text-primary" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4 text-xs text-muted-foreground">{isFr ? 'Limité' : 'Limited'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{isFr ? 'IA contenu' : 'Content AI'}</td>
                <td className="p-4 bg-primary/5"><Check className="h-4 w-4 text-primary" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{isFr ? 'Ambassadeurs natifs' : 'Native ambassadors'}</td>
                <td className="p-4 bg-primary/5"><Check className="h-4 w-4 text-primary" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><Check className="h-4 w-4 text-primary" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">{isFr ? 'Bilingue FR/EN' : 'Bilingual FR/EN'}</td>
                <td className="p-4 bg-primary/5"><Check className="h-4 w-4 text-primary" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><X className="h-4 w-4 text-muted-foreground" /></td>
                <td className="p-4"><Check className="h-4 w-4 text-primary" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden space-y-4">
          {competitors.map(c => (
            <div
              key={c.name}
              className={cn(
                'rounded-2xl border p-4',
                c.highlight ? 'border-primary bg-primary/5' : 'bg-card',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{c.name}</h3>
                {c.highlight && <Badge>{isFr ? 'Recommandé' : 'Recommended'}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">{isFr ? 'Commission' : 'Fee'}</div>
                  <div className="font-semibold">{c.fee}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">{isFr ? 'Abonnement' : 'Subscription'}</div>
                  <div className="font-semibold">{c.monthly}</div>
                </div>
              </div>
              <ul className="space-y-1 text-xs">
                {c.pros.map((p, i) => (
                  <li key={`p${i}`} className="flex gap-2"><Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}</li>
                ))}
                {c.cons.map((p, i) => (
                  <li key={`c${i}`} className="flex gap-2 text-muted-foreground"><X className="h-3 w-3 mt-0.5 shrink-0" />{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ROI section */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/30 p-6 sm:p-8 text-center">
          <TrendingDown className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {isFr
              ? 'Tu vends en Afrique ? Le choix est fait.'
              : 'Selling in Africa? The choice is made.'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            {isFr
              ? 'Les autres plateformes te font payer pour ne pas accepter Mobile Money. Nous, on l’inclut gratuitement.'
              : 'Other platforms charge you to NOT accept Mobile Money. We include it for free.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => {
                trackEvent('comparer_cta_click', { target: 'signup' });
                navigate('/auth?mode=signup');
              }}
            >
              {isFr ? 'Créer mon compte gratuit' : 'Create my free account'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                trackEvent('comparer_cta_click', { target: 'pricing' });
                navigate('/pricing');
              }}
            >
              {isFr ? 'Voir les tarifs' : 'See pricing'}
            </Button>
          </div>
        </div>
      </section>

      <LandingFooterCompact />
    </div>
  );
}
