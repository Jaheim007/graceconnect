import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function LandingExitPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const show = useCallback(() => {
    if (dismissed || sessionStorage.getItem('landing_exit_dismissed')) return;
    setVisible(true);
  }, [dismissed]);

  useEffect(() => {
    // Exit intent on desktop only (mouse leaves viewport)
    // I2: Removed aggressive scroll trigger on mobile to avoid irritation
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) show();
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [show]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('landing_exit_dismissed', '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-xl space-y-4 relative"
          >
            <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Ne partez pas les mains vides !</h3>
              <p className="text-sm text-muted-foreground">
                Gagnez de l'argent en partageant du contenu. <strong className="text-foreground">Aucun contenu à créer</strong> — devenez ambassadeur gratuitement.
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full gap-2 cta-glow" onClick={() => { dismiss(); navigate('/auth?mode=signup'); }}>
                Créer mon compte gratuit <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={dismiss}>
                Non merci, je continue à naviguer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
