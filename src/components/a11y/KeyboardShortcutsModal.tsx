import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useNavigate } from 'react-router-dom';

const shortcuts = [
  { keys: ['⌘', 'K'], desc_fr: 'Palette de commandes', desc_en: 'Command palette' },
  { keys: ['⌘', '/'], desc_fr: 'Aide raccourcis', desc_en: 'Shortcuts help' },
  { keys: ['G', 'H'], desc_fr: 'Aller au tableau de bord', desc_en: 'Go to dashboard' },
  { keys: ['G', 'D'], desc_fr: 'Aller à Découvrir', desc_en: 'Go to Discover' },
  { keys: ['G', 'N'], desc_fr: 'Aller aux notifications', desc_en: 'Go to Notifications' },
  { keys: ['G', 'P'], desc_fr: 'Aller au profil', desc_en: 'Go to Profile' },
  { keys: ['G', 'A'], desc_fr: 'Aller à l\'admin', desc_en: 'Go to Admin' },
  { keys: ['Esc'], desc_fr: 'Fermer le dialogue', desc_en: 'Close dialog' },
];

/**
 * KeyboardShortcutsModal — Triggered by Cmd+/ or ⌘+/
 * Shows all available keyboard shortcuts.
 */
export function KeyboardShortcutsModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+/ or Ctrl+/
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      setOpen(o => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // G+key navigation shortcuts
  useEffect(() => {
    let gPressed = false;
    let timer: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        clearTimeout(timer);
        timer = setTimeout(() => { gPressed = false; }, 800);
        return;
      }

      if (gPressed) {
        gPressed = false;
        const routes: Record<string, string> = { h: '/dashboard', d: '/marketplace', n: '/notifications', p: '/profile', a: '/admin' };
        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          navigate(route);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4" />
            {isFr ? 'Raccourcis clavier' : 'Keyboard Shortcuts'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
              <span className="text-xs text-muted-foreground">{isFr ? s.desc_fr : s.desc_en}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="h-6 min-w-6 px-1.5 rounded-md border border-border bg-muted text-[10px] font-mono font-semibold flex items-center justify-center"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          {isFr ? 'Appuyez sur ⌘/ pour afficher/masquer' : 'Press ⌘/ to toggle'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
