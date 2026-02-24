import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center gap-2 py-1.5 px-4 overflow-hidden z-[100]"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Vous êtes hors ligne — certaines fonctionnalités sont limitées</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
