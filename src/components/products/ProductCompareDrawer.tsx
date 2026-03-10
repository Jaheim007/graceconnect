import { createContext, useContext, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency';
import { ShoppingBag, X, GitCompareArrows, Star, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface CompareProduct {
  id: string;
  title: string;
  price: number;
  is_free: boolean;
  currency?: string;
  cover_image_url?: string | null;
  product_type?: string;
  sales_count?: number;
  average_rating?: number;
  page_count?: number;
  organization_name?: string;
  organization_slug?: string;
  slug?: string;
}

interface CompareContextType {
  items: CompareProduct[];
  addItem: (p: CompareProduct) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
  openDrawer: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

const NOOP_COMPARE: CompareContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearAll: () => {},
  isInCompare: () => false,
  openDrawer: () => {},
};

export function useCompare() {
  const ctx = useContext(CompareContext);
  return ctx ?? NOOP_COMPARE;
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addItem = (p: CompareProduct) => {
    setItems(prev => {
      if (prev.length >= 3 || prev.some(x => x.id === p.id)) return prev;
      return [...prev, p];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(x => x.id !== id));
  const clearAll = () => setItems([]);
  const isInCompare = (id: string) => items.some(x => x.id === id);
  const openDrawer = () => setDrawerOpen(true);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, isInCompare, openDrawer }}>
      {children}

      {/* Floating compare badge */}
      {items.length > 0 && !drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-20 right-4 z-40 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:scale-105 transition-transform md:bottom-6"
        >
          <GitCompareArrows className="h-4 w-4" />
          <span className="text-sm font-semibold">Comparer ({items.length})</span>
        </button>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4" />
              Comparaison ({items.length}/3)
            </SheetTitle>
          </SheetHeader>
          <CompareTable items={items} onRemove={removeItem} onClear={clearAll} />
        </SheetContent>
      </Sheet>
    </CompareContext.Provider>
  );
}

function CompareTable({ items, onRemove, onClear }: { items: CompareProduct[]; onRemove: (id: string) => void; onClear: () => void }) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {isFr ? 'Ajoutez des produits à comparer depuis la page Découvrir.' : 'Add products to compare from the Discover page.'}
      </div>
    );
  }

  const rows: { label: string; icon: React.ReactNode; render: (p: CompareProduct) => React.ReactNode }[] = [
    {
      label: isFr ? 'Prix' : 'Price',
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      render: (p) => (
        <span className={cn('font-bold', p.is_free ? 'text-emerald-500' : 'text-primary')}>
          {formatPrice(p.price, p.is_free, p.currency)}
        </span>
      ),
    },
    {
      label: 'Type',
      icon: <FileText className="h-3.5 w-3.5" />,
      render: (p) => <Badge variant="secondary" className="text-[10px] capitalize">{p.product_type || '—'}</Badge>,
    },
    {
      label: isFr ? 'Ventes' : 'Sales',
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      render: (p) => <span className="text-sm">{p.sales_count || 0}+</span>,
    },
    {
      label: 'Rating',
      icon: <Star className="h-3.5 w-3.5" />,
      render: (p) => (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-sm">{(p.average_rating || 0).toFixed(1)}</span>
        </div>
      ),
    },
    {
      label: 'Pages',
      icon: <FileText className="h-3.5 w-3.5" />,
      render: (p) => <span className="text-sm">{p.page_count || '—'}</span>,
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Product headers */}
      <div className={cn('grid gap-3', items.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {items.map(p => (
          <div key={p.id} className="relative group text-center space-y-2">
            <button
              onClick={() => onRemove(p.id)}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted/30 mx-auto max-w-[120px]">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/20" /></div>
              )}
            </div>
            <p className="text-xs font-semibold line-clamp-2 leading-tight">{p.title}</p>
            <p className="text-[10px] text-muted-foreground">{p.organization_name}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-7 w-full"
              onClick={() => {
                const path = p.slug
                  ? `/org/${p.organization_slug}/p/${p.slug}`
                  : `/org/${p.organization_slug}/product/${p.id}`;
                navigate(path);
              }}
            >
              {isFr ? 'Voir' : 'View'}
            </Button>
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="border rounded-xl overflow-hidden divide-y divide-border">
        {rows.map((row, i) => (
          <div key={i} className={cn('grid items-center', items.length === 2 ? 'grid-cols-[100px_1fr_1fr]' : 'grid-cols-[100px_1fr_1fr_1fr]')}>
            <div className="px-3 py-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
              {row.icon} {row.label}
            </div>
            {items.map(p => (
              <div key={p.id} className="px-3 py-2.5 text-center">
                {row.render(p)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onClear}>
        {isFr ? 'Vider la comparaison' : 'Clear comparison'}
      </Button>
    </div>
  );
}
