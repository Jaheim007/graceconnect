import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateSimilarCTAProps {
  productType?: string;
  productTitle: string;
}

/**
 * "Create similar content" CTA — transforms consumers into creators.
 * Links to AI Studio with pre-filled context.
 */
export function CreateSimilarCTA({ productType, productTitle }: CreateSimilarCTAProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const typeLabel: Record<string, string> = {
    pdf: 'un ebook similaire',
    ebook: 'un ebook similaire',
    audio: 'un contenu audio',
    video: 'une formation vidéo',
    course: 'un cours similaire',
  };

  const label = typeLabel[productType || ''] || 'un contenu similaire';

  const handleClick = () => {
    if (!user) {
      navigate('/auth?mode=signup&returnTo=/admin/ai-studio');
      return;
    }
    // Navigate to AI Studio — user needs an org to create
    navigate('/admin/ai-studio');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold">Inspiré ?</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Créez {label} avec notre Studio IA et vendez-le sur Siteviral.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleClick}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Créer {label}
      </Button>
    </motion.div>
  );
}
