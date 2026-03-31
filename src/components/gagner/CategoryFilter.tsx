import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { BookOpen, Church, Briefcase, Heart, GraduationCap, DollarSign, Users, Sparkles } from 'lucide-react';

export type ProductCategory = 'all' | 'business' | 'spirituality' | 'education' | 'motivation' | 'finance' | 'family' | 'other';

const CATEGORIES: { key: ProductCategory; icon: React.ElementType; labelFr: string; labelEn: string }[] = [
  { key: 'all', icon: Sparkles, labelFr: 'Tout', labelEn: 'All' },
  { key: 'business', icon: Briefcase, labelFr: 'Business', labelEn: 'Business' },
  { key: 'spirituality', icon: Church, labelFr: 'Spiritualité', labelEn: 'Spirituality' },
  { key: 'education', icon: GraduationCap, labelFr: 'Éducation', labelEn: 'Education' },
  { key: 'motivation', icon: Heart, labelFr: 'Motivation', labelEn: 'Motivation' },
  { key: 'finance', icon: DollarSign, labelFr: 'Finances', labelEn: 'Finance' },
  { key: 'family', icon: Users, labelFr: 'Famille', labelEn: 'Family' },
];

/**
 * Maps product titles to categories using keyword matching.
 * Used for client-side filtering since products don't have a category column.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  spirituality: ['prière', 'prayer', 'bible', 'spirituel', 'spiritual', 'église', 'church', 'worship', 'dieu', 'god', 'méditation', 'meditation', 'chrétien', 'christian', 'sermon', 'prophét', 'prophet', 'grâce', 'grace', 'foi', 'faith', 'manteau', 'pasteur', 'pastor', 'évêque', 'bishop', 'apôtre', 'apostle', 'onction', 'anointing', 'saint', 'jésus', 'jesus', 'évangile', 'gospel', 'louange', 'praise', 'intercession', 'délivrance', 'deliverance', 'jeûne', 'fasting'],
  business: ['business', 'entrepreneur', 'marketing', 'vente', 'commerce', 'startup', 'dropshipping', 'freelance', 'e-commerce', 'management', 'copywriting', 'branding', 'seo', 'community', 'stratégie', 'strategy'],
  education: ['formation', 'course', 'cours', 'excel', 'python', 'wordpress', 'design', 'ui/ux', 'data', 'montage', 'vidéo', 'video', 'photo', 'langue', 'language', 'coding', 'programme', 'gestion de projet'],
  motivation: ['motivation', 'développement personnel', 'personal development', 'coaching', 'mindset', 'succès', 'success', 'inspirant', 'inspiring', 'confiance', 'confidence', 'habitudes', 'habits', 'leadership'],
  finance: ['finance', 'investissement', 'investment', 'argent', 'money', 'budget', 'épargne', 'savings', 'crypto', 'bourse', 'stock', 'patrimoine', 'wealth', 'revenus', 'income'],
  family: ['famille', 'family', 'mariage', 'marriage', 'enfant', 'children', 'parent', 'éducation des enfants', 'child', 'couple', 'foyer', 'home', 'maman', 'mom', 'papa', 'dad', 'cuisine', 'cook'],
};

export function categorizeProduct(title: string, description?: string | null): ProductCategory {
  const text = `${title} ${description || ''}`.toLowerCase();
  // Check categories in priority order (spirituality first to avoid misclassification)
  const priorityOrder: ProductCategory[] = ['spirituality', 'finance', 'family', 'education', 'motivation', 'business'];
  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    if (keywords && keywords.some(kw => text.includes(kw))) {
      return cat;
    }
  }
  return 'other';
}

interface CategoryFilterProps {
  selected: ProductCategory;
  onChange: (cat: ProductCategory) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
            selected === cat.key
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
          )}
        >
          <cat.icon className="h-3.5 w-3.5" />
          {isFr ? cat.labelFr : cat.labelEn}
        </button>
      ))}
    </div>
  );
}
