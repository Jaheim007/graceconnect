import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useMode } from '@/contexts/ModeContext';

export default function WelcomeIntentPage() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  const chooseAmbassador = () => {
    setMode('ambassador');
    navigate('/quick-start');
  };

  const chooseCreator = () => {
    setMode('creator');
    navigate('/create-org');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Bienvenue — Siteviral" description="Choisissez comment vous souhaitez utiliser Siteviral." noindex />
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Que veux-tu faire ? 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            Choisis ton chemin. Tu pourras toujours changer plus tard.
          </p>
        </motion.div>

        <div className="grid gap-4">
          {/* Ambassador — Primary */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            onClick={chooseAmbassador}
            className="relative w-full flex items-center gap-4 p-6 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 bg-card text-left transition-all duration-200 hover:shadow-elevated group"
          >
            <span className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
              🔥 Populaire
            </span>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Share2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold">💰 Gagner de l'argent</h3>
              <p className="text-xs font-semibold text-emerald-500 mb-1">Ambassadeur</p>
              <p className="text-sm text-muted-foreground">
                Partage des produits. Touche des commissions.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Creator */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            onClick={chooseCreator}
            className="w-full flex items-center gap-4 p-6 rounded-2xl border-2 border-border hover:border-primary/40 bg-card text-left transition-all duration-200 hover:shadow-elevated group"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold">🏢 Vendre mon contenu</h3>
              <p className="text-xs font-semibold text-primary mb-1">Créateur</p>
              <p className="text-sm text-muted-foreground">
                Crée ton centre digital. Active des ambassadeurs.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
