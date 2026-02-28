import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgProducts } from '@/hooks/useMonetization';
import { Lightbulb, ArrowRight, Sparkles, Video, FileText, Mic, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

export function ContentSuggestionEngine() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);

  const suggestions = useMemo((): Suggestion[] => {
    const s: Suggestion[] = [];
    const hasVideo = media.some((m: any) => m.media_type === 'video');
    const hasAudio = media.some((m: any) => m.media_type === 'audio');
    const hasFreeProduct = products.some((p: any) => p.is_free);
    const avgPrice = products.length > 0
      ? products.reduce((acc: number, p: any) => acc + (p.price || 0), 0) / products.length
      : 0;
    const hasPreview = products.some((p: any) => p.preview_images?.length > 0);

    if (products.length === 0) {
      s.push({
        id: 'first-product',
        title: 'Créez votre premier produit',
        description: 'Les organisations avec au moins 1 produit gagnent 5x plus de revenus.',
        icon: FileText,
        action: 'Créer un produit',
        route: '/admin/products/new',
        priority: 'high',
        impact: '+500% revenus potentiels',
      });
    }

    if (!hasFreeProduct && products.length > 0) {
      s.push({
        id: 'free-lead-magnet',
        title: 'Ajoutez un produit gratuit (Lead Magnet)',
        description: 'Un échantillon gratuit convertit 3x mieux qu\'un catalogue payant seul.',
        icon: Sparkles,
        action: 'Créer un gratuit',
        route: '/admin/products/new',
        priority: 'high',
        impact: '+300% conversions',
      });
    }

    if (!hasVideo) {
      s.push({
        id: 'add-video',
        title: 'Publiez votre première vidéo',
        description: 'Le contenu vidéo génère 4x plus d\'engagement que le texte.',
        icon: Video,
        action: 'Ajouter une vidéo',
        route: '/admin/media/new',
        priority: 'medium',
        impact: '+400% engagement',
      });
    }

    if (!hasAudio) {
      s.push({
        id: 'add-audio',
        title: 'Ajoutez du contenu audio',
        description: 'Podcasts et audio touchent une audience mobile en déplacement.',
        icon: Mic,
        action: 'Ajouter un audio',
        route: '/admin/media/new',
        priority: 'low',
        impact: 'Nouvelle audience',
      });
    }

    if (products.length > 0 && !hasPreview) {
      s.push({
        id: 'add-previews',
        title: 'Ajoutez des aperçus à vos produits',
        description: 'Les produits avec images de prévisualisation convertissent 2x mieux.',
        icon: Image,
        action: 'Modifier un produit',
        route: '/admin/products',
        priority: 'medium',
        impact: '+200% conversions',
      });
    }

    if (products.length >= 3 && avgPrice > 0 && avgPrice < 2000) {
      s.push({
        id: 'price-review',
        title: 'Revoyez vos prix à la hausse',
        description: `Votre prix moyen est bas (${Math.round(avgPrice)} FCFA). Testez des prix plus élevés.`,
        icon: Lightbulb,
        action: 'Voir mes produits',
        route: '/admin/products',
        priority: 'medium',
        impact: '+50% revenus/vente',
      });
    }

    return s.slice(0, 4);
  }, [media, products]);

  if (suggestions.length === 0) return null;

  const priorityColor = { high: 'bg-red-500/10 text-red-600', medium: 'bg-amber-500/10 text-amber-600', low: 'bg-blue-500/10 text-blue-600' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-amber-500" />
        </div>
        <h2 className="font-semibold text-sm">Suggestions de contenu</h2>
        <Badge variant="secondary" className="text-[10px] ml-auto">{suggestions.length} idées</Badge>
      </div>

      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(s.route)}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold">{s.title}</span>
                <span className={`text-[9px] px-1.5 py-0 rounded-full font-medium ${priorityColor[s.priority]}`}>
                  {s.impact}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
