import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Users, Building2, CreditCard, Heart, ShoppingBag, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SuperadminExports() {
  const { toast } = useToast();

  const exportOrgs = async () => {
    const { data } = await db.from('organizations').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('organizations',
      ['ID', 'Nom', 'Slug', 'Catégorie', 'Pays', 'Plan', 'KYC', 'Actif', 'Suspendu', 'Monétisation', 'Créé le'],
      data.map((o: any) => [o.id, o.name, o.slug, o.category, o.country, o.plan_type, o.kyc_status, o.is_active, o.is_suspended, o.monetization_enabled, o.created_at])
    );
    toast({ title: 'Export organisations téléchargé ✅' });
  };

  const exportUsers = async () => {
    const { data } = await db.from('profiles').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('users',
      ['ID', 'Nom', 'Pays', 'Téléphone', 'Bio', 'Code parrainage', 'Créé le'],
      data.map((u: any) => [u.id, u.display_name, u.country, u.phone, u.bio, u.referral_code, u.created_at])
    );
    toast({ title: 'Export utilisateurs téléchargé ✅' });
  };

  const exportDonations = async () => {
    const { data } = await db.from('donations').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('donations',
      ['ID', 'Donateur', 'Email', 'Montant', 'Devise', 'Statut', 'Org ID', 'Référence', 'Commission plateforme', 'Commission affilié', 'Montant org', 'Créé le'],
      data.map((d: any) => [d.id, d.donor_name, d.donor_email, d.amount, d.currency, d.status, d.organization_id, d.paystack_reference, d.platform_fee, d.affiliate_commission, d.organization_amount, d.created_at])
    );
    toast({ title: 'Export donations téléchargé ✅' });
  };

  const exportPurchases = async () => {
    const { data } = await db.from('product_purchases').select('*').order('created_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('purchases',
      ['ID', 'User ID', 'Produit ID', 'Montant', 'Devise', 'Statut', 'Org ID', 'Référence', 'Commission plateforme', 'Commission affilié', 'Montant org', 'Créé le'],
      data.map((p: any) => [p.id, p.user_id, p.product_id, p.amount, p.currency, p.status, p.organization_id, p.paystack_reference, p.platform_fee, p.affiliate_commission, p.organization_amount, p.created_at])
    );
    toast({ title: 'Export achats téléchargé ✅' });
  };

  const exportKYC = async () => {
    const { data } = await db.from('kyc_submissions').select('*').order('submitted_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('kyc',
      ['ID', 'Org ID', 'Statut', 'Niveau', 'Banque', 'Nom compte', 'Numéro compte', 'Soumis par', 'Soumis le', 'Reviewé le'],
      data.map((k: any) => [k.id, k.organization_id, k.status, k.kyc_level, k.bank_name, k.bank_account_name, k.bank_account_number, k.submitted_by, k.submitted_at, k.reviewed_at])
    );
    toast({ title: 'Export KYC téléchargé ✅' });
  };

  const exportPayouts = async () => {
    const { data } = await db.from('payout_requests').select('*').order('requested_at', { ascending: false });
    if (!data?.length) { toast({ title: 'Aucune donnée' }); return; }
    downloadCSV('payouts',
      ['ID', 'User ID', 'Org ID', 'Montant', 'Devise', 'Type', 'Statut', 'Demandé le', 'Traité le'],
      data.map((p: any) => [p.id, p.user_id, p.organization_id, p.amount, p.currency, p.payout_type, p.status, p.requested_at, p.processed_at])
    );
    toast({ title: 'Export payouts téléchargé ✅' });
  };

  const downloadStrategicDoc = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/${filename}`;
    a.download = filename;
    a.click();
    toast({ title: 'Document téléchargé ✅' });
  };

  const exports = [
    { label: 'Organisations', desc: 'Toutes les organisations avec statut, KYC, plan', icon: Building2, action: exportOrgs, color: 'text-blue-500' },
    { label: 'Utilisateurs', desc: 'Tous les profils utilisateurs', icon: Users, action: exportUsers, color: 'text-emerald-500' },
    { label: 'Donations', desc: 'Historique complet des dons', icon: Heart, action: exportDonations, color: 'text-rose-500' },
    { label: 'Achats produits', desc: 'Historique des ventes de produits', icon: ShoppingBag, action: exportPurchases, color: 'text-cyan-500' },
    { label: 'Soumissions KYC', desc: 'Toutes les demandes de vérification', icon: Shield, action: exportKYC, color: 'text-amber-500' },
    { label: 'Demandes de payout', desc: 'Historique des retraits', icon: CreditCard, action: exportPayouts, color: 'text-violet-500' },
  ];

  const strategicDocs = [
    { label: 'Playbook Marketing & Growth v2.0', desc: 'Positionnement, personas, objections, funnels, scripts, boucles virales — le guide complet 2026', filename: 'siteviral-growth-playbook-2026.md', color: 'text-orange-500' },
    { label: 'Stratégie de Contenu Exhaustive', desc: '52 personas, 140 articles, 90 pages, calendrier éditorial 16 semaines', filename: 'siteviral-content-strategy-exhaustive.md', color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Exports & Rapports</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Téléchargez les données de la plateforme au format CSV pour analyse externe.
      </p>

      <div className="space-y-3">
        {exports.map((exp, i) => (
          <motion.div key={exp.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0`}>
              <exp.icon className={`h-5 w-5 ${exp.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{exp.label}</p>
              <p className="text-xs text-muted-foreground">{exp.desc}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={exp.action}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-6">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Documents stratégiques</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Guides marketing et contenus stratégiques téléchargeables.
      </p>
      <div className="space-y-3">
        {strategicDocs.map((doc, i) => (
          <motion.div key={doc.filename} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <FileText className={`h-5 w-5 ${doc.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{doc.label}</p>
              <p className="text-xs text-muted-foreground">{doc.desc}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => downloadStrategicDoc(doc.filename)}>
              <Download className="h-3.5 w-3.5" /> Télécharger
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
