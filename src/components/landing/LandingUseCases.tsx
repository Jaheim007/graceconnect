import { motion } from 'framer-motion';
import { Church, GraduationCap, Heart, Music, Palette, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const useCases = [
  {
    icon: Church,
    title: 'Églises & Ministères',
    desc: 'Recevez des offrandes, vendez des prédications audio et des livres. Gérez votre communauté de fidèles.',
    example: 'Prédications · Offrandes · Documents',
  },
  {
    icon: GraduationCap,
    title: 'Coachs & Formateurs',
    desc: 'Vendez vos formations, guides et documents PDF. Suivez vos ventes avec un tableau de bord complet.',
    example: 'Cours · Certifications · Ebooks',
  },
  {
    icon: Heart,
    title: 'ONG & Associations',
    desc: 'Lancez des campagnes de collecte. Vos donateurs paient par Mobile Money en un clic.',
    example: 'Collectes · Rapports · Membres',
  },
  {
    icon: Music,
    title: 'Artistes & Musiciens',
    desc: 'Distribuez votre musique, vendez des albums et du contenu exclusif à votre audience.',
    example: 'Albums · Singles · Contenu VIP',
  },
  {
    icon: Palette,
    title: 'Créateurs de contenu',
    desc: 'Monétisez vos templates, illustrations, photos et tout type de ressource numérique.',
    example: 'Templates · Presets · Guides',
  },
  {
    icon: Briefcase,
    title: 'Entrepreneurs',
    desc: 'Lancez votre boutique digitale sans compétence technique. Vendez 24h/24, 7j/7.',
    example: 'Produits digitaux · Services · Consulting',
  },
];

export function LandingUseCases() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Cas d'usage</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Conçu pour <span className="text-primary">ceux qui créent</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Quelle que soit votre activité, Siteviral s'adapte à vos besoins.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.06 }}
              className="group rounded-2xl border border-border bg-card p-6 space-y-3 hover:border-primary/20 hover:shadow-elevated transition-all duration-200"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <uc.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-base">{uc.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              <p className="text-[11px] text-primary/70 font-medium">{uc.example}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
