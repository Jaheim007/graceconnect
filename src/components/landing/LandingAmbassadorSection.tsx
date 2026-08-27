import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Share2, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ambassadorImg from '@/assets/landing-ambassador.jpg';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/** Default simulator values per currency */
const CURRENCY_DEFAULTS: Record<string, number> = {
  XOF: 5000, XAF: 5000, NGN: 5000, USD: 10, EUR: 10, GBP: 8,
  GHS: 50, KES: 1000, ZAR: 100, MAD: 50, TND: 15,
};

export function LandingAmbassadorSection() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currency, fmt } = useDisplayCurrency();

  const avgPrice = CURRENCY_DEFAULTS[currency] || 10;
  const [shares, setShares] = useState(10);
  const [conversionRate] = useState(30);
  const [commissionRate] = useState(20);

  const sales = Math.round(shares * (conversionRate / 100));
  const earnings = sales * avgPrice * (commissionRate / 100);
  const sampleCommission = Math.round(avgPrice * commissionRate / 100);

  return (
    <section className="py-24 px-4 bg-muted/30 overflow-hidden">
      <div className="container max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-6">
            <Badge className="bg-accent text-accent-foreground border-0 text-xs px-3 py-1 rounded-full gap-1.5">
              <Zap className="h-3 w-3" /> {isFr ? 'Programme Ambassadeur' : 'Ambassador Program'}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {isFr ? (
                <>Gagnez de l'argent<br /><span className="text-primary">sans créer de contenu</span></>
              ) : (
                <>Earn money<br /><span className="text-primary">without creating content</span></>
              )}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isFr
                ? <>Sur Siteviral, <strong className="text-foreground">tout le monde gagne</strong> — même sans contenu. Trouvez des ressources, <strong className="text-foreground">partagez votre lien unique</strong>, et touchez de <strong className="text-accent">5% à 50% de commission</strong> sur <strong className="text-accent">chaque vente de ressource</strong>. C'est aussi simple que partager un lien WhatsApp.</>
                : <>On Siteviral, <strong className="text-foreground">everyone earns</strong> — even without content. Find resources, <strong className="text-foreground">share your unique link</strong>, and earn <strong className="text-accent">5% to 50% commission</strong> on <strong className="text-accent">every resource sale</strong>. As simple as sharing a WhatsApp link.</>
              }
            </p>
            <p className="text-xs text-muted-foreground italic">
              {isFr
                ? '⚠️ Les commissions s\'appliquent uniquement aux ventes de ressources numériques, pas aux dons ni aux campagnes.'
                : '⚠️ Commissions apply only to digital resource sales, not donations or campaigns.'}
            </p>

            {/* Steps */}
            <div className="space-y-3">
              {(isFr ? [
                { icon: Share2, text: 'Trouvez un produit et générez votre lien' },
                { icon: TrendingUp, text: 'Partagez sur WhatsApp, Facebook, partout' },
                { icon: DollarSign, text: 'Touchez une commission sur chaque vente' },
              ] : [
                { icon: Share2, text: 'Find a product and generate your link' },
                { icon: TrendingUp, text: 'Share on WhatsApp, Facebook, everywhere' },
                { icon: DollarSign, text: 'Earn a commission on every sale' },
              ]).map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{step.text}</span>
                </div>
              ))}
            </div>

            {/* Mini simulator */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <p className="text-sm font-bold">{isFr ? '💰 Simulez vos gains' : '💰 Simulate your earnings'}</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{isFr ? 'Nombre de partages par jour' : 'Shares per day'}</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{shares} {isFr ? 'partages/jour' : 'shares/day'}</span>
                  <span>{sales} {isFr ? 'ventes estimées' : 'estimated sales'}</span>
                </div>
              </div>
              <div className="text-center bg-primary/5 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{isFr ? 'Gains mensuels estimés' : 'Estimated monthly earnings'}</p>
                <p className="text-3xl font-extrabold text-primary">
                  {fmt(Math.round(earnings * 30))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isFr
                    ? `À ${commissionRate}% de commission sur des produits à ${fmt(avgPrice)}`
                    : `At ${commissionRate}% commission on ${fmt(avgPrice)} products`}
                </p>
              </div>
            </div>

            <Button size="lg" className="gap-2 h-12 px-8 w-full sm:w-auto" onClick={() => navigate('/ambassador-program')}>
              {isFr ? 'Devenir ambassadeur' : 'Become an ambassador'} <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="flex justify-center">
            <div className="relative">
              <img src={ambassadorImg} alt={isFr ? 'Devenir ambassadeur Siteviral' : 'Become a Siteviral ambassador'} className="w-full max-w-md rounded-2xl border border-border shadow-lg" loading="lazy" />
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl border border-border shadow-lg p-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isFr ? 'Commission reçue' : 'Commission earned'}</p>
                  <p className="text-sm font-bold">+{fmt(sampleCommission)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
