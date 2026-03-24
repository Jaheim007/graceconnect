import { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Download, FileText, Users, Building2, CreditCard, Heart,
  ShoppingBag, Shield, Loader2, Sparkles, TrendingUp, UserCheck,
  BarChart3, Zap, Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── CSV Helper ──────────────────────────────────────────
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Types ───────────────────────────────────────────────
interface ExportItem {
  label: string;
  desc: string;
  icon: typeof FileText;
  action: () => Promise<void>;
  gradient: string;
  badge?: string;
}

// ── Component ───────────────────────────────────────────
export default function SuperadminExports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(null); }
  };

  // ═══════════════════════════════════════════════════════
  // BASIC EXPORTS
  // ═══════════════════════════════════════════════════════
  const exportOrgs = async () => {
    const { data } = await db.from('organizations').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('organizations',
      ['ID', 'Nom', 'Slug', 'Catégorie', 'Pays', 'Plan', 'KYC', 'Actif', 'Suspendu', 'Monétisation', 'Créé le'],
      data.map((o: any) => [o.id, o.name, o.slug, o.category, o.country, o.plan_type, o.kyc_status, o.is_active, o.is_suspended, o.monetization_enabled, o.created_at])
    );
    toast({ title: 'Export organisations ✅' });
  };

  const exportUsers = async () => {
    const { data } = await db.from('profiles').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('users',
      ['ID', 'Nom', 'Pays', 'Téléphone', 'Bio', 'Code parrainage', 'Créé le'],
      data.map((u: any) => [u.id, u.display_name, u.country, u.phone, u.bio, u.referral_code, u.created_at])
    );
    toast({ title: 'Export utilisateurs ✅' });
  };

  const exportDonations = async () => {
    const { data } = await db.from('donations').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('donations',
      ['ID', 'Donateur', 'Email', 'Montant', 'Devise', 'Statut', 'Passerelle', 'Org ID', 'Réf', 'Comm plateforme', 'Comm affilié', 'Montant org', 'Créé le'],
      data.map((d: any) => [d.id, d.donor_name, d.donor_email, d.amount, d.currency, d.status, d.gateway || 'N/A', d.organization_id, d.paystack_reference, d.platform_fee, d.affiliate_commission, d.organization_amount, d.created_at])
    );
    toast({ title: 'Export donations ✅' });
  };

  const exportPurchases = async () => {
    const { data } = await db.from('product_purchases').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('purchases',
      ['ID', 'User ID', 'Produit ID', 'Montant', 'Devise', 'Statut', 'Passerelle', 'Org ID', 'Réf', 'Comm plateforme', 'Comm affilié', 'Montant org', 'Créé le'],
      data.map((p: any) => [p.id, p.user_id, p.product_id, p.amount, p.currency, p.status, p.payment_gateway || 'N/A', p.organization_id, p.paystack_reference, p.platform_fee, p.affiliate_commission, p.organization_amount, p.created_at])
    );
    toast({ title: 'Export achats ✅' });
  };

  const exportKYC = async () => {
    const { data } = await db.from('kyc_submissions').select('*').order('submitted_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('kyc',
      ['ID', 'Org ID', 'Statut', 'Niveau', 'Banque', 'Nom compte', 'N° compte', 'Soumis par', 'Soumis le', 'Reviewé le'],
      data.map((k: any) => [k.id, k.organization_id, k.status, k.kyc_level, k.bank_name, k.bank_account_name, k.bank_account_number, k.submitted_by, k.submitted_at, k.reviewed_at])
    );
    toast({ title: 'Export KYC ✅' });
  };

  const exportPayouts = async () => {
    const { data } = await db.from('payout_requests').select('*').order('requested_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('payouts',
      ['ID', 'User ID', 'Org ID', 'Montant', 'Devise', 'Type', 'Statut', 'Demandé le', 'Traité le'],
      data.map((p: any) => [p.id, p.user_id, p.organization_id, p.amount, p.currency, p.payout_type, p.status, p.requested_at, p.processed_at])
    );
    toast({ title: 'Export payouts ✅' });
  };

  // ═══════════════════════════════════════════════════════
  // ADVANCED INTELLIGENCE REPORTS
  // ═══════════════════════════════════════════════════════

  /** Rapport 1: Mapping complet Créateur → Email → Orgs → Produits → Ventes → KYC */
  const exportCreatorMapping = async () => {
    toast({ title: '⏳ Génération du rapport créateurs...', description: 'Croisement des données en cours' });

    const [
      { data: members },
      { data: orgs },
      { data: products },
      { data: purchases },
      { data: kyc },
      { data: profiles },
    ] = await Promise.all([
      db.from('organization_members').select('user_id, organization_id, role').eq('role', 'owner'),
      db.from('organizations').select('id, name, slug, category, kyc_status, plan_type, created_at'),
      db.from('digital_products').select('id, title, price, currency, product_type, organization_id, sales_count, is_published, created_at'),
      db.from('product_purchases').select('product_id, amount, status, organization_id, payment_gateway').eq('status', 'completed'),
      db.from('kyc_submissions').select('organization_id, status, kyc_level, submitted_at'),
      db.from('profiles').select('id, display_name'),
    ]);

    if (!members?.length) { toast({ title: 'Aucun créateur trouvé' }); return; }

    // Index data
    const orgMap = new Map((orgs || []).map((o: any) => [o.id, o]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const productsByOrg = new Map<string, any[]>();
    (products || []).forEach((p: any) => {
      if (!productsByOrg.has(p.organization_id)) productsByOrg.set(p.organization_id, []);
      productsByOrg.get(p.organization_id)!.push(p);
    });
    const purchasesByProduct = new Map<string, { count: number; revenue: number; gateways: Set<string> }>();
    (purchases || []).forEach((p: any) => {
      const cur = purchasesByProduct.get(p.product_id) || { count: 0, revenue: 0, gateways: new Set<string>() };
      cur.count++;
      cur.revenue += p.amount || 0;
      if (p.payment_gateway) cur.gateways.add(p.payment_gateway);
      purchasesByProduct.set(p.product_id, cur);
    });
    const kycByOrg = new Map((kyc || []).map((k: any) => [k.organization_id, k]));

    const rows: string[][] = [];
    (members || []).forEach((m: any) => {
      const profile = profileMap.get(m.user_id);
      const org = orgMap.get(m.organization_id);
      if (!org) return;
      const orgProducts = productsByOrg.get(org.id) || [];
      const kycInfo = kycByOrg.get(org.id);

      if (orgProducts.length === 0) {
        rows.push([
          m.user_id,
          profile?.display_name || '',
          org.name,
          org.category || '',
          org.kyc_status || 'none',
          kycInfo?.status || 'non soumis',
          kycInfo?.kyc_level || '',
          org.plan_type || '',
          '(aucun produit)', '', '', '', '0', '0', '', org.created_at || '',
        ]);
      } else {
        orgProducts.forEach((prod: any) => {
          const stats = purchasesByProduct.get(prod.id) || { count: 0, revenue: 0, gateways: new Set<string>() };
          rows.push([
            m.user_id,
            profile?.display_name || '',
            org.name,
            org.category || '',
            org.kyc_status || 'none',
            kycInfo?.status || 'non soumis',
            kycInfo?.kyc_level || '',
            org.plan_type || '',
            prod.title,
            prod.product_type || '',
            prod.price?.toString() || '0',
            prod.currency || 'XOF',
            stats.count.toString(),
            stats.revenue.toString(),
            stats.gateways.size > 0 ? [...stats.gateways].join(' / ') : 'N/A',
            prod.created_at || '',
          ]);
        });
      }
    });

    downloadCSV('rapport-createurs-complet',
      ['User ID', 'Nom créateur', 'Organisation', 'Catégorie', 'KYC Org', 'KYC Soumission', 'Niveau KYC', 'Plan', 'Produit', 'Type produit', 'Prix', 'Devise', 'Nb achats réels', 'Revenu réel (FCFA)', 'Passerelle(s) paiement', 'Date création produit'],
      rows
    );
    toast({ title: `Rapport créateurs généré ✅`, description: `${rows.length} lignes exportées` });
  };

  /** Rapport 2: Créateurs KYC vérifiés avec détails produits */
  const exportKYCVerified = async () => {
    toast({ title: '⏳ Génération rapport KYC vérifiés...' });

    const [
      { data: kyc },
      { data: orgs },
      { data: members },
      { data: products },
      { data: purchases },
      { data: profiles },
    ] = await Promise.all([
      db.from('kyc_submissions').select('*').in('status', ['approved', 'pending']),
      db.from('organizations').select('id, name, category, kyc_status'),
      db.from('organization_members').select('user_id, organization_id, role').eq('role', 'owner'),
      db.from('digital_products').select('id, title, price, currency, organization_id, product_type'),
      db.from('product_purchases').select('product_id, amount, status, payment_gateway').eq('status', 'completed'),
      db.from('profiles').select('id, display_name'),
    ]);

    if (!kyc?.length) { toast({ title: 'Aucune soumission KYC trouvée' }); return; }

    const orgMap = new Map((orgs || []).map((o: any) => [o.id, o]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const ownerByOrg = new Map((members || []).map((m: any) => [m.organization_id, m.user_id]));
    const productsByOrg = new Map<string, any[]>();
    (products || []).forEach((p: any) => {
      if (!productsByOrg.has(p.organization_id)) productsByOrg.set(p.organization_id, []);
      productsByOrg.get(p.organization_id)!.push(p);
    });
    const purchasesByProduct = new Map<string, { count: number; revenue: number; gateways: Set<string> }>();
    (purchases || []).forEach((p: any) => {
      const cur = purchasesByProduct.get(p.product_id) || { count: 0, revenue: 0, gateways: new Set<string>() };
      cur.count++;
      cur.revenue += p.amount || 0;
      if (p.payment_gateway) cur.gateways.add(p.payment_gateway);
      purchasesByProduct.set(p.product_id, cur);
    });

    const rows: string[][] = [];
    (kyc || []).forEach((k: any) => {
      const org = orgMap.get(k.organization_id);
      const ownerId = ownerByOrg.get(k.organization_id);
      const profile = ownerId ? profileMap.get(ownerId) : null;
      const orgProducts = productsByOrg.get(k.organization_id) || [];

      if (orgProducts.length === 0) {
        rows.push([
          profile?.display_name || '',
          ownerId || '',
          org?.name || '',
          k.status,
          k.kyc_level || '',
          k.bank_name || '',
          k.bank_account_name || '',
          k.submitted_at || '',
          '(aucun produit)', '', '0', '0', 'N/A',
        ]);
      } else {
        orgProducts.forEach((prod: any) => {
          const stats = purchasesByProduct.get(prod.id) || { count: 0, revenue: 0, gateways: new Set<string>() };
          rows.push([
            profile?.display_name || '',
            ownerId || '',
            org?.name || '',
            k.status,
            k.kyc_level || '',
            k.bank_name || '',
            k.bank_account_name || '',
            k.submitted_at || '',
            prod.title,
            `${prod.price || 0} ${prod.currency || 'XOF'}`,
            stats.count.toString(),
            stats.revenue.toString(),
            stats.gateways.size > 0 ? [...stats.gateways].join(' / ') : 'N/A',
          ]);
        });
      }
    });

    downloadCSV('rapport-kyc-verifie',
      ['Créateur', 'User ID', 'Organisation', 'Statut KYC', 'Niveau', 'Banque', 'Titulaire compte', 'Date soumission', 'Produit', 'Prix', 'Nb achats', 'Revenu réel', 'Passerelle(s)'],
      rows
    );
    toast({ title: `Rapport KYC vérifiés ✅`, description: `${rows.length} lignes` });
  };

  /** Rapport 3: Revenue par organisation avec détail produits */
  const exportRevenueByOrg = async () => {
    toast({ title: '⏳ Génération rapport revenus...' });

    const [
      { data: orgs },
      { data: products },
      { data: purchases },
      { data: donations },
    ] = await Promise.all([
      db.from('organizations').select('id, name, category, kyc_status, plan_type'),
      db.from('digital_products').select('id, title, price, currency, organization_id, product_type, sales_count'),
      db.from('product_purchases').select('product_id, amount, organization_id, status, payment_gateway').eq('status', 'completed'),
      db.from('donations').select('amount, organization_id, status, gateway').eq('status', 'completed'),
    ]);

    const purchasesByOrg = new Map<string, number>();
    const purchaseCountByOrg = new Map<string, number>();
    const gatewaysByOrg = new Map<string, Set<string>>();
    (purchases || []).forEach((p: any) => {
      purchasesByOrg.set(p.organization_id, (purchasesByOrg.get(p.organization_id) || 0) + (p.amount || 0));
      purchaseCountByOrg.set(p.organization_id, (purchaseCountByOrg.get(p.organization_id) || 0) + 1);
      if (p.payment_gateway) {
        if (!gatewaysByOrg.has(p.organization_id)) gatewaysByOrg.set(p.organization_id, new Set());
        gatewaysByOrg.get(p.organization_id)!.add(p.payment_gateway);
      }
    });
    const donationsByOrg = new Map<string, number>();
    (donations || []).forEach((d: any) => {
      donationsByOrg.set(d.organization_id, (donationsByOrg.get(d.organization_id) || 0) + (d.amount || 0));
      if (d.gateway) {
        if (!gatewaysByOrg.has(d.organization_id)) gatewaysByOrg.set(d.organization_id, new Set());
        gatewaysByOrg.get(d.organization_id)!.add(d.gateway);
      }
    });
    const productsByOrg = new Map<string, number>();
    (products || []).forEach((p: any) => {
      productsByOrg.set(p.organization_id, (productsByOrg.get(p.organization_id) || 0) + 1);
    });

    const rows = (orgs || []).map((o: any) => {
      const sales = purchasesByOrg.get(o.id) || 0;
      const dons = donationsByOrg.get(o.id) || 0;
        const gw = gatewaysByOrg.get(o.id);
        return [
          o.name,
          o.category || '',
          o.kyc_status || 'none',
          o.plan_type || '',
          (productsByOrg.get(o.id) || 0).toString(),
          (purchaseCountByOrg.get(o.id) || 0).toString(),
          sales.toString(),
          dons.toString(),
          (sales + dons).toString(),
          gw && gw.size > 0 ? [...gw].join(' / ') : 'N/A',
        ];
      }).sort((a, b) => Number(b[8]) - Number(a[8]));

      downloadCSV('rapport-revenus-organisations',
        ['Organisation', 'Catégorie', 'KYC', 'Plan', 'Nb produits', 'Nb ventes', 'Revenu ventes (FCFA)', 'Revenu dons (FCFA)', 'Revenu total (FCFA)', 'Passerelle(s)'],
      rows
    );
    toast({ title: `Rapport revenus ✅`, description: `${rows.length} organisations` });
  };

  /** Rapport 4: Vue plateforme globale */
  const exportPlatformOverview = async () => {
    toast({ title: '⏳ Génération vue plateforme...' });

    const [
      { count: totalUsers },
      { count: totalOrgs },
      { count: totalProducts },
      { data: completedPurchases },
      { data: completedDonations },
      { count: kycSubmitted },
      { count: kycApproved },
      { count: payoutRequests },
      { count: affiliateLinks },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('organizations').select('*', { count: 'exact', head: true }),
      db.from('digital_products').select('*', { count: 'exact', head: true }),
      db.from('product_purchases').select('amount').eq('status', 'completed'),
      db.from('donations').select('amount').eq('status', 'completed'),
      db.from('kyc_submissions').select('*', { count: 'exact', head: true }),
      db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      db.from('payout_requests').select('*', { count: 'exact', head: true }),
      db.from('affiliate_links').select('*', { count: 'exact', head: true }),
    ]);

    // Credit purchases
    const { data: completedCredits } = await db.from('credit_purchases').select('price_amount').eq('status', 'completed');
    const totalCreditsRevenue = (completedCredits || []).reduce((s, c: any) => s + (c.price_amount || 0), 0);

    const totalSalesRevenue = (completedPurchases || []).reduce((s, p: any) => s + (p.amount || 0), 0);
    const totalDonationsRevenue = (completedDonations || []).reduce((s, d: any) => s + (d.amount || 0), 0);

    const rows = [
      ['Utilisateurs inscrits', (totalUsers || 0).toString()],
      ['Organisations créées', (totalOrgs || 0).toString()],
      ['Produits numériques', (totalProducts || 0).toString()],
      ['Ventes complétées', (completedPurchases || []).length.toString()],
      ['Revenu ventes (FCFA)', totalSalesRevenue.toString()],
      ['Dons complétés', (completedDonations || []).length.toString()],
      ['Revenu dons (FCFA)', totalDonationsRevenue.toString()],
      ['Achats crédits IA complétés', (completedCredits || []).length.toString()],
      ['Revenu crédits IA (FCFA)', totalCreditsRevenue.toString()],
      ['GMV total (FCFA)', (totalSalesRevenue + totalDonationsRevenue + totalCreditsRevenue).toString()],
      ['Soumissions KYC', (kycSubmitted || 0).toString()],
      ['KYC approuvés', (kycApproved || 0).toString()],
      ['Demandes de retrait', (payoutRequests || 0).toString()],
      ['Liens affiliés créés', (affiliateLinks || 0).toString()],
      ['Date du rapport', format(new Date(), 'dd/MM/yyyy HH:mm')],
    ];

    downloadCSV('rapport-plateforme-global',
      ['Métrique', 'Valeur'],
      rows
    );
    toast({ title: `Vue plateforme ✅` });
  };

  // ═══════════════════════════════════════════════════════
  // UI CONFIG
  // ═══════════════════════════════════════════════════════

  const advancedReports: ExportItem[] = [
    { label: 'Mapping Créateurs Complet', desc: 'Email → Orgs → Produits → Ventes réelles → Statut KYC — tout croisé', icon: Sparkles, action: exportCreatorMapping, gradient: 'from-amber-500/20 via-orange-500/10 to-red-500/20', badge: 'CEO' },
    { label: 'Créateurs KYC Vérifiés', desc: 'Seuls les créateurs ayant soumis leur KYC, avec produits et revenus', icon: UserCheck, action: exportKYCVerified, gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20', badge: 'COMPLIANCE' },
    { label: 'Revenus par Organisation', desc: 'Classement par revenu total (ventes + dons) avec nb produits et KYC', icon: TrendingUp, action: exportRevenueByOrg, gradient: 'from-violet-500/20 via-purple-500/10 to-pink-500/20', badge: 'FINANCE' },
    { label: 'Vue Plateforme Globale', desc: 'KPIs clés : users, orgs, GMV, KYC, payouts, affiliés — en 1 fichier', icon: Globe, action: exportPlatformOverview, gradient: 'from-blue-500/20 via-indigo-500/10 to-violet-500/20', badge: 'OVERVIEW' },
  ];

  const basicExports: ExportItem[] = [
    { label: 'Organisations', desc: 'Toutes les organisations avec statut, KYC, plan', icon: Building2, action: exportOrgs, gradient: 'from-blue-500/10 to-blue-500/5' },
    { label: 'Utilisateurs', desc: 'Tous les profils utilisateurs', icon: Users, action: exportUsers, gradient: 'from-emerald-500/10 to-emerald-500/5' },
    { label: 'Donations', desc: 'Historique complet des dons', icon: Heart, action: exportDonations, gradient: 'from-rose-500/10 to-rose-500/5' },
    { label: 'Achats produits', desc: 'Historique des ventes de produits', icon: ShoppingBag, action: exportPurchases, gradient: 'from-cyan-500/10 to-cyan-500/5' },
    { label: 'Soumissions KYC', desc: 'Toutes les demandes de vérification', icon: Shield, action: exportKYC, gradient: 'from-amber-500/10 to-amber-500/5' },
    { label: 'Demandes de payout', desc: 'Historique des retraits', icon: CreditCard, action: exportPayouts, gradient: 'from-violet-500/10 to-violet-500/5' },
  ];

  const downloadStrategicDoc = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/${filename}`;
    a.download = filename;
    a.click();
    toast({ title: 'Document téléchargé ✅' });
  };

  const strategicDocs = [
    { label: 'Playbook Marketing & Growth v2.0', desc: 'Positionnement, personas, funnels, scripts, boucles virales', filename: 'siteviral-growth-playbook-2026.md', gradient: 'from-orange-500/10 to-orange-500/5' },
    { label: 'Stratégie de Contenu Exhaustive', desc: '52 personas, 140 articles, calendrier éditorial 16 semaines', filename: 'siteviral-content-strategy-exhaustive.md', gradient: 'from-pink-500/10 to-pink-500/5' },
  ];

  const renderCard = (item: ExportItem, i: number, isAdvanced = false) => {
    const isLoading = loading === item.label;
    return (
      <motion.div
        key={item.label}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl border transition-all duration-300',
          isAdvanced
            ? 'border-primary/20 bg-gradient-to-br hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
            : 'border-border bg-card hover:bg-muted/30',
          item.gradient
        )}
      >
        {isAdvanced && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
        <div className="relative flex items-center gap-4 p-4">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
            isAdvanced ? 'bg-primary/10' : 'bg-muted/50'
          )}>
            <item.icon className={cn('h-5 w-5', isAdvanced ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-semibold truncate', isAdvanced && 'text-foreground')}>{item.label}</p>
              {item.badge && (
                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-primary/10 text-primary">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
          </div>
          <Button
            variant={isAdvanced ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1.5 text-xs shrink-0', isAdvanced && 'shadow-sm')}
            disabled={!!loading}
            onClick={() => run(item.label, item.action)}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            CSV
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Centre de Rapports</h1>
            <p className="text-xs text-muted-foreground">Rapports décisionnels & exports de données</p>
          </div>
        </div>
      </motion.div>

      {/* Advanced Reports Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Rapports Intelligence</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Données croisées multi-tables, prêtes pour le décisionnel CEO.
        </p>
        <div className="space-y-2">
          {advancedReports.map((item, i) => renderCard(item, i, true))}
        </div>
      </div>

      {/* Basic Exports */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Exports bruts</h2>
        </div>
        <div className="space-y-2">
          {basicExports.map((item, i) => renderCard(item, i))}
        </div>
      </div>

      {/* Strategic Docs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents stratégiques</h2>
        </div>
        <div className="space-y-2">
          {strategicDocs.map((doc, i) => (
            <motion.div
              key={doc.filename}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('flex items-center gap-4 p-4 rounded-2xl border border-border bg-gradient-to-br hover:bg-muted/30 transition-colors', doc.gradient)}
            >
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{doc.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{doc.desc}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => downloadStrategicDoc(doc.filename)}>
                <Download className="h-3.5 w-3.5" /> MD
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
