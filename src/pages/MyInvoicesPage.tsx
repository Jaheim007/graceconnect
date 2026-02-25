import { Receipt, Download, ArrowLeft, FileText, ShoppingBag, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { downloadInvoice } from '@/lib/invoice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MyInvoicesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ['my-invoices-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('product_purchases')
        .select('id, amount, currency, status, completed_at, created_at, paystack_reference, organization_id, product_id, digital_products!left(title), organizations!left(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: donations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ['my-invoices-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('donations')
        .select('id, amount, currency, status, completed_at, created_at, paystack_reference, organization_id, organizations!left(name), donation_campaigns!left(title)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = loadingPurchases || loadingDonations;

  const handleDownloadInvoice = (item: any, type: 'purchase' | 'donation') => {
    const orgName = (item as any).organizations?.name || 'Organisation';
    const productTitle = type === 'purchase'
      ? (item as any).digital_products?.title || 'Produit'
      : (item as any).donation_campaigns?.title || 'Don';

    downloadInvoice({
      invoiceNumber: `SV-${item.id.slice(0, 8).toUpperCase()}`,
      date: item.completed_at || item.created_at,
      buyerName: profile?.display_name || user?.email || 'Acheteur',
      buyerEmail: user?.email || '',
      productTitle,
      amount: item.amount,
      currency: item.currency || 'XOF',
      orgName,
      reference: item.paystack_reference || item.id,
    });
  };

  const renderRow = (item: any, type: 'purchase' | 'donation') => {
    const title = type === 'purchase'
      ? (item as any).digital_products?.title || 'Produit'
      : (item as any).donation_campaigns?.title || 'Don libre';
    const orgName = (item as any).organizations?.name || '';
    const date = new Date(item.completed_at || item.created_at);

    return (
      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-card transition-shadow">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          type === 'purchase' ? 'bg-primary/10' : 'bg-accent/10'
        )}>
          {type === 'purchase' ? <ShoppingBag className="h-4 w-4 text-primary" /> : <Heart className="h-4 w-4 text-accent" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">{orgName} — {date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{formatCurrency(item.amount, item.currency)}</p>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadInvoice(item, type)}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Mes factures — Siteviral" noindex />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Receipt className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm flex-1">Mes factures</span>
      </div>

      <div className="container max-w-2xl py-5 space-y-4">
        <p className="text-xs text-muted-foreground">Retrouvez toutes vos factures d'achats et de dons. Téléchargez-les en PDF.</p>

        {isLoading ? <SkeletonRow count={5} /> : (
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="purchases" className="flex-1 gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" /> Achats ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex-1 gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Dons ({donations.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="purchases" className="space-y-2 mt-3">
              {purchases.length === 0 ? (
                <EmptyState variant="generic" title="Aucun achat" description="Vos factures d'achats apparaîtront ici." />
              ) : purchases.map(p => renderRow(p, 'purchase'))}
            </TabsContent>
            <TabsContent value="donations" className="space-y-2 mt-3">
              {donations.length === 0 ? (
                <EmptyState variant="generic" title="Aucun don" description="Vos reçus de dons apparaîtront ici." />
              ) : donations.map(d => renderRow(d, 'donation'))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
