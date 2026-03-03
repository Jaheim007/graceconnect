import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Wifi, Landmark, Rocket, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const partners = [
  {
    icon: Building2, category: 'Agences digitales',
    title: 'Proposez Siteviral à vos clients',
    desc: 'Créez des boutiques digitales pour vos clients en 10 minutes. Commission récurrente sur chaque transaction.',
    cta: 'Devenir partenaire agence',
    path: '/devenir-partenaire',
  },
  {
    icon: Wifi, category: 'Télécoms & Fintechs',
    title: 'Augmentez votre volume de transactions',
    desc: 'Siteviral agrège des milliers de marchands Mobile Money. Intégration native avec les principaux opérateurs.',
    cta: 'Nous contacter',
    path: '/contact',
  },
  {
    icon: Rocket, category: 'Incubateurs & Accélérateurs',
    title: 'Offrez Siteviral à vos startups',
    desc: 'Vos incubés ont tous besoin d\'une vitrine de vente digitale. Siteviral est la solution clé en main.',
    cta: 'Nous contacter',
    path: '/contact',
  },
  {
    icon: Landmark, category: 'Institutions & Gouvernements',
    title: 'Infrastructure de digitalisation',
    desc: 'Solution locale pour digitaliser des secteurs entiers : éducation, agriculture, culture, religion.',
    cta: 'Nous contacter',
    path: '/contact',
  },
  {
    icon: BookOpen, category: 'Maisons d\'édition',
    title: 'Vendez vos livres en Afrique',
    desc: 'Distribution digitale avec paiement Mobile Money. Amazon ne couvre pas l\'Afrique francophone — nous oui.',
    cta: 'Nous contacter',
    path: '/contact',
  },
];

export default function PartenairesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Partenaires stratégiques — Siteviral" description="Rejoignez l'écosystème Siteviral. Agences, télécoms, incubateurs, gouvernements — construisons ensemble." canonicalUrl="https://siteviral.com/partenaires" />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 text-center space-y-4">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">🤝 Partenaires</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Construisons <span className="text-primary">ensemble</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Siteviral est une infrastructure ouverte. Que vous soyez agence, télécom, incubateur ou institution — il y a une place pour vous dans notre écosystème.</p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="container max-w-5xl grid sm:grid-cols-2 gap-6">
          {partners.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.title} variants={fadeUp} className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">{p.category}</Badge>
                </div>
                <h2 className="text-lg font-bold">{p.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
                <Button variant="outline" className="gap-2 w-fit" onClick={() => navigate(p.path)}>
                  {p.cta} <ArrowRight className="h-3 w-3" />
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">Vous avez un projet de partenariat ?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">Contactez notre équipe partenariats. Nous répondons sous 48h.</p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate('/contact')}>
            Nous contacter <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
