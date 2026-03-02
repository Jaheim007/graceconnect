import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Share2, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';

export function LandingHeroSplit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setMode } = useMode();

  const handleGagner = () => {
    if (user) {
      setMode('ambassador');
      navigate('/dashboard');
    } else {
      navigate('/auth?intent=ambassador');
    }
  };

  const handleVendre = () => {
    if (user) {
      setMode('creator');
      navigate('/dashboard');
    } else {
      navigate('/auth?intent=creator');
    }
  };

  return (
    <section className="relative pt-14">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> La plateforme où tout le monde gagne
          </div>

          {/* Main headline — readable in 5 seconds */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight">
            Gagnez de l'argent{' '}
            <span className="text-accent">en partageant</span>.
            <br />
            Vendez plus grâce à{' '}
            <span className="text-primary">une armée</span>.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Siteviral transforme chaque ressource digitale en{' '}
            <strong className="text-foreground">opportunité de commission</strong>.
          </p>

          {/* 2 CTAs — primary personas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2 h-13 text-base w-full sm:w-auto group cta-glow"
              onClick={handleGagner}
            >
              <Share2 className="h-4 w-4" />
              💰 Je veux gagner
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 gap-2 text-base w-full sm:w-auto"
              onClick={handleVendre}
            >
              <Building2 className="h-4 w-4" />
              🏢 Je veux vendre
            </Button>
          </div>

          {/* Discrete marketplace link */}
          <button
            onClick={() => navigate('/marketplace')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Explorer la marketplace →
          </button>

          {/* Value props strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-center">
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary">0 FCFA</p>
              <p className="text-[11px] text-muted-foreground">d'abonnement</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-accent">5-50%</p>
              <p className="text-[11px] text-muted-foreground">de commission</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary">60 sec</p>
              <p className="text-[11px] text-muted-foreground">pour commencer</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            ✓ Pas de carte requise · ✓ Pas d'abonnement · ✓ Mobile Money & Carte
          </p>
        </motion.div>
      </div>
    </section>
  );
}
