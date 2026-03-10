import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  BarChart3, ShoppingBag, Users, TrendingUp, Wallet, Building2,
  AlertTriangle, ArrowRight, Plus, Shield, Zap, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function CreatorDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { currentOrg, userOrgs, canManage } = useOrg();
  const { locale } = useI18n();

  const activeOrg = currentOrg || userOrgs[0];
  const primaryCurrency = activeOrg?.currency || DEFAULT_CURRENCY;
  const fmt = (n: number) => formatCurrency(n, primaryCurrency, locale);
  const canManageOrg = activeOrg ? canManage(activeOrg.id) : false;

  // Revenue data
  const { data: salesData } = useQuery({
    queryKey: ['creator-sales', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return { total: 0, month: 0, count: 0 };
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: allSales } = await db.from('product_purchases')
        .select('amount')
        .eq('organization_id', activeOrg.id)
        .eq('status', 'completed');
      
      const { data: monthSales } = await db.from('product_purchases')
        .select('amount')
        .eq('organization_id', activeOrg.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth);

      const { data: donations } = await db.from('donations')
        .select('amount')
        .eq('organization_id', activeOrg.id)
        .eq('status', 'completed');

      const totalProducts = (allSales || []).reduce((s, r) => s + (r.amount || 0), 0);
      const totalDonations = (donations || []).reduce((s, r) => s + (r.amount || 0), 0);
      const monthTotal = (monthSales || []).reduce((s, r) => s + (r.amount || 0), 0);

      return {
        total: totalProducts + totalDonations,
        month: monthTotal,
        count: (allSales || []).length,
      };
    },
    enabled: !!activeOrg,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ['creator-product-count', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return 0;
      const { count } = await db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', activeOrg.id);
      return count || 0;
    },
    enabled: !!activeOrg,
  });

  const { data: ambassadorCount = 0 } = useQuery({
    queryKey: ['creator-ambassador-count', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return 0;
      const { count } = await db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('organization_id', activeOrg.id);
      return count || 0;
    },
    enabled: !!activeOrg,
  });

  const kycStatus = activeOrg?.kyc_status || 'none';

  const nextActions = [];
  if (!activeOrg) {
    nextActions.push({ label: 'Crée ton centre digital', desc: 'Lance ta plateforme en 10 minutes', icon: Building2, action: () => navigate('/create-org'), color: 'text-primary' });
  } else {
    if (productCount === 0) nextActions.push({ label: 'Crée ton premier produit', desc: 'eBook, PDF, vidéo, cours…', icon: Plus, action: () => navigate('/admin/products/new'), color: 'text-primary' });
    if (ambassadorCount === 0) nextActions.push({ label: 'Active ton programme ambassadeur', desc: 'Laisse d\'autres vendre pour toi', icon: Users, action: () => navigate('/admin/affiliation'), color: 'text-amber-500' });
    if (kycStatus === 'none') nextActions.push({ label: 'Vérifie ton identité pour retirer', desc: 'Vérification requise pour les retraits', icon: Shield, action: () => navigate('/admin/kyc'), color: 'text-destructive' });
  }

  const monthGoal = 100000;
  const monthProgress = salesData?.month ? Math.min((salesData.month / monthGoal) * 100, 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = profile?.display_name?.split(' ')[0] || 'Créateur';

  // No org → CTA to create
  if (!activeOrg) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
          <SEOHead title="Espace Créateur — Siteviral" noindex />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{greeting}, {displayName}</h1>
              <p className="text-xs text-primary font-semibold">Espace Créateur</p>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/20 rounded-2xl p-8 text-center"
          >
            <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Crée ton centre digital</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Vends tes produits, collecte des dons, et active tes ambassadeurs. En 10 minutes.
            </p>
            <Button size="lg" onClick={() => navigate('/create-org')} className="gap-2">
              <Building2 className="h-4 w-4" /> Commencer maintenant
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container max-w-3xl px-4 py-5 sm:py-6 space-y-5">
        <SEOHead title="Espace Créateur — Siteviral" noindex />

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden">
            {activeOrg.logo_url ? (
              <img src={activeOrg.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold">{greeting}, {displayName}</h1>
            <p className="text-xs text-primary font-semibold">Espace Créateur · {activeOrg.name}</p>
          </div>
        </motion.div>

        {/* ═══ VÉRIFICATION BANNER — EN HAUT (urgent) ═══ */}
        {kycStatus === 'none' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">Paiements acceptés immédiatement. Vérification d'identité requise pour retirer vos fonds.</p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => navigate('/admin/kyc')} className="h-7 text-xs shrink-0">Vérifier</Button>
          </motion.div>
        )}

        {/* ═══ REVENUS ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-primary/20 rounded-2xl p-5"
        >
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-primary" /> Revenus
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-primary">{fmt(salesData?.month || 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ce mois</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-foreground">{fmt(salesData?.total || 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Objectif mensuel</span>
              <span className="text-xs font-semibold">{Math.round(monthProgress)}%</span>
            </div>
            <Progress value={monthProgress} className="h-2" />
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4 text-xs gap-1" onClick={() => navigate('/admin/sales')}>
            <BarChart3 className="h-3.5 w-3.5" /> Voir les détails
          </Button>
        </motion.div>

        {/* ═══ PERFORMANCE ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Produits', value: productCount, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Ventes', value: salesData?.count || 0, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Ambassadeurs', value: ambassadorCount, icon: Users, color: 'text-amber-500' },
            { label: 'Vérification', value: (kycStatus === 'level1' || kycStatus === 'level2') ? '✓' : '⏳', icon: Shield, color: (kycStatus === 'level1' || kycStatus === 'level2') ? 'text-emerald-500' : 'text-amber-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <stat.icon className={cn('h-5 w-5 mx-auto mb-2', stat.color)} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ═══ PROCHAINES ACTIONS ═══ */}
        {nextActions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-500" /> Prochaine action recommandée
            </h2>
            <div className="space-y-2">
              {nextActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-muted/20 hover:bg-muted/40 transition-all text-left group"
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted', action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ ACCÈS RAPIDE ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/admin')}>
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Vue d'ensemble</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/admin/products')}>
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs">Mes produits</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
