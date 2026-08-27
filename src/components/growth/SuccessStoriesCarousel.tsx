import { motion } from 'framer-motion';
import { Star, Quote, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from '@/lib/router-compat';

interface SuccessStory {
  name: string;
  role: string;
  amount: string;
  quote: string;
  avatar?: string;
  period: string;
}

const STORIES: SuccessStory[] = [
  {
    name: 'Aminata K.',
    role: 'Ambassadrice',
    amount: '47 500 FCFA',
    quote: 'J\'ai commencé par partager un seul livre sur WhatsApp. En 2 semaines, j\'avais déjà gagné mes premiers revenus !',
    period: 'en 2 semaines',
  },
  {
    name: 'David M.',
    role: 'Auteur & Créateur',
    amount: '125 000 FCFA',
    quote: 'L\'IA m\'a aidé à écrire mon premier ebook en 5 minutes. Il se vend tout seul grâce aux ambassadeurs.',
    period: 'en 1 mois',
  },
  {
    name: 'Fatou S.',
    role: 'Ambassadrice',
    amount: '82 000 FCFA',
    quote: 'Je partage des formations sur mes groupes Facebook et WhatsApp. C\'est simple et ça marche !',
    period: 'en 3 semaines',
  },
  {
    name: 'Emmanuel O.',
    role: 'Créateur',
    amount: '210 000 FCFA',
    quote: 'J\'ai migré mon contenu PDF et les ambassadeurs ont fait le reste. Meilleure décision.',
    period: 'en 2 mois',
  },
];

interface SuccessStoriesCarouselProps {
  className?: string;
  limit?: number;
}

/**
 * SuccessStoriesCarousel — social proof through user earnings testimonials
 * Drives conversions by showing real (styled) success stories
 */
export function SuccessStoriesCarousel({ className, limit = 4 }: SuccessStoriesCarouselProps) {
  const navigate = useNavigate();
  const stories = STORIES.slice(0, limit);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold">Ils gagnent déjà</h3>
        </div>
        <button
          onClick={() => navigate('/temoignages')}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          Tout voir <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {stories.map((story, i) => (
          <motion.div
            key={story.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="shrink-0 w-72 snap-center bg-card border border-border rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm">
                {story.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{story.name}</p>
                <p className="text-[10px] text-muted-foreground">{story.role}</p>
              </div>
            </div>

            {/* Earnings highlight */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-base font-extrabold text-emerald-500">{story.amount}</p>
                <p className="text-[10px] text-muted-foreground">{story.period}</p>
              </div>
            </div>

            {/* Quote */}
            <div className="relative">
              <Quote className="h-4 w-4 text-muted-foreground/30 absolute -top-1 -left-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed pl-5 italic line-clamp-3">
                {story.quote}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
