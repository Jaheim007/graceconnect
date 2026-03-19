import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, CheckCircle2, AlertTriangle, Image, FileText,
  DollarSign, Tag, Loader2, ArrowRight, Info, Upload, PackageOpen,
} from 'lucide-react';

interface ChariowProduct {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  is_free: boolean;
  description?: string;
  pictures?: { thumbnail?: string; cover?: string };
  pricing?: {
    type: string;
    current_price?: { value: number; currency: string };
    price?: { value: number; currency: string };
  };
  category?: { value: string; label: string };
  sales_count?: number;
}

type Step = 'intro' | 'loading' | 'select' | 'importing' | 'done';

export function ChariowImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [products, setProducts] = useState<ChariowProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const isFr = locale === 'fr';

  const resetState = () => {
    setStep('intro');
    setProducts([]);
    setSelected(new Set());
    setImportedCount(0);
    setError(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const fetchProducts = async () => {
    setStep('loading');
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('chariow-import', {
        body: { action: 'list', per_page: 100 },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);
      const items = data?.data?.data || data?.data || [];
      if (items.length === 0) {
        setError(isFr ? 'Aucun produit trouvé sur votre boutique Chariow.' : 'No products found in your Chariow store.');
        setStep('intro');
        return;
      }
      setProducts(items);
      setSelected(new Set(items.map((p: ChariowProduct) => p.id)));
      setStep('select');
    } catch (err: any) {
      console.error('Chariow fetch error:', err);
      setError(err.message || 'Failed to fetch products');
      setStep('intro');
    }
  };

  const toggleProduct = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!currentOrg || selected.size === 0) return;
    setStep('importing');
    let count = 0;

    for (const product of products.filter(p => selected.has(p.id))) {
      try {
        const priceValue = product.pricing?.current_price?.value || product.pricing?.price?.value || 0;
        // Chariow prices are in major units (e.g. 99.00), our DB uses minor units (kobo/cents)
        const priceMinor = Math.round(priceValue * 100);

        // Use highest quality image: prefer cover, upgrade CDN quality params
        const rawImageUrl = product.pictures?.cover || product.pictures?.thumbnail || null;
        const coverUrl = rawImageUrl
          ? rawImageUrl.replace(/quality=[^,&]+/, 'quality=high').replace(/slow-connection=[^,&/]+/, '')
          : null;

        await db.from('digital_products').insert({
          organization_id: currentOrg.id,
          title: product.name,
          description: product.description || '',
          price: product.is_free ? 0 : priceMinor,
          is_free: product.is_free,
          cover_image_url: coverUrl,
          is_published: false, // Draft so user can add files
          product_type: mapProductType(product.type),
          currency: product.pricing?.current_price?.currency || product.pricing?.price?.currency || 'XOF',
        });
        count++;
      } catch (err) {
        console.error(`Failed to import ${product.name}:`, err);
      }
    }

    setImportedCount(count);
    qc.invalidateQueries({ queryKey: ['org-products'] });
    setStep('done');
  };

  const mapProductType = (chariowType: string): string => {
    switch (chariowType) {
      case 'course': return 'course';
      case 'download': return 'ebook';
      case 'license': return 'software';
      case 'bundle': return 'bundle';
      case 'service': return 'other';
      default: return 'ebook';
    }
  };

  const formatPrice = (p: ChariowProduct) => {
    if (p.is_free) return isFr ? 'Gratuit' : 'Free';
    const price = p.pricing?.current_price;
    if (!price) return '—';
    return `${price.currency} ${price.value.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <AnimatePresence mode="wait">
          {/* ═══ INTRO ═══ */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-primary" />
                  {isFr ? 'Importer depuis Chariow' : 'Import from Chariow'}
                </DialogTitle>
                <DialogDescription>
                  {isFr
                    ? 'Transférez vos produits Chariow vers votre boutique Siteviral.'
                    : 'Transfer your Chariow products to your Siteviral store.'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                {/* What gets imported */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {isFr ? 'Ce qui sera importé' : 'What gets imported'}
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    {[
                      { icon: FileText, text: isFr ? 'Titre et description du produit' : 'Product title & description' },
                      { icon: DollarSign, text: isFr ? 'Prix (prix actuel et prix original)' : 'Pricing (current & original price)' },
                      { icon: Image, text: isFr ? 'Image de couverture' : 'Cover image' },
                      { icon: Tag, text: isFr ? 'Type de produit et catégorie' : 'Product type & category' },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What doesn't get imported */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    {isFr ? 'Ce qui nécessite une action manuelle' : 'Requires manual action'}
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    {[
                      isFr ? 'Fichiers numériques (PDF, vidéos, ZIP) — à re-uploader' : 'Digital files (PDF, videos, ZIP) — must re-upload',
                      isFr ? 'Contenu des cours (chapitres, leçons)' : 'Course content (chapters, lessons)',
                      isFr ? 'Clés de licence' : 'License keys',
                      isFr ? 'Historique des ventes et clients' : 'Sales history & customers',
                    ].map(text => (
                      <li key={text} className="flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">
                    {isFr
                      ? 'Les produits importés seront créés en mode brouillon. Vous pourrez ajouter vos fichiers et publier ensuite.'
                      : 'Imported products will be created as drafts. You can add your files and publish afterwards.'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button onClick={fetchProducts} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {isFr ? 'Récupérer mes produits Chariow' : 'Fetch my Chariow products'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ LOADING ═══ */}
          {step === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isFr ? 'Connexion à Chariow…' : 'Connecting to Chariow…'}
              </p>
            </motion.div>
          )}

          {/* ═══ SELECT ═══ */}
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle>
                  {isFr ? `${products.length} produit(s) trouvé(s)` : `${products.length} product(s) found`}
                </DialogTitle>
                <DialogDescription>
                  {isFr ? 'Sélectionnez les produits à importer.' : 'Select which products to import.'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.id)))}
                  className="text-xs text-primary hover:underline"
                >
                  {selected.size === products.length
                    ? (isFr ? 'Tout désélectionner' : 'Deselect all')
                    : (isFr ? 'Tout sélectionner' : 'Select all')}
                </button>
                <span className="text-xs text-muted-foreground">
                  {selected.size} / {products.length}
                </span>
              </div>

              <ScrollArea className="mt-2 max-h-[40vh] pr-2">
                <div className="space-y-2">
                  {products.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-card cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleProduct(p.id)}
                      />
                      {p.pictures?.thumbnail && (
                        <img src={p.pictures.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="capitalize">{p.type}</span>
                          <span>·</span>
                          <span>{formatPrice(p)}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                  {isFr ? 'Retour' : 'Back'}
                </Button>
                <Button onClick={handleImport} disabled={selected.size === 0} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  {isFr ? `Importer ${selected.size} produit(s)` : `Import ${selected.size} product(s)`}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ IMPORTING ═══ */}
          {step === 'importing' && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isFr ? 'Import en cours…' : 'Importing products…'}
              </p>
            </motion.div>
          )}

          {/* ═══ DONE ═══ */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-4 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {isFr ? `${importedCount} produit(s) importé(s) !` : `${importedCount} product(s) imported!`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  {isFr
                    ? 'Vos produits sont en mode brouillon. Ajoutez vos fichiers numériques, puis publiez-les.'
                    : 'Your products are in draft mode. Add your digital files, then publish them.'}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
                  {isFr ? 'Fermer' : 'Close'}
                </Button>
                <Button onClick={() => { handleClose(false); window.location.href = '/admin/products'; }} className="flex-1 gap-2">
                  {isFr ? 'Voir mes produits' : 'View products'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
