import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { LessonPreview } from './LessonPreview';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

interface LessonPlayerOverlayProps {
  programId: string;
  onClose: () => void;
}

export function LessonPlayerOverlay({ programId, onClose }: LessonPlayerOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const root = rootRef.current;
      const fullscreenElement = document.fullscreenElement;
      setIsFullscreen(Boolean(root && fullscreenElement && (fullscreenElement === root || root.contains(fullscreenElement))));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (!document.fullscreenElement) {
        await root.requestFullscreen();
      } else if (document.fullscreenElement === root || root.contains(document.fullscreenElement)) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[LessonPlayerOverlay] fullscreen toggle failed', error);
    }
  };

  const handleClose = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[LessonPlayerOverlay] fullscreen exit failed', error);
    }

    onClose();
  };

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[120] bg-background">
      <LessonPreview
        programId={programId}
        onClose={handleClose}
        mode="learner"
        headerActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFullscreen}
            title={isFullscreen ? (isFr ? 'Quitter le plein écran' : 'Exit fullscreen') : (isFr ? 'Plein écran' : 'Fullscreen')}
            aria-label={isFullscreen ? (isFr ? 'Quitter le plein écran' : 'Exit fullscreen') : (isFr ? 'Plein écran' : 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        }
      />
    </div>,
    document.body,
  );
}
