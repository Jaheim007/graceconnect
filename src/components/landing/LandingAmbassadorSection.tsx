import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Share2, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ambassadorImg from '@/assets/landing-ambassador.jpg';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function LandingAmbassadorSection() {
  const navigate = useNavigate();
  const [shares, setShares] = useState(10);
  const [conversionRate] = useState(30);
  const [avgPrice] = useState(5000);
  const [commissionRate] = useState(20);

  const sales = Math.round(shares * (conversionRate / 100));
  const earnings = sales * avgPrice * (commissionRate / 100);

  return (
    <section className="py-24 px-4 bg-muted/30 overflow-hidden">
      <div className="container max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-6">
            <Badge className="bg-accent text-accent-foreground border-0 text-xs px-3 py-1 rounded-full gap-1.5">
              <Zap className="h-3 w-3" /> Programme Ambassadeur
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Gagnez de l'argent<br />
              <span className="text-primary">sans créer de contenu</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sur Siteviral, <strong className="text-foreground">tout le monde gagne</strong> — même sans contenu. Trouvez des ressources, <strong className="text-foreground">partagez votre lien unique</strong>, et touchez de <strong className="text-accent">5% à 50% de commission</strong> sur <strong className="text-accent">chaque vente</strong>. C'est aussi simple que partager un lien WhatsApp.
            </p>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { icon: Share2, text: 'Trouvez un produit et générez votre lien' },
                { icon: TrendingUp, text: 'Partagez sur WhatsApp, Facebook, partout' },
                { icon: DollarSign, text: 'Touchez une commission sur chaque vente' },
              ].map((step, i) => (
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
              <p className="text-sm font-bold">💰 Simulez vos gains</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Nombre de partages par jour</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{shares} partages/jour</span>
                  <span>{sales} ventes estimées</span>
                </div>
              </div>
              <div className="text-center bg-primary/5 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Gains mensuels estimés</p>
                <p className="text-3xl font-extrabold text-primary">
                  {(earnings * 30).toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  À {commissionRate}% de commission sur des produits à {avgPrice.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            <Button size="lg" className="gap-2 h-12 px-8 w-full sm:w-auto" onClick={() => navigate('/ambassador-program')}>
              Devenir ambassadeur <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="flex justify-center">
            <div className="relative">
              <img src={ambassadorImg} alt="Devenir ambassadeur Siteviral" className="w-full max-w-md rounded-2xl border border-border shadow-lg" loading="lazy" />
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl border border-border shadow-lg p-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commission reçue</p>
                  <p className="text-sm font-bold">+2 500 FCFA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
