import { useEffect } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { useToast } from '@/hooks/use-toast';

/**
 * Handles incoming shares from the Web Share Target API.
 * When another app shares content to Siteviral, this page receives it
 * and redirects to the appropriate action.
 */
export default function ShareTargetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const title = searchParams.get('title') || '';
    const text = searchParams.get('text') || '';
    const url = searchParams.get('url') || '';

    const sharedContent = [title, text, url].filter(Boolean).join('\n');

    if (sharedContent) {
      // Store shared content for use in the feed/post creation
      sessionStorage.setItem('sv_shared_content', JSON.stringify({ title, text, url }));
      toast({ title: '📥 Contenu reçu', description: 'Créez un post avec le contenu partagé.' });
      navigate('/feed', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Réception du contenu partagé...</div>
    </div>
  );
}
