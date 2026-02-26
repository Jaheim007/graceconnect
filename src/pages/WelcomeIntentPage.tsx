import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Share2, ShoppingBag, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const intents = [
  {
    icon: Building2,
    title: 'Créer ma plateforme',
    desc: 'Je suis une organisation ou un leader. Je veux créer ma plateforme digitale, vendre mes ressources, et bénéficier d\'ambassadeurs qui vendent pour moi.',
    path: '/create-org',
    color: 'primary' as const,
    bullets: ['Boutique numérique', 'Armée d\'ambassadeurs', 'Collecte de dons'],
  },
  {
    icon: Share2,
    title: 'Gagner en partageant',
    desc: 'Je n\'ai pas de contenu, mais je veux gagner de l\'argent en partageant les ressources des autres. Sur Siteviral, tout le monde monétise.',
    path: '/dashboard?mode=ambassador',
    color: 'accent' as const,
    bullets: ['5% à 50% de commission', 'Zéro contenu à créer', 'Lien unique en 1 clic'],
    popular: true,
  },
  {
    icon: ShoppingBag,
    title: 'Acheter du contenu',
    desc: 'Je veux découvrir et acheter des ressources numériques ou soutenir des communautés.',
    path: '/discover',
    color: 'primary' as const,
    bullets: ['Accès instantané', 'Mobile Money & Carte', 'Bibliothèque personnelle'],
  },
];

export default function WelcomeIntentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Bienvenue — Siteviral" description="Choisissez comment vous souhaitez utiliser Siteviral : créer, partager ou acheter." noindex />
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Bienvenue sur <span className="text-primary">Siteviral</span> 🎉
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </motion.div>

        <div className="grid gap-4">
          {intents.map((intent, i) => (
            <motion.button
              key={intent.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
              onClick={() => navigate(intent.path)}
              className={`w-full flex items-start gap-4 p-6 rounded-2xl border text-left transition-all duration-200 hover:shadow-elevated group relative ${
                intent.color === 'accent'
                  ? 'border-accent/30 hover:border-accent bg-card'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              {intent.popular && (
                <span className="absolute -top-2.5 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-0.5 rounded-full">
                  🔥 Populaire
                </span>
              )}
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                intent.color === 'accent' ? 'bg-accent/10' : 'bg-primary/10'
              }`}>
                <intent.icon className={`h-6 w-6 ${intent.color === 'accent' ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">{intent.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{intent.desc}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {intent.bullets.map((b) => (
                    <span key={b} className="flex items-center gap-1 text-xs text-foreground/70">
                      <CheckCircle className={`h-3 w-3 ${intent.color === 'accent' ? 'text-accent' : 'text-primary'}`} /> {b}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          Vous pourrez toujours changer d'avis plus tard dans vos paramètres.
        </motion.p>
      </div>
    </div>
  );
}
