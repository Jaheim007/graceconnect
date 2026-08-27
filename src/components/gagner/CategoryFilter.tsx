import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { BookOpen, Church, Briefcase, Heart, GraduationCap, DollarSign, Users, Zap } from 'lucide-react';

export type ProductCategory = 'all' | 'business' | 'spirituality' | 'education' | 'motivation' | 'finance' | 'family' | 'other';

const CATEGORIES: { key: ProductCategory; icon: React.ElementType; labelFr: string; labelEn: string }[] = [
  { key: 'all', icon: Zap, labelFr: 'Tout', labelEn: 'All' },
  { key: 'business', icon: Briefcase, labelFr: 'Business', labelEn: 'Business' },
  { key: 'spirituality', icon: Church, labelFr: 'Spiritualité', labelEn: 'Spirituality' },
  { key: 'education', icon: GraduationCap, labelFr: 'Éducation', labelEn: 'Education' },
  { key: 'motivation', icon: Heart, labelFr: 'Motivation', labelEn: 'Motivation' },
  { key: 'finance', icon: DollarSign, labelFr: 'Finances', labelEn: 'Finance' },
  { key: 'family', icon: Users, labelFr: 'Famille', labelEn: 'Family' },
];

/**
 * Uses word-boundary-aware matching to categorize products.
 * "IA" or "AI" topics won't accidentally match spirituality keywords.
 */
const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  spirituality: [
    /\bprière\b/i, /\bprayer\b/i, /\bbible\b/i, /\bspiritu/i, /\béglise\b/i, /\bchurch\b/i,
    /\bworship\b/i, /\bdieu\b/i, /\b(the\s)?god\b/i, /\bméditation\b/i, /\bmeditation\b/i,
    /\bchrétien/i, /\bchristian/i, /\bsermon\b/i, /\bprophét/i, /\bprophet/i,
    /\bfoi\b/i, /\bfaith\b/i, /\bpasteur\b/i, /\bpastor\b/i, /\bévêque\b/i, /\bbishop\b/i,
    /\bapôtre\b/i, /\bapostle\b/i, /\bonction\b/i, /\banointing\b/i, /\bsaint\b/i,
    /\bjésus\b/i, /\bjesus\b/i, /\bévangile\b/i, /\bgospel\b/i, /\blouange\b/i, /\bpraise\b/i,
    /\bintercession\b/i, /\bdélivrance\b/i, /\bdeliverance\b/i, /\bjeûne\b/i, /\bfasting\b/i,
    /\bmanteau\b/i, /\bthéologi/i, /\btheolog/i, /\bcatéch/i, /\breligi/i,
  ],
  business: [
    /\bbusiness\b/i, /\bentrepreneur/i, /\bmarketing\b/i, /\bvente\b/i, /\bcommerce\b/i,
    /\bstartup\b/i, /\bdropshipping\b/i, /\bfreelance\b/i, /\be-commerce\b/i, /\bmanagement\b/i,
    /\bcopywriting\b/i, /\bbranding\b/i, /\bseo\b/i, /\bstratégie\b/i, /\bstrategy\b/i,
    /\bia\b/i, /\bartifici/i, /\bintelligence artificielle/i, /\bmachine learning/i,
    /\bchatgpt\b/i, /\bautomatis/i, /\bautomation\b/i, /\bproductivit/i,
    /\bleadership\b/i, /\bnégoci/i, /\bnegoti/i, /\binfluence\b/i,
  ],
  education: [
    /\bformation\b/i, /\bcourse\b/i, /\bcours\b/i, /\bexcel\b/i, /\bpython\b/i,
    /\bwordpress\b/i, /\bdesign\b/i, /\bui\/ux\b/i, /\bdata\b/i, /\bmontage\b/i,
    /\bvidéo\b/i, /\bvideo\b/i, /\bphoto\b/i, /\blangue\b/i, /\blanguage\b/i,
    /\bcoding\b/i, /\bprogramm/i, /\bgestion de projet/i, /\btutori/i,
  ],
  motivation: [
    /\bmotivation\b/i, /\bdéveloppement personnel/i, /\bpersonal development/i,
    /\bcoaching\b/i, /\bmindset\b/i, /\bsuccès\b/i, /\bsuccess\b/i,
    /\binspirant/i, /\binspiring\b/i, /\bconfiance\b/i, /\bconfidence\b/i,
    /\bhabitudes\b/i, /\bhabits\b/i,
  ],
  finance: [
    /\bfinance\b/i, /\bfinanc/i, /\binvestissement\b/i, /\binvestment\b/i,
    /\bargent\b/i, /\bmoney\b/i, /\bbudget\b/i, /\bépargne\b/i, /\bsavings\b/i,
    /\bcrypto\b/i, /\bbourse\b/i, /\bstock\b/i, /\bpatrimoine\b/i, /\bwealth\b/i,
    /\brevenus\b/i, /\bincome\b/i, /\bimmobili/i, /\breal estate/i,
  ],
  family: [
    /\bfamille\b/i, /\bfamily\b/i, /\bmariage\b/i, /\bmarriage\b/i, /\benfant/i,
    /\bchildren\b/i, /\bparent/i, /\bcouple\b/i, /\bfoyer\b/i,
    /\bmaman\b/i, /\bmom\b/i, /\bpapa\b/i, /\bdad\b/i, /\bcuisine\b/i, /\bcook/i,
  ],
};

// Keywords that override spirituality categorization (e.g., "AI" books that mention "grâce")
const SECULAR_OVERRIDES = [
  /\bia\b/i, /\bartifici/i, /\bintelligence artificielle/i, /\bmachine learning/i,
  /\bchatgpt\b/i, /\bmarketing\b/i, /\bbusiness\b/i, /\bcompétences?\b/i,
  /\bentreprise/i, /\bgouvernement/i, /\btechnolog/i, /\bdigital\b/i,
];

export function categorizeProduct(title: string, description?: string | null): ProductCategory {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Check if the product is clearly secular/tech — if so, skip spirituality
  const isSecular = SECULAR_OVERRIDES.some(rx => rx.test(text));

  // Check categories in priority order
  const priorityOrder: ProductCategory[] = ['spirituality', 'finance', 'family', 'education', 'motivation', 'business'];

  for (const cat of priorityOrder) {
    // Skip spirituality for secular content
    if (cat === 'spirituality' && isSecular) continue;

    const patterns = CATEGORY_KEYWORDS[cat];
    if (patterns && patterns.some(rx => rx.test(text))) {
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
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
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
