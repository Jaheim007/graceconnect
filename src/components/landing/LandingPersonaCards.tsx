import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Share2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const personas = [
  {
    icon: Building2,
    label: 'Organisations',
    title: 'Centralisez tout.\nMonétisez tout.',
    desc: 'Créez votre plateforme complète : boutique numérique, dons, événements, communauté. Zéro abonnement, zéro compétence technique.',
    features: ['Vente de ressources numériques', 'Collecte de dons & offrandes', 'Programme ambassadeur intégré', 'Paiement Mobile Money & Carte'],
    cta: 'Créer ma plateforme',
    ctaPath: '/auth?mode=signup',
    accent: 'primary',
  },
  {
    icon: Share2,
    label: 'Ambassadeurs',
    title: 'Partagez.\nGagnez.',
    desc: 'Vous n\'avez aucun contenu ? Pas de problème. Partagez les ressources d\'autres créateurs et touchez une commission sur chaque vente.',
    features: ['5% à 50% de commission', 'Zéro contenu à créer', 'Lien de partage en 1 clic', 'Versement automatique'],
    cta: 'Devenir ambassadeur',
    ctaPath: '/ambassador-program',
    accent: 'gold',
  },
  {
    icon: ShoppingBag,
    label: 'Acheteurs',
    title: 'Découvrez.\nSoutenez.',
    desc: 'Accédez à des ebooks, audio, vidéos et ressources numériques. Soutenez vos communautés par des dons. Payez par Mobile Money ou carte.',
    features: ['Accès instantané après achat', 'Paiement sécurisé Paystack & Stripe', 'Bibliothèque personnelle', 'Dons avec suivi transparent'],
    cta: 'Explorer les ressources',
    ctaPath: '/discover',
    accent: 'primary',
  },
];

export function LandingPersonaCards() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Une plateforme, <span className="text-primary">trois opportunités</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Que vous soyez créateur, entrepreneur ou simple utilisateur, Siteviral a quelque chose pour vous.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p, i) => (
            <motion.div
              key={p.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border p-8 space-y-5 transition-all duration-200 hover:shadow-lg ${
                p.accent === 'gold'
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/20 relative'
                  : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              {p.accent === 'gold' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                    🔥 Populaire
                  </span>
                </div>
              )}
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                p.accent === 'gold' ? 'bg-accent/10' : 'bg-primary/10'
              }`}>
                <p.icon className={`h-6 w-6 ${p.accent === 'gold' ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{p.label}</span>
                <h3 className="text-xl font-bold mt-1 whitespace-pre-line leading-tight">{p.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${p.accent === 'gold' ? 'bg-accent' : 'bg-primary'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gap-2 h-11"
                variant={p.accent === 'gold' ? 'default' : 'outline'}
                onClick={() => navigate(p.ctaPath)}
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
