import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Key, ExternalLink, Settings, Code2,
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
  const [apiKey, setApiKey] = useState('');
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
    setApiKey('');
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
    if (!apiKey.trim()) {
      setError(isFr ? 'Veuillez entrer votre clé API Chariow.' : 'Please enter your Chariow API key.');
      return;
    }
    setStep('loading');
    setError(null);
    try {
      let allItems: ChariowProduct[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const { data, error: fnErr } = await supabase.functions.invoke('chariow-import', {
          body: { action: 'list', per_page: 100, cursor, api_key: apiKey.trim() },
        });
        if (fnErr) throw new Error(fnErr.message);
        if (data?.error) throw new Error(data.error);
        const items = data?.data?.data || data?.data || [];
        allItems = [...allItems, ...items];
        cursor = data?.data?.next_cursor || data?.next_cursor;
        hasMore = !!cursor && items.length > 0;
      }

      if (allItems.length === 0) {
        setError(isFr ? 'Aucun produit trouvé sur votre boutique Chariow.' : 'No products found in your Chariow store.');
        setStep('intro');
        return;
      }
      setProducts(allItems);
      setSelected(new Set());
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
        const currency = product.pricing?.current_price?.currency || product.pricing?.price?.currency || 'XOF';
        const zeroDecimalCurrencies = ['XOF', 'XAF', 'GNF', 'KMF', 'BIF', 'CLP', 'DJF', 'JPY', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];
        const priceMinor = zeroDecimalCurrencies.includes(currency.toUpperCase())
          ? Math.round(priceValue)
          : Math.round(priceValue * 100);

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
          is_published: false,
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
                    ? 'Connectez votre boutique Chariow avec votre clé API pour transférer vos produits.'
                    : 'Connect your Chariow store with your API key to transfer your products.'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                {/* How to find API key */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary mb-2">
                    <Key className="h-4 w-4" />
                    {isFr ? 'Où trouver votre clé API ?' : 'Where to find your API key?'}
                  </h4>
                  <ol className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary shrink-0">1.</span>
                      <span>
                        {isFr
                          ? <>Connectez-vous à <a href="https://app.chariow.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Chariow <ExternalLink className="h-3 w-3" /></a> et allez dans <strong>Settings</strong> (Paramètres)</>
                          : <>Log in to <a href="https://app.chariow.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Chariow <ExternalLink className="h-3 w-3" /></a> and go to <strong>Settings</strong></>}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary shrink-0">2.</span>
                      <span className="flex items-center gap-1">
                        <Settings className="h-3 w-3 text-muted-foreground shrink-0" />
                        {isFr
                          ? <>Descendez jusqu'à la section <strong>Developer</strong></>
                          : <>Scroll down to the <strong>Developer</strong> section</>}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary shrink-0">3.</span>
                      <span className="flex items-center gap-1">
                        <Code2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        {isFr
                          ? <>Cliquez sur <strong>API Keys</strong>, puis <strong>Create API Key</strong></>
                          : <>Click <strong>API Keys</strong>, then <strong>Create API Key</strong></>}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary shrink-0">4.</span>
                      <span>
                        {isFr
                          ? <>Donnez un nom (ex: <code className="bg-muted px-1 rounded text-[10px]">SiteViral</code>) et copiez la clé</>
                          : <>Give it a name (e.g. <code className="bg-muted px-1 rounded text-[10px]">SiteViral</code>) and copy the key</>}
                      </span>
                    </li>
                  </ol>
                </div>

                {/* API Key input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isFr ? 'Votre clé API Chariow' : 'Your Chariow API key'}
                  </label>
                  <Input
                    type="password"
                    placeholder={isFr ? 'Collez votre clé API ici…' : 'Paste your API key here…'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

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
                      ? 'Votre clé API n\'est pas stockée sur nos serveurs. Elle est utilisée uniquement pour cette session d\'importation.'
                      : 'Your API key is not stored on our servers. It is only used for this import session.'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button onClick={fetchProducts} disabled={!apiKey.trim()} className="w-full gap-2">
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

              <ScrollArea className="mt-2 h-[40vh] pr-2">
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
              className="flex flex-col items-center justify-center py-6 gap-4 text-center"
            >
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
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

              {/* Guide: How to get your files from Chariow */}
              <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                  <Download className="h-4 w-4" />
                  {isFr ? 'Comment récupérer vos fichiers depuis Chariow ?' : 'How to get your files from Chariow?'}
                </h4>
                <ol className="text-xs text-muted-foreground space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-px">1.</span>
                    <span>
                      {isFr
                        ? <>Connectez-vous à <a href="https://app.chariow.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Chariow <ExternalLink className="h-3 w-3" /></a> et allez dans <strong className="text-foreground">Products</strong></>
                        : <>Log in to <a href="https://app.chariow.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Chariow <ExternalLink className="h-3 w-3" /></a> and go to <strong className="text-foreground">Products</strong></>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-px">2.</span>
                    <span>
                      {isFr
                        ? <>Cliquez sur le produit souhaité, puis sur <strong className="text-foreground">Edit</strong> (le bouton <code className="bg-muted px-1 rounded text-[10px]">⋮</code> → Edit)</>
                        : <>Click on the product, then <strong className="text-foreground">Edit</strong> (via the <code className="bg-muted px-1 rounded text-[10px]">⋮</code> menu → Edit)</>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-px">3.</span>
                    <span>
                      {isFr
                        ? <>Dans le menu latéral, cliquez sur <strong className="text-foreground">Files</strong></>
                        : <>In the sidebar, click <strong className="text-foreground">Files</strong></>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-px">4.</span>
                    <span>
                      {isFr
                        ? <>Sous <strong className="text-foreground">Digital Files</strong>, cliquez sur <code className="bg-muted px-1 rounded text-[10px]">⋮</code> → <strong className="text-foreground">Download</strong> pour télécharger le fichier</>
                        : <>Under <strong className="text-foreground">Digital Files</strong>, click <code className="bg-muted px-1 rounded text-[10px]">⋮</code> → <strong className="text-foreground">Download</strong> to save the file</>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-px">5.</span>
                    <span>
                      {isFr
                        ? <>Revenez ici, éditez votre produit et <strong className="text-foreground">uploadez le fichier</strong> téléchargé</>
                        : <>Come back here, edit your product and <strong className="text-foreground">upload the downloaded file</strong></>}
                    </span>
                  </li>
                </ol>
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
