import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { AdminPageShell } from './AdminPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { Trash2, Plus, Copy, CheckCircle, Tag, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgProducts } from '@/hooks/useMonetization';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminPromoCodes() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [discountAmount, setDiscountAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [minAmount, setMinAmount] = useState('');
  const [firstPurchaseOnly, setFirstPurchaseOnly] = useState(false);

  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await db
        .from('promo_codes')
        .select('*, digital_products(title)')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error('Not authenticated');
      const trimmedCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (!trimmedCode || trimmedCode.length < 3) throw new Error('Code too short (min 3)');

      const payload: any = {
        organization_id: currentOrg.id,
        code: trimmedCode,
        discount_type: discountType,
        created_by: user.id,
      };

      if (discountType === 'percent') {
        const pct = parseFloat(discountPercent);
        if (isNaN(pct) || pct <= 0 || pct > 100) throw new Error('Invalid percentage (1-100)');
        payload.discount_percent = pct;
        payload.discount_amount = 0;
      } else {
        const amt = parseFloat(discountAmount);
        if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');
        payload.discount_amount = amt;
        payload.discount_percent = 0;
      }
      if (maxUses) payload.max_uses = parseInt(maxUses);
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
      if (selectedProductId !== 'all') payload.product_id = selectedProductId;
      if (minAmount) payload.min_amount = parseFloat(minAmount);
      payload.first_purchase_only = firstPurchaseOnly;
      if (selectedProductId !== 'all') payload.product_id = selectedProductId;

      const { error } = await db.from('promo_codes').insert(payload);
      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw new Error(locale === 'fr' ? 'Ce code existe déjà pour cette organisation' : 'This code already exists for this organization');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `✅ ${t('admin_promo.created')}` });
      setCode(''); setDiscountType('percent'); setDiscountPercent('10'); setDiscountAmount(''); setMaxUses(''); setExpiresAt(''); setSelectedProductId('all'); setMinAmount(''); setFirstPurchaseOnly(false);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from('promo_codes').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('admin_promo.deleted') });
      qc.invalidateQueries({ queryKey: ['admin-promo-codes', currentOrg?.id] });
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (c: string, id: string) => {
    navigator.clipboard.writeText(c);
    setCopiedId(id);
    toast({ title: t('admin_promo.copied') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminPageShell title={t('admin_promo.title')} backRoute="/admin/content">
      <div className="space-y-4">
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 space-y-1">
          <p className="font-semibold text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> {t('admin_promo.info_title')}</p>
          <p className="text-xs text-muted-foreground">{t('admin_promo.info_desc')}</p>
        </div>

        {!showForm ? (
          <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> {t('admin_promo.new')}
          </Button>
        ) : (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">{t('admin_promo.create')}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('admin_promo.code')}</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EX: BIENVENUE20" className="h-8 text-xs font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type de réduction</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percent' | 'fixed')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{discountType === 'percent' ? t('admin_promo.discount') : 'Montant de réduction'}</Label>
                {discountType === 'percent' ? (
                  <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} min="1" max="100" className="h-8 text-xs" placeholder="10" />
                ) : (
                  <Input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} min="1" className="h-8 text-xs" placeholder="1000" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('admin_promo.product_label')}</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('admin_promo.all_products')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin_promo.all_products')}</SelectItem>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('admin_promo.max_uses')}</Label>
                <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder={t('admin_promo.unlimited')} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">{t('admin_promo.expires')}</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Montant minimum d'achat</Label>
                <Input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="0 (aucun minimum)" className="h-8 text-xs" />
              </div>
              <div className="flex items-center gap-2 py-2">
                <Switch checked={firstPurchaseOnly} onCheckedChange={setFirstPurchaseOnly} />
                <Label className="text-xs">Premier achat uniquement</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => createCode.mutate()} disabled={createCode.isPending}>
                {createCode.isPending ? t('admin_promo.creating') : t('common.create')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{t('admin_promo.cancel')}</Button>
            </div>
          </motion.div>
        )}

        {isLoading ? <SkeletonRow count={3} /> : promoCodes.length === 0 ? (
          <EmptyState variant="generic" title={t('admin_promo.no_codes')} description={t('admin_promo.no_codes_desc')} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{promoCodes.length} {promoCodes.length > 1 ? t('admin_promo.count_plural') : t('admin_promo.count')}</h2>
            <div className="space-y-2">
              {(promoCodes as any[]).map((pc) => (
                <div key={pc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-mono">{pc.code}</p>
                      <button onClick={() => handleCopy(pc.code, pc.id)}>
                        {copiedId === pc.id ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pc.discount_type === 'fixed' ? `-${pc.discount_amount} fixe` : `-${pc.discount_percent}%`} · {pc.current_uses}{pc.max_uses ? `/${pc.max_uses}` : ''} {t('admin_promo.uses')}
                      {pc.expires_at && ` · ${t('admin_promo.expires_on')} ${new Date(pc.expires_at).toLocaleDateString(dateFmt)}`}
                    </p>
                    {pc.digital_products?.title && (
                      <p className="text-[10px] text-primary">🏷️ {pc.digital_products.title}</p>
                    )}
                    {pc.min_amount > 0 && <span className="text-[10px] text-muted-foreground"> · Min: {pc.min_amount}</span>}
                    {pc.first_purchase_only && <span className="text-[10px] text-amber-600"> · 1er achat</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={pc.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: pc.id, is_active: v })} />
                    <Badge variant="outline" className={cn('text-[10px] border-0', pc.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                      {pc.is_active ? t('admin_promo.active') : t('admin_promo.inactive')}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-60 group-hover:opacity-100" onClick={() => deleteCode.mutate(pc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
