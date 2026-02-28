import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Package, Plus, Trash2, Save, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';

export function BundleManager() {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-all-products-for-bundle', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('digital_products')
        .select('id, title, price, currency, is_bundle, is_published, cover_image_url')
        .eq('organization_id', currentOrg.id)
        .eq('is_bundle', false)
        .order('title');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['admin-bundles', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('digital_products')
        .select('id, title, price, currency, is_published, sales_count, cover_image_url')
        .eq('organization_id', currentOrg.id)
        .eq('is_bundle', true)
        .order('created_at', { ascending: false });

      if (!data?.length) return [];

      // Fetch bundle items
      const ids = data.map((b: any) => b.id);
      const { data: items } = await db.from('bundle_items')
        .select('bundle_product_id, included_product_id, digital_products(title)')
        .in('bundle_product_id', ids);

      const itemMap: Record<string, any[]> = {};
      (items || []).forEach((i: any) => {
        if (!itemMap[i.bundle_product_id]) itemMap[i.bundle_product_id] = [];
        itemMap[i.bundle_product_id].push(i.digital_products?.title || 'Produit');
      });

      return data.map((b: any) => ({ ...b, items: itemMap[b.id] || [] }));
    },
    enabled: !!currentOrg?.id,
  });

  const createBundle = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id || !bundleTitle.trim() || selectedProducts.length < 2) return;
      const price = parseFloat(bundlePrice) || 0;

      const { data: newProduct, error } = await db.from('digital_products').insert({
        organization_id: currentOrg.id,
        title: bundleTitle,
        price,
        currency: currentOrg.currency || 'XOF',
        is_bundle: true,
        is_published: false,
        product_type: 'bundle',
        created_by: (await db.auth.getUser()).data.user?.id,
      }).select('id').single();

      if (error) throw error;

      const bundleItems = selectedProducts.map((pid, i) => ({
        bundle_product_id: newProduct.id,
        included_product_id: pid,
        display_order: i,
      }));

      await db.from('bundle_items').insert(bundleItems);
    },
    onSuccess: () => {
      toast.success('Bundle créé !');
      setCreating(false);
      setBundleTitle('');
      setBundlePrice('');
      setSelectedProducts([]);
      qc.invalidateQueries({ queryKey: ['admin-bundles'] });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const deleteBundle = useMutation({
    mutationFn: async (bundleId: string) => {
      await db.from('bundle_items').delete().eq('bundle_product_id', bundleId);
      await db.from('digital_products').delete().eq('id', bundleId);
    },
    onSuccess: () => {
      toast.success('Bundle supprimé');
      qc.invalidateQueries({ queryKey: ['admin-bundles'] });
    },
  });

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectedTotal = products.filter(p => selectedProducts.includes(p.id)).reduce((s, p) => s + (p.price || 0), 0);
  const bundlePriceNum = parseFloat(bundlePrice) || 0;
  const discount = selectedTotal > 0 ? Math.round((1 - bundlePriceNum / selectedTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Package className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Bundles de Produits</h2>
            <p className="text-[10px] text-muted-foreground">{bundles.length} bundle{bundles.length > 1 ? 's' : ''} créé{bundles.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        {!creating && (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" /> Créer
          </Button>
        )}
      </div>

      {/* Existing bundles */}
      {bundles.length > 0 && !creating && (
        <div className="space-y-2 mb-4">
          {bundles.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Layers className="h-5 w-5 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{b.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {b.items.length} produits · {b.sales_count || 0} ventes
                </p>
              </div>
              <span className="text-xs font-semibold text-primary">{formatCurrency(b.price || 0, b.currency)}</span>
              <Badge variant="outline" className={`text-[10px] ${b.is_published ? 'border-emerald-400/40 text-emerald-400' : 'border-amber-400/40 text-amber-400'}`}>
                {b.is_published ? 'Publié' : 'Brouillon'}
              </Badge>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteBundle.mutate(b.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Creation form */}
      {creating && (
        <div className="space-y-3">
          <Input
            placeholder="Nom du bundle (ex: Pack Complet)"
            value={bundleTitle}
            onChange={e => setBundleTitle(e.target.value)}
            className="h-9"
          />
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Prix du bundle"
              type="number"
              value={bundlePrice}
              onChange={e => setBundlePrice(e.target.value)}
              className="h-9 w-40"
            />
            <span className="text-xs text-muted-foreground">{currentOrg?.currency || 'XOF'}</span>
            {discount > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                -{discount}% vs achat séparé
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">Sélectionnez au moins 2 produits :</p>
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <Checkbox
                  checked={selectedProducts.includes(p.id)}
                  onCheckedChange={() => toggleProduct(p.id)}
                />
                <span className="text-xs flex-1 truncate">{p.title}</span>
                <span className="text-[10px] text-muted-foreground">{formatCurrency(p.price || 0, p.currency)}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createBundle.mutate()}
              disabled={!bundleTitle.trim() || selectedProducts.length < 2 || createBundle.isPending}
              className="gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" /> Créer le bundle
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)} className="text-xs">
              Annuler
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
