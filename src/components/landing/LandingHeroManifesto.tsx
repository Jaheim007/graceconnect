import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function LandingHeroManifesto() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative pt-14">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-accent/3 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,hsl(var(--accent)/0.08),transparent_60%)]" />

      <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-7"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full px-3.5 py-1.5 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" /> Tout le monde peut devenir auteur
          </motion.div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            <span className="text-primary">Écris.</span>{' '}
            <span className="text-accent">Vends.</span>{' '}
            <span className="text-foreground">Gagne.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            En <strong className="text-foreground">5 minutes</strong>. 
            Sans banque. 
            Dans le <strong className="text-foreground">monde entier</strong>.
          </p>

          {/* 2 CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2.5 h-14 text-base w-full sm:w-auto group cta-glow"
              onClick={() => navigate(user ? '/ecrire' : '/auth?mode=signup&intent=writer')}
            >
              <PenLine className="h-5 w-5" />
              ✏️ Écrire mon livre
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 gap-2.5 text-base w-full sm:w-auto border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
              onClick={() => navigate(user ? '/gagner' : '/auth?mode=signup&intent=ambassador')}
            >
              <Share2 className="h-5 w-5" />
              💰 Gagner en partageant
            </Button>
          </div>

          {/* Discrete discover */}
          <button
            onClick={() => navigate('/discover')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Ou simplement explorer les ressources →
          </button>

          {/* Value props strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-6 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-primary">5 min</p>
              <p className="text-[11px] text-muted-foreground">pour écrire ton livre</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-accent">0 FCFA</p>
              <p className="text-[11px] text-muted-foreground">d'abonnement</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-500">5-50%</p>
              <p className="text-[11px] text-muted-foreground">de commission ambassadeur</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            ✓ Mobile Money & Carte · ✓ Tes contenus sont protégés · ✓ Tes lecteurs vendent pour toi
          </p>
        </motion.div>
      </div>
    </section>
  );
}
