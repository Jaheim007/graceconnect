import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const handler = () => setVisible(main.scrollTop > 400);
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  }, []);

  const scrollUp = () => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40"
        >
          <Button
            size="icon"
            onClick={scrollUp}
            className="h-10 w-10 rounded-full shadow-lg"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
