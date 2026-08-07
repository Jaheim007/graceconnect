import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, ChevronDown, ChevronUp, Zap, BookOpen, Video, Mic, FileText, Gift, GraduationCap, Heart, Music, Camera, Palette, Calculator, Globe, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductIdea {
  id: string;
  title: string;
  description: string;
  suggestedPrice: string;
  type: string;
  emoji: string;
  icon: typeof BookOpen;
  impact: 'high' | 'medium';
}

const IDEAS_BY_CATEGORY: Record<string, ProductIdea[]> = {
  church: [
    { id: 'devotional', title: 'Plan de lecture biblique 30 jours', description: 'Un guide quotidien avec verset, méditation et prière. Format PDF, parfait pour les fidèles.', suggestedPrice: '2 000 FCFA', type: 'PDF', emoji: '📖', icon: BookOpen, impact: 'high' },
    { id: 'sermon-pack', title: 'Pack de prédications (Replay)', description: 'Compilez vos 10 meilleures prédications en vidéo. Contenu à forte valeur ajoutée.', suggestedPrice: '5 000 FCFA', type: 'Vidéo', emoji: '🎬', icon: Video, impact: 'high' },
    { id: 'worship-album', title: 'Album de louange (Audio)', description: 'Enregistrez et vendez les chants de votre groupe de louange.', suggestedPrice: '3 000 FCFA', type: 'Audio', emoji: '🎵', icon: Music, impact: 'medium' },
    { id: 'marriage-course', title: 'Formation « Couple heureux »', description: 'Un cours vidéo en 6 modules pour les couples de votre communauté.', suggestedPrice: '15 000 FCFA', type: 'Formation', emoji: '💍', icon: GraduationCap, impact: 'high' },
    { id: 'prayer-guide', title: 'Guide de prière thématique', description: 'PDF de 20 pages avec des prières pour chaque situation (santé, finances, famille).', suggestedPrice: 'Gratuit', type: 'Lead Magnet', emoji: '🙏', icon: Gift, impact: 'medium' },
    { id: 'kids-bible', title: 'Bible illustrée pour enfants', description: 'Histoires bibliques illustrées pour l\'école du dimanche. PDF coloré.', suggestedPrice: '3 500 FCFA', type: 'PDF', emoji: '👶', icon: BookOpen, impact: 'medium' },
  ],
  ngo: [
    { id: 'impact-report', title: 'Rapport d\'impact annuel', description: 'Document professionnel montrant vos réalisations. Renforce la confiance des donateurs.', suggestedPrice: 'Gratuit', type: 'Lead Magnet', emoji: '📊', icon: FileText, impact: 'high' },
    { id: 'fundraising-guide', title: 'Guide de collecte de fonds', description: 'Partagez votre expertise en fundraising avec d\'autres associations.', suggestedPrice: '7 500 FCFA', type: 'PDF', emoji: '💰', icon: BookOpen, impact: 'medium' },
    { id: 'volunteer-training', title: 'Formation bénévoles en ligne', description: 'Vidéos de formation pour préparer vos bénévoles terrain.', suggestedPrice: '5 000 FCFA', type: 'Vidéo', emoji: '🤝', icon: Video, impact: 'high' },
    { id: 'community-toolkit', title: 'Kit communautaire d\'action', description: 'Templates, checklists et guides pour mobiliser les communautés locales.', suggestedPrice: '4 000 FCFA', type: 'Kit', emoji: '🧰', icon: FileText, impact: 'medium' },
  ],
  education: [
    { id: 'course-pack', title: 'Cours complet (Vidéo + Support)', description: 'Structurez votre expertise en modules avec quiz et exercices.', suggestedPrice: '20 000 FCFA', type: 'Formation', emoji: '🎓', icon: GraduationCap, impact: 'high' },
    { id: 'exam-prep', title: 'Annales corrigées (PDF)', description: 'Compilez les épreuves passées avec corrections détaillées.', suggestedPrice: '3 000 FCFA', type: 'PDF', emoji: '📝', icon: FileText, impact: 'high' },
    { id: 'free-chapter', title: 'Chapitre gratuit (Lead Magnet)', description: 'Offrez le 1er chapitre pour donner envie d\'acheter la formation complète.', suggestedPrice: 'Gratuit', type: 'Lead Magnet', emoji: '🎁', icon: Gift, impact: 'high' },
    { id: 'study-templates', title: 'Templates d\'études', description: 'Fiches de révision, plans de cours et templates éducatifs.', suggestedPrice: '2 500 FCFA', type: 'PDF', emoji: '📋', icon: FileText, impact: 'medium' },
  ],
  business: [
    { id: 'business-plan', title: 'Template Business Plan', description: 'Modèle professionnel de plan d\'affaires adapté à l\'Afrique de l\'Ouest.', suggestedPrice: '10 000 FCFA', type: 'PDF', emoji: '📈', icon: Calculator, impact: 'high' },
    { id: 'marketing-guide', title: 'Guide Marketing Digital', description: 'Stratégies éprouvées pour vendre sur WhatsApp, Facebook et Instagram.', suggestedPrice: '7 500 FCFA', type: 'PDF', emoji: '📱', icon: Globe, impact: 'high' },
    { id: 'masterclass', title: 'Masterclass Entrepreneuriat', description: 'Formation vidéo premium avec certificat pour entrepreneurs.', suggestedPrice: '25 000 FCFA', type: 'Formation', emoji: '🏆', icon: Star, impact: 'high' },
    { id: 'freelance-kit', title: 'Kit du Freelance', description: 'Contrats, devis, factures — tout pour démarrer en freelance.', suggestedPrice: '5 000 FCFA', type: 'Kit', emoji: '💼', icon: FileText, impact: 'medium' },
  ],
  media: [
    { id: 'podcast-archive', title: 'Archive Premium Podcast', description: 'Accès exclusif aux épisodes bonus et interviews complètes.', suggestedPrice: '3 000 FCFA', type: 'Audio', emoji: '🎙️', icon: Mic, impact: 'high' },
    { id: 'photo-pack', title: 'Pack photos/visuels', description: 'Collection de photos originales haute qualité libres de droit.', suggestedPrice: '5 000 FCFA', type: 'Fichier', emoji: '📸', icon: Camera, impact: 'medium' },
    { id: 'design-templates', title: 'Templates réseaux sociaux', description: 'Pack de templates Canva pour posts, stories et carrousels.', suggestedPrice: '4 000 FCFA', type: 'Kit', emoji: '🎨', icon: Palette, impact: 'high' },
  ],
  association: [
    { id: 'membership-guide', title: 'Guide de l\'adhérent', description: 'Document complet pour accueillir et informer vos nouveaux membres.', suggestedPrice: 'Gratuit', type: 'Lead Magnet', emoji: '📋', icon: FileText, impact: 'high' },
    { id: 'event-photos', title: 'Album photo événement', description: 'Photos professionnelles de vos événements en téléchargement.', suggestedPrice: '2 000 FCFA', type: 'Fichier', emoji: '📸', icon: Camera, impact: 'medium' },
    { id: 'training-replay', title: 'Replay formation interne', description: 'Enregistrement vidéo de vos ateliers et formations.', suggestedPrice: '5 000 FCFA', type: 'Vidéo', emoji: '🎬', icon: Video, impact: 'medium' },
  ],
};

// Default ideas for categories not explicitly mapped
const DEFAULT_IDEAS: ProductIdea[] = [
  { id: 'ebook', title: 'eBook sur votre expertise', description: 'Compilez vos connaissances en un guide pratique de 30-50 pages.', suggestedPrice: '5 000 FCFA', type: 'PDF', emoji: '📘', icon: BookOpen, impact: 'high' },
  { id: 'video-course', title: 'Formation vidéo structurée', description: 'Créez 5-10 modules vidéo courts sur votre domaine d\'expertise.', suggestedPrice: '15 000 FCFA', type: 'Formation', emoji: '🎥', icon: Video, impact: 'high' },
  { id: 'free-resource', title: 'Ressource gratuite (Lead Magnet)', description: 'Un PDF gratuit pour attirer des contacts et construire votre liste.', suggestedPrice: 'Gratuit', type: 'Lead Magnet', emoji: '🎁', icon: Gift, impact: 'high' },
  { id: 'toolkit', title: 'Kit de ressources premium', description: 'Templates, checklists et guides pratiques regroupés en pack.', suggestedPrice: '7 500 FCFA', type: 'Kit', emoji: '🧰', icon: FileText, impact: 'medium' },
  { id: 'audio-content', title: 'Contenu audio exclusif', description: 'Enregistrements, podcasts ou enseignements audio à télécharger.', suggestedPrice: '3 000 FCFA', type: 'Audio', emoji: '🎧', icon: Mic, impact: 'medium' },
];

export function SmartProductIdeas() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const category = currentOrg?.category || 'other';
  const ideas = IDEAS_BY_CATEGORY[category] || DEFAULT_IDEAS;
  const visibleIdeas = expanded ? ideas : ideas.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Idées de produits</h3>
            <p className="text-[10px] text-muted-foreground">Suggestions adaptées à votre catégorie</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          <Zap className="h-2.5 w-2.5 mr-1" />
          {ideas.length} idées
        </Badge>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleIdeas.map((idea, i) => {
            const Icon = idea.icon;
            return (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/3 transition-all cursor-pointer"
                onClick={() => navigate('/admin/products/new')}
              >
                <span className="text-xl shrink-0 mt-0.5">{idea.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold truncate">{idea.title}</p>
                    {idea.impact === 'high' && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0 border-amber-500/30 text-amber-600">
                        Fort impact
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{idea.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[9px] h-4">{idea.type}</Badge>
                    <span className="text-[10px] font-medium text-primary">{idea.suggestedPrice}</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {ideas.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-xs gap-1 h-8"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Voir moins' : `Voir les ${ideas.length - 3} autres idées`}
        </Button>
      )}
    </motion.div>
  );
}
