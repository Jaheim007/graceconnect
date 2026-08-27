import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Zap, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

interface CreateSimilarCTAProps {
  productType?: string;
  productTitle: string;
}

export function CreateSimilarCTA({ productType, productTitle }: CreateSimilarCTAProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const typeLabelFr: Record<string, string> = {
    pdf: 'un ebook similaire',
    ebook: 'un ebook similaire',
    audio: 'un contenu audio',
    video: 'une formation vidéo',
    course: 'un cours similaire',
  };
  const typeLabelEn: Record<string, string> = {
    pdf: 'a similar ebook',
    ebook: 'a similar ebook',
    audio: 'audio content',
    video: 'a video course',
    course: 'a similar course',
  };

  const label = isFr
    ? (typeLabelFr[productType || ''] || 'un contenu similaire')
    : (typeLabelEn[productType || ''] || 'similar content');

  const handleClick = () => {
    if (!user) {
      navigate('/auth?mode=signup&returnTo=/ecrire');
      return;
    }
    navigate('/ecrire');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <ThumbsUp className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-bold">{isFr ? 'Inspiré ?' : 'Inspired?'}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {isFr
          ? `Créez ${label} avec notre Studio IA et vendez-le sur Siteviral.`
          : `Create ${label} with our AI Studio and sell it on Siteviral.`}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleClick}
      >
        
        {isFr ? `Créer ${label}` : `Create ${label}`}
      </Button>
    </motion.div>
  );
}
