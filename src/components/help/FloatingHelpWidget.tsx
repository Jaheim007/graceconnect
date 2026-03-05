import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, MessageCircle, BookOpen, LifeBuoy, Keyboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

export function FloatingHelpWidget() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { user } = useAuth();
  const isFr = locale === 'fr';

  const items = [
    {
      icon: <LifeBuoy className="h-4 w-4" />,
      label: isFr ? 'Centre d\'aide' : 'Help Center',
      onClick: () => { navigate('/support'); setOpen(false); },
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: isFr ? 'Guide de démarrage' : 'Getting Started',
      onClick: () => { navigate('/support'); setOpen(false); },
    },
    {
      icon: <Keyboard className="h-4 w-4" />,
      label: isFr ? 'Raccourcis clavier' : 'Keyboard Shortcuts',
      onClick: () => {
        // Trigger Cmd+K palette
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        setOpen(false);
      },
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: isFr ? 'Nous contacter' : 'Contact Us',
      onClick: () => {
        window.open('mailto:support@siteviral.com', '_blank');
        setOpen(false);
      },
    },
  ];

  // Don't show for unauthenticated users
  if (!user) return null;

  return (
    <div className="fixed bottom-20 left-4 z-[55] md:bottom-6 md:left-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="mb-3 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <p className="text-xs font-bold">{isFr ? '💡 Besoin d\'aide ?' : '💡 Need help?'}</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-left"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {open ? <X className="h-4.5 w-4.5" /> : <HelpCircle className="h-4.5 w-4.5" />}
      </motion.button>
    </div>
  );
}
