import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Wifi, Landmark, Rocket, BookOpen } from 'lucide-react';
import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

export default function PartenairesPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const partners = [
    { icon: Building2, category: isFr ? 'Agences digitales' : 'Digital agencies', title: isFr ? 'Proposez Siteviral à vos clients' : 'Offer Siteviral to your clients', desc: isFr ? 'Créez des boutiques digitales pour vos clients en 10 minutes. Commission récurrente sur chaque transaction.' : 'Create digital stores for your clients in 10 minutes. Recurring commission on each transaction.', cta: isFr ? 'Devenir partenaire agence' : 'Become an agency partner', path: '/devenir-partenaire' },
    { icon: Wifi, category: isFr ? 'Télécoms & Fintechs' : 'Telecoms & Fintechs', title: isFr ? 'Augmentez votre volume de transactions' : 'Increase your transaction volume', desc: isFr ? 'Siteviral agrège des milliers de marchands Mobile Money. Intégration native avec les principaux opérateurs.' : 'Siteviral aggregates thousands of Mobile Money merchants. Native integration with major operators.', cta: isFr ? 'Nous contacter' : 'Contact us', path: '/contact' },
    { icon: Rocket, category: isFr ? 'Incubateurs & Accélérateurs' : 'Incubators & Accelerators', title: isFr ? 'Offrez Siteviral à vos startups' : 'Offer Siteviral to your startups', desc: isFr ? 'Vos incubés ont tous besoin d\'une vitrine de vente digitale. Siteviral est la solution clé en main.' : 'Your incubees all need a digital sales storefront. Siteviral is the turnkey solution.', cta: isFr ? 'Nous contacter' : 'Contact us', path: '/contact' },
    { icon: Landmark, category: isFr ? 'Institutions & Gouvernements' : 'Institutions & Governments', title: isFr ? 'Infrastructure de digitalisation' : 'Digitalization infrastructure', desc: isFr ? 'Solution locale pour digitaliser des secteurs entiers : éducation, agriculture, culture, religion.' : 'Local solution to digitize entire sectors: education, agriculture, culture, religion.', cta: isFr ? 'Nous contacter' : 'Contact us', path: '/contact' },
    { icon: BookOpen, category: isFr ? 'Maisons d\'édition' : 'Publishers', title: isFr ? 'Vendez vos livres en Afrique' : 'Sell your books in Africa', desc: isFr ? 'Distribution digitale avec paiement Mobile Money. Amazon ne couvre pas l\'Afrique — nous oui.' : 'Digital distribution with Mobile Money payment. Amazon doesn\'t cover Africa — we do.', cta: isFr ? 'Nous contacter' : 'Contact us', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Partenaires stratégiques — Siteviral' : 'Strategic Partners — Siteviral'} description={isFr ? 'Rejoignez l\'écosystème Siteviral. Agences, télécoms, incubateurs, gouvernements.' : 'Join the Siteviral ecosystem. Agencies, telecoms, incubators, governments.'} canonicalUrl="https://siteviral.com/partenaires" />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 text-center space-y-4">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">{isFr ? '🤝 Partenaires' : '🤝 Partners'}</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{isFr ? <>Construisons <span className="text-primary">ensemble</span></> : <>Let's build <span className="text-primary">together</span></>}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{isFr ? 'Siteviral est une infrastructure ouverte. Que vous soyez agence, télécom, incubateur ou institution — il y a une place pour vous.' : 'Siteviral is an open infrastructure. Whether you\'re an agency, telecom, incubator or institution — there\'s a place for you.'}</p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="container max-w-5xl grid sm:grid-cols-2 gap-6">
          {partners.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.title} variants={fadeUp} className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                  <Badge variant="outline" className="text-xs">{p.category}</Badge>
                </div>
                <h2 className="text-lg font-bold">{p.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
                <Button variant="outline" className="gap-2 w-fit" onClick={() => navigate(p.path)}>{p.cta} <ArrowRight className="h-3 w-3" /></Button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">{isFr ? 'Vous avez un projet de partenariat ?' : 'Have a partnership project?'}</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">{isFr ? 'Contactez notre équipe partenariats. Nous répondons sous 48h.' : 'Contact our partnerships team. We respond within 48h.'}</p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate('/contact')}>
            {isFr ? 'Nous contacter' : 'Contact us'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
