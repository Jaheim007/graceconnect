import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgPlans, useCreatePlan, useUpdatePlan, useDeletePlan, useOrgSubscribers } from '@/hooks/useSubscriptions';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Users, CreditCard, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminSubscriptions() {
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const { locale } = useI18n();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';
  const fmt = (n: number) => formatCurrency(n, currency, locale);

  const { data: plans = [], isLoading } = useOrgPlans(orgId, false);
  const { data: subscribers = [] } = useOrgSubscribers(orgId);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: 0, interval: 'monthly' as string,
    features: '' as string, is_published: false,
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, interval: 'monthly', features: '', is_published: false });
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (plan: any) => {
    setEditing(plan.id);
    setCreating(false);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      interval: plan.interval,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      is_published: plan.is_published,
    });
  };

  const handleSave = async () => {
    if (!orgId || !form.name.trim()) return;
    const featuresArray = form.features.split('\n').map(f => f.trim()).filter(Boolean);
    const payload: any = {
      name: form.name,
      description: form.description || null,
      price: form.price,
      currency,
      interval: form.interval,
      features: featuresArray,
      is_published: form.is_published,
      organization_id: orgId,
    };

    try {
      if (editing) {
        await updatePlan.mutateAsync({ id: editing, updates: payload });
        toast({ title: locale === 'fr' ? 'Plan mis à jour' : 'Plan updated' });
      } else {
        await createPlan.mutateAsync(payload);
        toast({ title: locale === 'fr' ? 'Plan créé' : 'Plan created' });
      }
      resetForm();
    } catch (err: any) {
      toast({ title: locale === 'fr' ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      await deletePlan.mutateAsync({ id, orgId });
      toast({ title: locale === 'fr' ? 'Plan supprimé' : 'Plan deleted' });
    } catch (err: any) {
      toast({ title: locale === 'fr' ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const showForm = editing || creating;

  return (
    <AdminPageShell
      title={locale === 'fr' ? 'Abonnements' : 'Subscriptions'}
      subtitle={locale === 'fr' ? 'Gérez vos plans d\'abonnement et vos abonnés' : 'Manage subscription plans and subscribers'}
      backRoute="/admin"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Plans actifs' : 'Active plans'}</p>
            </div>
            <p className="text-xl font-bold">{plans.filter(p => p.is_active).length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">{locale === 'fr' ? 'Abonnés actifs' : 'Active subscribers'}</p>
            </div>
            <p className="text-xl font-bold">{subscribers.length}</p>
          </div>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{editing ? (locale === 'fr' ? 'Modifier le plan' : 'Edit plan') : (locale === 'fr' ? 'Nouveau plan' : 'New plan')}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'fr' ? 'Nom du plan' : 'Plan name'}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Premium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{locale === 'fr' ? 'Prix' : 'Price'} ({currency})</Label>
                  <Input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'fr' ? 'Fréquence' : 'Interval'}</Label>
                  <Select value={form.interval} onValueChange={v => setForm({ ...form, interval: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{locale === 'fr' ? 'Mensuel' : 'Monthly'}</SelectItem>
                      <SelectItem value="quarterly">{locale === 'fr' ? 'Trimestriel' : 'Quarterly'}</SelectItem>
                      <SelectItem value="yearly">{locale === 'fr' ? 'Annuel' : 'Yearly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{locale === 'fr' ? 'Description' : 'Description'}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'fr' ? 'Avantages (un par ligne)' : 'Features (one per line)'}</Label>
              <Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} rows={3} placeholder={locale === 'fr' ? 'Accès illimité\nSupport prioritaire\nContenu exclusif' : 'Unlimited access\nPriority support\nExclusive content'} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={v => setForm({ ...form, is_published: v })} />
              <Label className="text-xs">{locale === 'fr' ? 'Publié (visible par les membres)' : 'Published (visible to members)'}</Label>
            </div>
            <Button onClick={handleSave} disabled={!form.name.trim() || createPlan.isPending || updatePlan.isPending} className="gap-1.5">
              <Save className="h-4 w-4" /> {locale === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </motion.div>
        )}

        {/* Plans list */}
        {!showForm && (
          <Button onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> {locale === 'fr' ? 'Nouveau plan' : 'New plan'}
          </Button>
        )}

        {isLoading ? <SkeletonRow count={3} /> : plans.length === 0 && !showForm ? (
          <EmptyState variant="generic" title={locale === 'fr' ? 'Aucun plan d\'abonnement' : 'No subscription plans'} />
        ) : (
          <div className="space-y-2">
            {plans.map(plan => (
              <motion.div key={plan.id} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <Badge variant="outline" className={cn('text-[10px] border-0', plan.is_published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                      {plan.is_published ? (locale === 'fr' ? 'Publié' : 'Published') : (locale === 'fr' ? 'Brouillon' : 'Draft')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmt(plan.price)} / {plan.interval === 'monthly' ? (locale === 'fr' ? 'mois' : 'month') : plan.interval === 'quarterly' ? (locale === 'fr' ? 'trimestre' : 'quarter') : (locale === 'fr' ? 'an' : 'year')}
                    {plan.features && Array.isArray(plan.features) ? ` · ${plan.features.length} ${locale === 'fr' ? 'avantages' : 'features'}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Subscribers list */}
        {subscribers.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">{subscribers.length} {locale === 'fr' ? 'abonné(s) actif(s)' : 'active subscriber(s)'}</h2>
            <div className="space-y-2">
              {subscribers.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sub.subscription_plans?.name || 'Plan'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sub.current_period_end ? `${locale === 'fr' ? 'Expire' : 'Expires'}: ${new Date(sub.current_period_end).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">
                    {sub.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
