import { useMyPurchases } from '@/hooks/usePurchases';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, ExternalLink, ShoppingBag, FileText, Link2, Music, BookOpen, Eye,
  Package, Receipt, GraduationCap, Play, Zap, Heart,
} from 'lucide-react';
import { downloadInvoice } from '@/lib/invoice';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { fetchWatermarkedFile, isPdfLikeFile, openFileInline, triggerBrowserDownload, preOpenWindow } from '@/lib/secureDownload';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageTour } from '@/components/onboarding/PageTour';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { LessonPlayerOverlay } from '@/components/programs/LessonPlayerOverlay';
import { formatCurrency } from '@/lib/currency';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  ebook: <BookOpen className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

const TOUR_STEPS = [
  { titleKey: 'tour.purchases_1_title', descKey: 'tour.purchases_1_desc', icon: <ShoppingBag className="h-4 w-4" /> },
];

interface EnrolledProgram {
  id: string;
  program_id: string;
  created_at: string;
  program: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    organization_id: string;
    is_free: boolean | null;
    price: number | null;
  };
}

export default function ResourcesPage() {
  const { data: purchases, isLoading } = useMyPurchases();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  const isFr = locale === 'fr';

  // Fetch enrolled programs
  const { data: enrolledPrograms = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['my-enrolled-programs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('program_enrollments')
        .select('id, program_id, created_at, programs(id, title, description, cover_image_url, organization_id, is_free, price)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        program: row.programs,
      })) as EnrolledProgram[];
    },
    enabled: !!user,
  });

  // Fetch credit purchases
  const { data: creditPurchases = [], isLoading: loadingCredits } = useQuery({
    queryKey: ['my-credit-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('credit_purchases')
        .select('id, pack_key, credits_amount, price_amount, price_currency, payment_gateway, status, created_at, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user donations
  const { data: myDonations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ['my-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('donations')
        .select('id, amount, currency, status, created_at, completed_at, organization_id, donor_name, donation_campaigns(title), organizations(name, logo_url, slug)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch org names for grouping
  const purchaseOrgIds = purchases?.map(p => p.product.organization_id) || [];
  const programOrgIds = enrolledPrograms.map(e => e.program?.organization_id).filter(Boolean);
  const orgIds = [...new Set([...purchaseOrgIds, ...programOrgIds])];

  const { data: orgs } = useQuery({
    queryKey: ['purchase-orgs', orgIds.join(',')],
    queryFn: async () => {
      if (orgIds.length === 0) return [];
      const { data } = await db.from('organizations').select('id, name, slug, logo_url').in('id', orgIds);
      return (data || []) as { id: string; name: string; slug: string; logo_url: string | null }[];
    },
    enabled: orgIds.length > 0,
  });

  const orgMap = new Map((orgs || []).map(o => [o.id, o]));

  // Group purchases by org
  const grouped = new Map<string, { purchases: typeof purchases; programs: EnrolledProgram[] }>();

  purchases?.forEach(p => {
    const orgId = p.product.organization_id;
    if (!grouped.has(orgId)) grouped.set(orgId, { purchases: [], programs: [] });
    grouped.get(orgId)!.purchases!.push(p);
  });

  enrolledPrograms.forEach(e => {
    if (!e.program) return;
    const orgId = e.program.organization_id;
    if (!grouped.has(orgId)) grouped.set(orgId, { purchases: [], programs: [] });
    grouped.get(orgId)!.programs.push(e);
  });

  const totalItems = (purchases?.length || 0) + enrolledPrograms.length;

  const handleFileAction = async (purchase: (typeof purchases extends (infer T)[] | undefined ? T : never), mode: 'download' | 'inline') => {
    if (!purchase.product.file_url || !user) return;
    setDownloading(purchase.id);
    const preWindow = mode === 'inline' ? preOpenWindow() : null;

    try {
      const file = await fetchWatermarkedFile({
        fileUrl: purchase.product.file_url,
        productId: purchase.product_id,
        productTitle: purchase.product.title,
        inline: mode === 'inline',
      });

      if (mode === 'inline') {
        openFileInline(file, preWindow);
      } else {
        triggerBrowserDownload(file);
      }

      toast({
        title: mode === 'inline' ? t('page.purchases_opened') : t('page.purchases_download_started'),
        description: mode === 'inline' ? t('page.purchases_opened_desc') : t('page.purchases_download_desc'),
      });
    } catch (error) {
      console.error('[ResourcesPage] secure file action error:', error);
      if (preWindow && !preWindow.closed) preWindow.close();
      toast({
        title: t('common.error'),
        description: mode === 'inline'
          ? 'La lecture directe est disponible uniquement pour les PDF sécurisés.'
          : 'Impossible de télécharger le fichier sécurisé.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  if (activeCourseId) {
    return (
      <LessonPlayerOverlay
        programId={activeCourseId}
        onClose={() => setActiveCourseId(null)}
      />
    );
  }

  if (isLoading || loadingPrograms || loadingCredits || loadingDonations) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">{t('page.purchases')}</h1>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  const hasAnything = totalItems > 0 || creditPurchases.length > 0 || myDonations.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <SEOHead title="Mes ressources — Siteviral" description="Accédez à vos achats et téléchargez vos ressources numériques." noindex />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          {t('page.purchases')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('page.purchases_desc')}</p>
      </div>

      {/* Stats bar */}
      {hasAnything && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Produits acquis' : 'Products acquired'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{enrolledPrograms.length}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Cours inscrits' : 'Courses enrolled'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{creditPurchases.length}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Achats crédits' : 'Credit purchases'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-pink-500">{myDonations.length}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Dons effectués' : 'Donations made'}</p>
          </div>
        </div>
      )}

      <PageTour pageId="purchases" steps={TOUR_STEPS} />

      {!hasAnything ? (
        <EmptyState variant="purchases" title={t('page.purchases_empty')} description={t('page.purchases_empty_desc')} />
      ) : (
        <div className="space-y-6">
          {/* ─── Credit Purchases ─── */}
          {creditPurchases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{isFr ? 'Crédits IA achetés' : 'AI Credits Purchased'}</p>
                  <p className="text-[10px] text-muted-foreground">{creditPurchases.length} {isFr ? 'achat(s)' : 'purchase(s)'}</p>
                </div>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-amber-500/20">
                {creditPurchases.map((cp: any) => (
                  <div key={cp.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{cp.credits_amount} {isFr ? 'crédits' : 'credits'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Zap className="h-2.5 w-2.5" /> {cp.pack_key}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {cp.payment_gateway === 'stripe' ? 'Stripe' : 'Paystack'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(cp.completed_at || cp.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className="text-sm font-semibold">{formatCurrency(cp.price_amount, cp.price_currency || 'XOF')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Donations ─── */}
          {myDonations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{isFr ? 'Mes dons' : 'My Donations'}</p>
                  <p className="text-[10px] text-muted-foreground">{myDonations.length} {isFr ? 'don(s)' : 'donation(s)'}</p>
                </div>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-pink-500/20">
                {myDonations.map((don: any) => (
                  <div key={don.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                    <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      {don.organizations?.logo_url ? (
                        <img src={don.organizations.logo_url} alt={don.organizations?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Heart className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {don.donation_campaigns?.title || don.organizations?.name || (isFr ? 'Don' : 'Donation')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Heart className="h-2.5 w-2.5" /> {isFr ? 'Don' : 'Donation'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(don.completed_at || don.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className="text-sm font-semibold">{formatCurrency(don.amount, don.currency || 'XOF')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Products & Courses by Org ─── */}
          {[...grouped.entries()].map(([orgId, { purchases: orgPurchases, programs: orgPrograms }]) => {
            const org = orgMap.get(orgId);
            return (
              <div key={orgId} className="space-y-3">
                <button
                  onClick={() => org?.slug && navigate(`/org/${org.slug}`)}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  {org?.logo_url ? (
                    <img src={org.logo_url} alt={org?.name} className="h-8 w-8 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold">{org?.name || 'Plateforme'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(orgPurchases?.length || 0) + orgPrograms.length} {isFr ? 'produit(s)' : 'product(s)'}
                    </p>
                  </div>
                </button>

                <div className="space-y-2 pl-2 border-l-2 border-primary/10">
                  {orgPrograms.map((enrollment) => (
                    <div key={enrollment.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                      <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        {enrollment.program.cover_image_url ? (
                          <img src={enrollment.program.cover_image_url} alt={enrollment.program.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{enrollment.program.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize gap-1">
                            <GraduationCap className="h-2.5 w-2.5" />
                            {isFr ? 'Cours' : 'Course'}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {isFr ? 'Gratuit' : 'Free'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(enrollment.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                        <Button size="sm" className="gap-1 h-7 text-[11px]" onClick={() => setActiveCourseId(enrollment.program_id)}>
                          <Play className="h-3 w-3" />
                          {isFr ? 'Suivre le cours' : 'Start course'}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {orgPurchases?.map((purchase) => (
                    <div key={purchase.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                      <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        {purchase.product.cover_image_url ? (
                          <img src={purchase.product.cover_image_url} alt={purchase.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {typeIcons[purchase.product.product_type] || <FileText className="h-6 w-6" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{purchase.product.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{purchase.product.product_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(purchase.completed_at || purchase.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                        {purchase.product.file_url && (
                          <>
                            {isPdfLikeFile(purchase.product.file_url, purchase.product.product_type) && (
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-[11px]" onClick={() => handleFileAction(purchase, 'inline')} disabled={downloading === purchase.id}>
                                <Eye className="h-3 w-3" /> {t('page.purchases_read')}
                              </Button>
                            )}
                            <Button size="sm" className="gap-1 h-7 text-[11px] bg-primary text-primary-foreground" onClick={() => handleFileAction(purchase, 'download')} disabled={downloading === purchase.id}>
                              <Download className="h-3 w-3" /> {downloading === purchase.id ? '…' : t('page.purchases_download')}
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 h-7 text-[10px]" onClick={() => {
                              const org = orgMap.get(purchase.product.organization_id) as any;
                              downloadInvoice({
                                invoiceNumber: (purchase as any).invoice_number || `SV-${purchase.id.slice(0, 8).toUpperCase()}`,
                                date: purchase.completed_at || purchase.created_at,
                                buyerName: user?.user_metadata?.display_name || user?.email || '',
                                buyerEmail: user?.email || '',
                                productTitle: purchase.product.title,
                                amount: purchase.amount,
                                currency: purchase.currency || 'XOF',
                                orgName: org?.name || '',
                                orgLogo: org?.logo_url || undefined,
                                orgEmail: org?.email || undefined,
                                orgPhone: org?.phone || undefined,
                                orgAddress: org?.address || undefined,
                                orgWebsite: org?.website || undefined,
                                reference: (purchase as any).paystack_reference || purchase.id,
                              });
                            }}>
                              <Receipt className="h-3 w-3" /> Facture
                            </Button>
                          </>
                        )}
                        {purchase.product.external_link && (
                          <a href={purchase.product.external_link} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-[11px] w-full">
                              <ExternalLink className="h-3 w-3" /> {t('page.purchases_access')}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}