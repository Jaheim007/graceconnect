import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, ExternalLink, AlertTriangle, ChevronRight,
  TrendingUp, DollarSign, Percent, ArrowUpRight, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OrgActivationChecklist } from '@/components/admin/OrgActivationChecklist';
import { QuickStartWizard } from '@/components/onboarding/QuickStartWizard';

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminDashboard() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const [showQuickStart, setShowQuickStart] = useState(false);
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: announcements = [] } = useOrgAnnouncements(currentOrg?.id, false);
  const { data: events = [] } = useOrgEvents(currentOrg?.id, false);
  const { data: campaigns = [] } = useOrgCampaigns(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  const { data: donationTxns = [] } = useQuery({
    queryKey: ['admin-donations-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('donations').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: purchaseTxns = [] } = useQuery({
    queryKey: ['admin-purchases-rev', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('product_purchases').select('amount, organization_amount, affiliate_commission, platform_fee').eq('organization_id', currentOrg.id).eq('status', 'completed');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  // Top products
  const { data: topProducts = [] } = useQuery({
    queryKey: ['admin-top-products', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('digital_products').select('id, title, sales_count, price, currency')
        .eq('organization_id', currentOrg.id).eq('is_published', true)
        .order('sales_count', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const allTxns = [...donationTxns, ...purchaseTxns];
  const totalRevenue = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOrgReceived = allTxns.reduce((s, t) => s + (t.organization_amount || 0), 0);
  const totalAffiliateCommission = allTxns.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
  const totalPlatformFee = allTxns.reduce((s, t) => s + (t.platform_fee || 0), 0);
  const commissionRate = currentOrg?.affiliation_commission_percent ?? 10;
  const conversionRate = allTxns.length > 0 ? ((allTxns.length / Math.max(members.length, 1)) * 100).toFixed(1) : '0';

  const stats = [
    { label: 'Médias', value: media.length, published: media.filter(m => m.is_published).length, icon: Play, to: '/admin/media', colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Annonces', value: announcements.length, published: announcements.filter(a => a.is_published).length, icon: Megaphone, to: '/admin/announcements', colorClass: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Événements', value: events.length, published: events.filter(e => e.is_published).length, icon: CalendarDays, to: '/admin/events', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Membres', value: members.length, published: members.length, icon: Users, to: '/admin/members', colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label: 'Campagnes', value: campaigns.length, published: campaigns.filter(c => c.is_published).length, icon: Heart, to: '/admin/campaigns', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { label: 'Produits', value: products.length, published: products.filter(p => p.is_published).length, icon: ShoppingBag, to: '/admin/products', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  const quickActions = [
    { label: 'Nouveau Média', to: '/admin/media/new', icon: Play },
    { label: 'Nouvelle Annonce', to: '/admin/announcements/new', icon: Megaphone },
    { label: 'Nouvel Événement', to: '/admin/events/new', icon: CalendarDays },
    { label: 'Nouvelle Campagne', to: '/admin/campaigns/new', icon: Heart },
    { label: 'Nouveau Produit', to: '/admin/products/new', icon: ShoppingBag },
    { label: 'Gérer Membres', to: '/admin/members', icon: Users },
  ];

  const revenueCards = [
    { label: 'Ventes totales', value: fmt(totalRevenue), sub: `${allTxns.length} transaction${allTxns.length > 1 ? 's' : ''}`, icon: DollarSign, colorClass: 'from-primary/20 to-primary/5 border-primary/20' },
    { label: 'Reçu par l\'org', value: fmt(totalOrgReceived), sub: 'Après frais & commissions', icon: TrendingUp, colorClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' },
    { label: 'Commissions affiliés', value: fmt(totalAffiliateCommission), sub: `Taux : ${commissionRate}%`, icon: Percent, colorClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/20' },
    { label: 'Frais plateforme', value: fmt(totalPlatformFee), sub: `${currentOrg?.platform_fee_percent ?? 10}%`, icon: DollarSign, colorClass: 'from-muted to-muted/50 border-border' },
  ];

  return (
    <div className="space-y-6">
      <QuickStartWizard open={showQuickStart} onClose={() => setShowQuickStart(false)} />
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue d'ensemble de <span className="font-medium text-foreground">{currentOrg?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowQuickStart(true)} className="gap-1.5 text-xs h-9">
            <Rocket className="h-4 w-4" /> QuickStart
          </Button>
          <Button size="sm" asChild variant="outline" className="gap-1.5 text-xs h-9">
            <a href={`https://siteviral.com/org/${currentOrg?.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Page publique
            </a>
          </Button>
        </div>
      </div>

      {/* Activation checklist */}
      <OrgActivationChecklist />

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h2 className="font-semibold text-sm mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickActions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              onClick={() => navigate(a.to)}
              className="gap-2 text-xs h-10 justify-start hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <a.icon className="h-4 w-4 text-primary" />
              {a.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Revenue cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {revenueCards.map((card) => (
          <motion.div key={card.label} variants={fadeUp} className={cn('rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm', card.colorClass)}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <motion.button
            key={s.label}
            variants={fadeUp}
            onClick={() => navigate(s.to)}
            className="group bg-card border border-border rounded-2xl p-4 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border', s.colorClass)}>
                <s.icon className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-primary font-medium mt-1">{s.published} publié{s.published !== 1 ? 's' : ''}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Conversion rate + Top products */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-2">Taux de conversion</h2>
          <p className="text-3xl font-bold text-primary">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Membres → Acheteurs/Donateurs</p>
        </div>
        {topProducts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">Top Produits</h2>
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.title}</span>
                  <span className="text-primary font-semibold">{p.sales_count || 0} ventes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentOrg?.kyc_status === 'none' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Complétez votre vérification pour retirer vos fonds</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vous pouvez accepter les paiements dès maintenant. La vérification KYC est requise uniquement pour les retraits.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/kyc')} className="h-8 text-xs shrink-0">
            Vérifier mon compte
          </Button>
        </motion.div>
      )}
    </div>
  );
}
