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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Users, CreditCard, X, Save, TrendingUp, Calendar, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

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

  const [tab, setTab] = useState('plans');
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

  // Revenue stats
  const activeSubscribers = subscribers.filter((s: any) => s.status === 'active');
  const mrr = activeSubscribers.reduce((sum: number, s: any) => {
    const plan = plans.find(p => p.id === s.plan_id);
    if (!plan) return sum;
    const monthlyPrice = plan.interval === 'yearly' ? plan.price / 12 : plan.interval === 'quarterly' ? plan.price / 3 : plan.price;
    return sum + monthlyPrice;
  }, 0);

  const churnedCount = subscribers.filter((s: any) => s.status === 'cancelled').length;
  const churnRate = subscribers.length > 0 ? Math.round((churnedCount / subscribers.length) * 100) : 0;

  const handleExportSubscribers = () => {
    if (subscribers.length === 0) return;
    downloadCSV(
      subscribers.map((s: any) => ({
        Plan: s.subscription_plans?.name || '—',
        Status: s.status,
        [locale === 'fr' ? 'Début période' : 'Period start']: s.current_period_start?.slice(0, 10) || '',
        [locale === 'fr' ? 'Fin période' : 'Period end']: s.current_period_end?.slice(0, 10) || '',
        [locale === 'fr' ? 'Inscrit le' : 'Subscribed on']: s.created_at?.slice(0, 10) || '',
      })),
      `subscribers-${currentOrg?.slug || 'org'}`
    );
    toast({ title: '📥 CSV exporté' });
  };

  return (
    <AdminPageShell
      title={locale === 'fr' ? 'Abonnements' : 'Subscriptions'}
      subtitle={locale === 'fr' ? 'Plans, abonnés et revenus récurrents' : 'Plans, subscribers and recurring revenue'}
      backRoute="/admin"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="plans" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Plans
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Abonnés' : 'Subscribers'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Métriques' : 'Metrics'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={CreditCard} label={locale === 'fr' ? 'Plans actifs' : 'Active plans'} value={plans.filter(p => p.is_active).length} />
            <StatCard icon={Users} label={locale === 'fr' ? 'Abonnés actifs' : 'Active subs'} value={activeSubscribers.length} />
            <StatCard icon={TrendingUp} label="MRR" value={fmt(mrr)} />
            <StatCard icon={Calendar} label={locale === 'fr' ? 'Taux de churn' : 'Churn rate'} value={`${churnRate}%`} />
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
                <Label>Description</Label>
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

          {!showForm && (
            <Button onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> {locale === 'fr' ? 'Nouveau plan' : 'New plan'}
            </Button>
          )}

          {isLoading ? <SkeletonRow count={3} /> : plans.length === 0 && !showForm ? (
            <EmptyState variant="generic" title={locale === 'fr' ? 'Aucun plan d\'abonnement' : 'No subscription plans'} />
          ) : (
            <div className="space-y-2">
              {plans.map(plan => {
                const subCount = subscribers.filter((s: any) => s.plan_id === plan.id && s.status === 'active').length;
                return (
                  <motion.div key={plan.id} variants={fadeUp} initial="hidden" animate="visible"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{plan.name}</p>
                        <Badge variant="outline" className={cn('text-[10px] border-0', plan.is_published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                          {plan.is_published ? (locale === 'fr' ? 'Publié' : 'Published') : (locale === 'fr' ? 'Brouillon' : 'Draft')}
                        </Badge>
                        {subCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{subCount} {locale === 'fr' ? 'abonné(s)' : 'sub(s)'}</Badge>
                        )}
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
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{subscribers.length} {locale === 'fr' ? 'abonné(s)' : 'subscriber(s)'}</p>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExportSubscribers} disabled={subscribers.length === 0}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>

          {subscribers.length === 0 ? (
            <EmptyState variant="generic" title={locale === 'fr' ? 'Aucun abonné' : 'No subscribers'} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {subscribers.map((sub: any) => (
                <motion.div key={sub.id} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sub.subscription_plans?.name || 'Plan'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sub.current_period_end ? `${locale === 'fr' ? 'Expire' : 'Expires'}: ${new Date(sub.current_period_end).toLocaleDateString()}` : ''}
                      {sub.cancelled_at ? ` · ${locale === 'fr' ? 'Annulé le' : 'Cancelled'} ${new Date(sub.cancelled_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] border-0',
                    sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                    sub.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {sub.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{fmt(mrr)}</p>
              <p className="text-xs text-muted-foreground mt-1">MRR ({locale === 'fr' ? 'Revenu mensuel récurrent' : 'Monthly Recurring Revenue'})</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{fmt(mrr * 12)}</p>
              <p className="text-xs text-muted-foreground mt-1">ARR ({locale === 'fr' ? 'Revenu annuel récurrent' : 'Annual Recurring Revenue'})</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-lg font-bold">{activeSubscribers.length}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Actifs' : 'Active'}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-lg font-bold">{churnedCount}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Annulés' : 'Churned'}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-lg font-bold">{churnRate}%</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? 'Taux de churn' : 'Churn rate'}</p>
            </div>
          </div>
          {/* Plan breakdown */}
          {plans.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm">{locale === 'fr' ? 'Répartition par plan' : 'Breakdown by plan'}</h3>
              {plans.map(plan => {
                const count = subscribers.filter((s: any) => s.plan_id === plan.id && s.status === 'active').length;
                const pct = activeSubscribers.length > 0 ? Math.round((count / activeSubscribers.length) * 100) : 0;
                return (
                  <div key={plan.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}