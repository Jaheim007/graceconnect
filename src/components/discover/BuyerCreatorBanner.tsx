import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Banner shown on the Discover page for buyers who haven't created content yet.
 * Encourages them to use the AI Studio to create their own book/course.
 */
export function BuyerCreatorBanner() {
  const { user } = useAuth();
  const { profile, isLoading, hasPurchases } = useUserProfile();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [dismissed, setDismissed] = useState(false);

  // Only show for logged-in buyers who haven't created content
  if (!user || isLoading || dismissed) return null;
  if (profile !== 'buyer' && profile !== 'ambassador') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/5 p-5 mb-6"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm mb-1">
            {isFr ? 'Tu lis ? Tu peux aussi écrire !' : 'You read? You can also write!'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {hasPurchases
              ? (isFr
                ? 'Tu connais déjà ce qui se vend. Crée ton propre livre en 5 minutes avec l\'IA — zéro rédaction, tout est automatique.'
                : 'You already know what sells. Create your own book in 5 minutes with AI — zero writing, everything is automatic.')
              : (isFr
                ? 'L\'IA écrit, illustre et met en page pour toi. Crée ton premier ebook en 5 minutes et vends-le immédiatement.'
                : 'AI writes, illustrates and formats for you. Create your first ebook in 5 minutes and sell it immediately.')
            }
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/ecrire')}
          >
            
            {isFr ? 'Créer mon livre avec l\'IA' : 'Create my book with AI'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
