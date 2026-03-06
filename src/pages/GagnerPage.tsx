import { SEOHead } from '@/components/seo/SEOHead';
import { GagnerTabs } from '@/components/gagner/GagnerTabs';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * /gagner — The ambassador marketplace hub.
 * Browse products, see leaderboard, share earnings.
 */
export default function GagnerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Gagner en partageant — Marketplace Ambassadeur | Siteviral"
        description="Parcours les produits à promouvoir, deviens ambassadeur en 1 clic et gagne 5-50% de commission sur chaque vente."
        canonicalUrl="https://siteviral.com/gagner"
      />

      <div className="container max-w-5xl px-4 py-8 space-y-8">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-primary/5 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <Share2 className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
                Gagne en partageant 💰
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choisis un produit, partage ton lien, touche ta commission. Zéro contenu à créer.
              </p>
            </div>
            {!user && (
              <Button className="gap-2 shrink-0" onClick={() => navigate('/auth?intent=ambassador&redirect=/gagner')}>
                <Zap className="h-4 w-4" /> S'inscrire gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main tabs */}
        <GagnerTabs />
      </div>
    </div>
  );
}
