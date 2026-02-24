import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Users, BarChart3, Wallet,
  Search, Link2, TrendingUp, ShieldCheck, Headphones, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { SEOHead } from '@/components/seo/SEOHead';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function PublicAffiliationPage() {
  const navigate = useNavigate();

  const steps = [
    { num: '1', title: 'Choisissez vos produits', desc: 'Parcourez les organisations et sélectionnez les produits qui correspondent à votre audience. Chaque produit inclut son taux de commission.', icon: Search },
    { num: '2', title: 'Partagez vos liens', desc: 'Obtenez un lien de tracking unique pour chaque organisation ou produit. Partagez sur vos réseaux, site web ou par email.', icon: Link2 },
    { num: '3', title: 'Gagnez des commissions', desc: 'Chaque vente réalisée via votre lien vous rapporte une commission. Suivez vos performances en temps réel.', icon: TrendingUp },
  ];

  const benefits = [
    { icon: Wallet, title: 'Commissions rapides', desc: 'Les paiements sont automatisés. Commissions disponibles sous 72h. Retraits par Mobile Money ou virement.' },
    { icon: BarChart3, title: 'Suivi en temps réel', desc: 'Un tableau de bord clair : clics, conversions, revenus. Voyez exactement d\'où viennent vos gains.' },
    { icon: Headphones, title: 'Support dédié', desc: 'Notre équipe vous accompagne. Ressources, guides et conseils pour maximiser vos résultats.' },
    { icon: ShieldCheck, title: 'Transparent & fiable', desc: 'Aucun frais caché. Commissions clairement définies par chaque organisation. Historique complet.' },
  ];

  const faq = [
    { q: 'Combien puis-je gagner en tant qu\'affilié ?', a: 'Les commissions varient de 5% à 50% selon l\'organisation et le produit. Plus vous partagez, plus vous gagnez.' },
    { q: 'Y a-t-il des frais pour rejoindre le réseau ?', a: 'Non, devenir affilié est entièrement gratuit. Il suffit de rejoindre une organisation et d\'activer l\'affiliation.' },
    { q: 'Comment sont versées les commissions ?', a: 'Les commissions deviennent disponibles 72h après la transaction. Vous pouvez demander un retrait par Mobile Money ou virement bancaire.' },
    { q: 'Puis-je promouvoir plusieurs organisations ?', a: 'Oui ! Vous pouvez être affilié à autant d\'organisations que vous le souhaitez et avoir des liens pour chacune.' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead title="Programme d'Affiliation — Siteviral" description="Gagnez des commissions en promouvant des produits numériques. Rejoignez le réseau d'affiliation Siteviral." />
      <LandingNav />

      {/* Hero */}
      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center space-y-6">
            <motion.div variants={fadeUp} className="flex justify-center gap-3">
              <Button variant="default" size="sm" className="rounded-full px-6">Devenir affilié</Button>
              <Button variant="outline" size="sm" className="rounded-full px-6" onClick={() => navigate('/auth?mode=signup')}>Promouvoir mes produits</Button>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Gagnez en promouvant des produits<br /><span className="text-primary">que vous aimez.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Rejoignez le réseau d'affiliation dédié aux organisations digitales. Générez des revenus récurrents en recommandant des produits utiles et performants.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button size="lg" className="px-8 gap-2 h-13 text-base" onClick={() => navigate('/auth?mode=signup')}>
                Rejoindre le réseau <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 border-y border-border/40 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-3 gap-6">
            <AnimatedCounter value={500} suffix="+" label="Organisations" />
            <AnimatedCounter value={50} suffix="%" label="Commission max" />
            <AnimatedCounter value={150} suffix="+" label="Pays" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Comment ça marche</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              En <span className="text-primary">3 étapes simples</span>, commencez à gagner
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }}>
                <div className="bg-card rounded-2xl border border-border p-8 space-y-4 hover:border-primary/20 transition-colors h-full">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-4xl font-black text-muted-foreground/15">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Avantages</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Pourquoi devenir affilié <span className="text-primary">Siteviral ?</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mt-3">Une plateforme pensée pour votre réussite</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-card rounded-2xl border border-border p-7 hover:border-primary/20 transition-colors space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For organizations: promote */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-6">
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">Pour les organisations</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Développez vos ventes grâce à <span className="text-primary">notre réseau d'affiliés</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Boostez vos ventes sans perdre le contrôle. Des affiliés promeuvent vos produits et campagnes. Siteviral gère les liens de tracking et le paiement des commissions automatiquement.
              </p>
              <ul className="space-y-3">
                {[
                  'Activez l\'affiliation en un clic depuis votre panneau admin',
                  'Définissez votre taux de commission (5% à 50%)',
                  'Suivez les performances de chaque affilié en temps réel',
                  'Les commissions sont calculées et versées automatiquement',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="gap-2 h-11 px-6" onClick={() => navigate('/auth?mode=signup')}>
                Lancer mon programme d'affiliation <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 space-y-5"
            >
              <h3 className="font-bold text-lg">Tableau de bord affiliés</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Affiliés actifs', value: '47', icon: Users },
                  { label: 'Ventes via affiliés', value: '312', icon: TrendingUp },
                  { label: 'Commissions versées', value: '$4,230', icon: Wallet },
                  { label: 'Taux de conversion', value: '8.2%', icon: BarChart3 },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-4 text-center">
                    <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Questions fréquentes</h2>
          </motion.div>
          <div className="space-y-4">
            {faq.map((item) => (
              <motion.details key={item.q} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="group bg-card border border-border rounded-2xl overflow-hidden"
              >
                <summary className="cursor-pointer px-6 py-4 font-semibold text-sm flex items-center justify-between list-none">
                  {item.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative z-10 p-8 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight">
                Prêt à développer vos revenus avec l'affiliation ?
              </h2>
              <p className="text-primary-foreground/70 max-w-md mx-auto">
                Rejoignez le réseau d'affiliation pour organisations digitales et commencez à gagner dès aujourd'hui.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 border-0 px-8 h-13 text-base gap-2" onClick={() => navigate('/auth?mode=signup')}>
                  Devenir affilié <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 h-13 text-base gap-2" onClick={() => navigate('/auth?mode=signup')}>
                  Lancer mon programme
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
