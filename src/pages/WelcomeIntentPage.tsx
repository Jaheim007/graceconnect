import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Share2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const intents = [
  {
    icon: Building2,
    title: 'Créer ma plateforme',
    desc: 'Je suis une organisation, un créateur, un coach ou une église. Je veux vendre mes ressources et gérer ma communauté.',
    path: '/create-org',
    color: 'primary',
  },
  {
    icon: Share2,
    title: 'Gagner en partageant',
    desc: 'Je n\'ai pas de contenu, mais je veux gagner de l\'argent en partageant les ressources d\'autres créateurs.',
    path: '/ambassador-program',
    color: 'accent',
  },
  {
    icon: ShoppingBag,
    title: 'Acheter du contenu',
    desc: 'Je veux découvrir et acheter des ressources numériques ou soutenir des communautés.',
    path: '/discover',
    color: 'primary',
  },
];

export default function WelcomeIntentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-10"
        >
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              onClick={() => navigate(intent.path)}
              className={`w-full flex items-start gap-4 p-6 rounded-2xl border text-left transition-all duration-200 hover:shadow-md group ${
                intent.color === 'accent'
                  ? 'border-accent/30 hover:border-accent bg-card'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                intent.color === 'accent' ? 'bg-accent/10' : 'bg-primary/10'
              }`}>
                <intent.icon className={`h-6 w-6 ${intent.color === 'accent' ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">{intent.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{intent.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Vous pourrez toujours changer d'avis plus tard dans vos paramètres.
        </p>
      </div>
    </div>
  );
}
