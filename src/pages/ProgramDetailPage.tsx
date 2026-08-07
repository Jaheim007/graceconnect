import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useProgram, useProgramModules, useEnrollment, useLessonProgress, useEnrollInProgram, useToggleLessonComplete } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import {
  BookOpen, Layers, CheckCircle, Play, FileText, Video, Music, Link2,
  Loader2, Lock, ArrowLeft, Share2, ExternalLink, Pencil, Eye, EyeOff,
  Shield, Star, Clock, GraduationCap, Users, Flag,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProgramCertificate } from '@/components/programs/ProgramCertificate';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import { useI18n } from '@/i18n/I18nContext';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { formatPrice } from '@/lib/currency';
import { LocalPriceHint } from '@/components/payments/LocalPriceHint';
import { FormattedText } from '@/lib/formatText';
import { ShareButtons } from '@/components/social/ShareButtons';
import { ShareToEarnCTA } from '@/components/products/ShareToEarnCTA';
import { BecomeAmbassadorCTA } from '@/components/products/BecomeAmbassadorCTA';
import { SellerTrustBadges } from '@/components/products/SellerTrustBadges';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ReadingProgressBar } from '@/components/ui/ReadingProgressBar';
import { ReportContentDialog } from '@/components/reports/ReportContentDialog';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { useAffiliateCapture } from '@/hooks/useAffiliateCapture';
import type { DigitalProduct } from '@/types/database';
import { useProgramResume } from '@/hooks/useCourseResume';
import { LessonPlayerOverlay } from '@/components/programs/LessonPlayerOverlay';
import { ShareCourseMenu } from '@/components/programs/ShareCourseMenu';
import { buildCourseShareUrl } from '@/lib/coursePreview';

const CONTENT_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  video: Video,
  audio: Music,
  link: Link2,
};

export default function ProgramDetailPage() {
  useAffiliateCapture();
  const { programId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: program, isLoading } = useProgram(programId);
  const { data: modules = [] } = useProgramModules(programId);
  const { data: enrollment } = useEnrollment(programId);
  const { data: progress = {} } = useLessonProgress(programId);
  const enrollMutation = useEnrollInProgram();
  const resumeInfo = useProgramResume(programId);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchParams] = useSearchParams();

  // Deep link back to an exact slide (used by the guest paywall → sign-in flow)
  const deepSlideId = searchParams.get('slideId');
  const deepSlideParam = searchParams.get('slide');
  const deepSlideIndex = deepSlideParam !== null && /^\d+$/.test(deepSlideParam) ? Number(deepSlideParam) : null;
  const wantsPlay = searchParams.get('play') === '1';
  const toggleLesson = useToggleLessonComplete();

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const totalLessons = useMemo(() => modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0), [modules]);
  const completedLessons = useMemo(() => Object.values(progress).filter((p: any) => p.completed).length, [progress]);
  // Slide-level progress (falls back to lesson-level while resume data loads)
  const progressPercent = resumeInfo
    ? resumeInfo.progressPercent
    : totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isEnrolled = !!enrollment;

  const org = (program as any)?.organizations;
  const orgSlug = org?.slug || '';

  // Check if user can manage this org
  const { data: canManage } = useQuery({
    queryKey: ['can-manage-program', user?.id, program?.organization_id],
    queryFn: async () => {
      if (!user || !program?.organization_id) return false;
      const { data } = await db
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', program.organization_id)
        .maybeSingle();
      return data && ['owner', 'admin', 'editor'].includes(data.role);
    },
    enabled: !!user && !!program?.organization_id,
  });

  // Org page settings for theme
  const { data: pageSettings } = useQuery({
    queryKey: ['org-page-settings-program', program?.organization_id],
    queryFn: async () => {
      const { data } = await db
        .from('org_page_settings')
        .select('theme_primary_color, theme_accent_color')
        .eq('organization_id', program!.organization_id)
        .maybeSingle();
      return data;
    },
    enabled: !!program?.organization_id,
  });

  // Fetch other products from same org for recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['org-products-recommend', program?.organization_id, programId],
    queryFn: async () => {
      if (!program?.organization_id) return [];
      const { data } = await db.from('digital_products')
        .select('id, title, cover_image_url, price, currency, is_free, product_type, sales_count, slug')
        .eq('organization_id', program.organization_id)
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!program?.organization_id,
  });

  // Fetch other programs from same org
  const { data: otherPrograms = [] } = useQuery({
    queryKey: ['org-programs-recommend', program?.organization_id, programId],
    queryFn: async () => {
      if (!program?.organization_id) return [];
      const { data } = await db.from('programs')
        .select('id, title, cover_image_url, price, currency, is_free, enrollment_count')
        .eq('organization_id', program.organization_id)
        .eq('is_published', true)
        .neq('id', programId!)
        .limit(4);
      return data || [];
    },
    enabled: !!program?.organization_id,
  });

  const orgPrimary = pageSettings?.theme_primary_color;
  const orgThemeStyle = useMemo(() => {
    if (!orgPrimary) return {};
    return { '--org-primary': orgPrimary, '--org-accent': pageSettings?.theme_accent_color || orgPrimary } as React.CSSProperties;
  }, [pageSettings]);

  const bannerBg = orgPrimary
    ? { background: `linear-gradient(135deg, ${orgPrimary}18, ${orgPrimary}08, transparent)` }
    : {};
  const topBarStyle = orgPrimary ? { borderBottomColor: `${orgPrimary}30` } : {};

  // Check if course has a linked digital product for paid enrollment
  const isPaidCourse = !program?.is_free && (program?.price ?? 0) > 0;

  const { data: linkedProduct } = useQuery({
    queryKey: ['course-linked-product', program?.organization_id, programId, (program as any)?.linked_product_id],
    queryFn: async () => {
      if (!program?.organization_id || !programId) return null;

      // Preferred path: the course points at its checkout product explicitly.
      if ((program as any).linked_product_id) {
        const { data: linked } = await db.from('digital_products')
          .select('*')
          .eq('id', (program as any).linked_product_id)
          .maybeSingle();
        if (linked) return linked as DigitalProduct;
      }

      const normalizedTitle = program.title.trim();

      // Legacy fallback: match the mirrored product by title + price.
      const { data } = await db.from('digital_products')
        .select('*')
        .eq('organization_id', program.organization_id)
        .eq('product_type', 'course')
        .eq('is_published', true)
        .eq('price', program.price ?? 0)
        .eq('currency', program.currency || 'XOF')
        .ilike('title', normalizedTitle)
        .limit(1)
        .maybeSingle();
      return data as DigitalProduct | null;
    },
    enabled: !!program?.organization_id && !!program?.title && isPaidCourse,
  });

  // Check if user already purchased this course product
  const { data: existingPurchase } = useQuery({
    queryKey: ['course-purchase-check', linkedProduct?.id, user?.id],
    queryFn: async () => {
      if (!linkedProduct?.id || !user?.id) return null;
      const { data } = await db.from('product_purchases')
        .select('id')
        .eq('product_id', linkedProduct.id)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();
      return data;
    },
    enabled: !!linkedProduct?.id && !!user?.id,
  });

  const hasAccess = isEnrolled || !!existingPurchase;

  // After sign-in (or on a shared deep link) reopen the exact slide the visitor
  // was on: the real player when they have access, the preview player otherwise.
  useEffect(() => {
    if (!wantsPlay || !program) return;
    if (hasAccess) setPlayerOpen(true);
    else setPreviewOpen(true);
  }, [wantsPlay, program?.id, hasAccess]);

  const handleEnroll = async () => {
    if (!programId) return;
    if (!user) { navigate(`/auth?returnTo=/program/${programId}`); return; }

    // For paid courses with a linked product, use purchase flow
    if (isPaidCourse) {
      if (linkedProduct) {
        setShowPurchaseModal(true);
        return;
      }

      toast({
        title: isFr ? 'Paiement indisponible' : 'Payment unavailable',
        description: isFr
          ? 'Ce cours payant n’est pas encore synchronisé avec le checkout. Réessayez dans un instant.'
          : 'This paid course is not yet synced with checkout. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    // Free course: direct enrollment
    try {
      await enrollMutation.mutateAsync(programId);
      toast({ title: isFr ? '🎉 Cours ajouté à vos achats !' : '🎉 Course added to your purchases!' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  // After purchase, auto-enroll
  const handlePurchaseSuccess = async () => {
    setShowPurchaseModal(false);
    if (programId && user && !isEnrolled) {
      try {
        await enrollMutation.mutateAsync(programId);
      } catch { /* enrollment already exists */ }
    }
    queryClient.invalidateQueries({ queryKey: ['enrollment', programId] });
    queryClient.invalidateQueries({ queryKey: ['course-purchase-check'] });
    toast({ title: isFr ? '🎉 Cours acheté avec succès !' : '🎉 Course purchased successfully!' });
  };

  const handleToggleLesson = async (lessonId: string, completed: boolean) => {
    if (!programId) return;
    await toggleLesson.mutateAsync({ lessonId, completed, programId });
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const buildShareUrl = () => `https://siteviral.com/program/${programId}`;

  const isUnpublished = program && !program.is_published;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-8 px-4">
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            <div className="h-96 rounded-2xl skeleton-shimmer" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <EmptyState
        title={isFr ? 'Cours introuvable' : 'Course not found'}
        description={isFr ? 'Ce cours n\'existe pas ou a été supprimé.' : 'This course does not exist or has been deleted.'}
        action={{ label: isFr ? 'Retour' : 'Back', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  if (isUnpublished && !canManage) {
    return (
      <EmptyState
        title={isFr ? 'Cours non publié' : 'Course not published'}
        description={isFr ? 'Ce cours n\'est pas encore publié.' : 'This course is not yet published.'}
        action={{ label: isFr ? 'Retour' : 'Back', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const orgName = org?.name || '';
  const priceDisplay = formatPrice(program.price || 0, program.is_free, program.currency);
  const shareUrl = buildCourseShareUrl(programId!);
  const plainDescription = (program.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const courseMetaDescription = plainDescription.slice(0, 155)
    || `${isFr ? 'Cours en ligne par' : 'Online course by'} ${orgName} — ${program.is_free ? (isFr ? 'Gratuit' : 'Free') : priceDisplay}`;

  // Course structured data so a shared link renders a real card / rich result
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.title,
    description: courseMetaDescription,
    url: shareUrl,
    ...(program.cover_image_url ? { image: program.cover_image_url } : {}),
    inLanguage: (program as any).content_language || (isFr ? 'fr' : 'en'),
    provider: {
      '@type': 'Organization',
      name: orgName || 'Siteviral',
      ...(orgSlug ? { url: `https://siteviral.com/org/${orgSlug}` } : {}),
    },
    ...((program.enrollment_count || 0) > 0
      ? { numberOfCredits: undefined, audience: { '@type': 'Audience', audienceType: 'Learners' } }
      : {}),
    hasCourseInstance: [{
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${Math.max(1, Math.round(totalLessons * 0.25))}H`,
    }],
    offers: {
      '@type': 'Offer',
      url: shareUrl,
      price: program.is_free ? 0 : (program.price ?? 0),
      priceCurrency: program.currency || 'XOF',
      availability: 'https://schema.org/InStock',
      category: program.is_free ? 'Free' : 'Paid',
    },
  };

  if (playerOpen && programId) {
    return (
      <LessonPlayerOverlay
        programId={programId}
        initialSlideId={deepSlideId ?? resumeInfo?.resume?.slideId ?? null}
        initialSlideIndex={deepSlideIndex ?? resumeInfo?.resume?.flatIndex ?? null}
        onClose={() => setPlayerOpen(false)}
      />
    );
  }

  if (previewOpen && programId) {
    return (
      <LessonPlayerOverlay
        programId={programId}
        mode="preview"
        initialSlideId={deepSlideId}
        initialSlideIndex={deepSlideIndex}
        onRequestAccess={() => { setPreviewOpen(false); handleEnroll(); }}
        onClose={() => setPreviewOpen(false)}
      />
    );
  }



  return (
    <div className="min-h-screen bg-background" style={orgThemeStyle}>
      <ReadingProgressBar />
      <SEOHead
        title={`${program.title} — ${orgName || 'Siteviral'}`}
        description={courseMetaDescription}
        ogImage={program.cover_image_url || undefined}
        ogType="article"
        canonicalUrl={buildCourseShareUrl(programId!)}
        jsonLd={courseJsonLd}
      />

      {/* Draft banner for admins */}
      {isUnpublished && canManage && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3">
          <div className="container max-w-5xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium text-amber-800 dark:text-amber-300">
                {isFr ? 'Brouillon — Ce cours n\'est pas visible.' : 'Draft — This course is not visible.'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => navigate(`/admin/programs/${program.id}`)}
            >
              <Pencil className="h-3.5 w-3.5" /> {isFr ? 'Modifier' : 'Edit'}
            </Button>
          </div>
        </div>
      )}

      {/* Admin edit button */}
      {!isUnpublished && canManage && (
        <div className="bg-muted/50 border-b border-border/50 px-4 py-2">
          <div className="container max-w-5xl flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => navigate(`/admin/programs/${program.id}`)}
            >
              <Pencil className="h-3.5 w-3.5" /> {isFr ? 'Modifier ce cours' : 'Edit course'}
            </Button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="container max-w-5xl px-4 pt-4">
        <Breadcrumb items={[
          { label: orgName || 'Organisation', href: `/org/${orgSlug}` },
          { label: program.title },
        ]} />
      </div>

      {/* Top bar */}
      <div
        className="sticky top-14 z-20 border-b bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between"
        style={topBarStyle}
      >
        {org ? (
          <Link to={`/org/${orgSlug}`} className="flex items-center gap-2.5">
            {org.logo_url ? (
              <img src={org.logo_url} alt={orgName} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground"
                style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}
              >
                {orgName?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[180px]">{orgName}</span>
            {isOrgVerifiedOrKyc(org.is_verified, org.kyc_status) && <VerifiedBadge size="sm" label={getVerifiedLabel(org.category, locale)} className="ml-1" />}
          </Link>
        ) : (
          <Link to={user ? '/feed' : '/'}>
            <SiteLogo size="sm" linked={false} animate />
          </Link>
        )}
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/admin/programs/${program.id}`)}>
              <Pencil className="h-3.5 w-3.5" /> {isFr ? 'Modifier' : 'Edit'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> {isFr ? 'Retour' : 'Back'}
          </Button>
        </div>
      </div>

      {/* Org-branded banner */}
      {org && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative border-b border-border/30 overflow-hidden"
          style={bannerBg}
        >
          {!orgPrimary && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />
          )}
          {org.banner_url && (
            <div className="absolute inset-0">
              <img src={org.banner_url} alt="" className="w-full h-full object-cover opacity-15" />
            </div>
          )}
          <div className="container max-w-5xl px-4 py-4 relative z-10">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={orgName} className="h-12 w-12 rounded-xl object-cover border-2 border-background shadow-md" />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md border-2 border-background"
                  style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}
                >
                  {orgName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isFr ? 'Proposé par' : 'Offered by'}</p>
                <p className="font-bold text-sm flex items-center gap-1">
                  {orgName}
                  {isOrgVerifiedOrKyc(org.is_verified, org.kyc_status) && <VerifiedBadge size="sm" label={getVerifiedLabel(org.category, locale)} />}
                </p>
                {org.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{org.description}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs shrink-0 bg-background/80 backdrop-blur-sm"
                onClick={() => navigate(`/org/${orgSlug}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" /> {isFr ? 'Voir la boutique' : 'View store'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className={cn("container max-w-5xl px-4 py-6 md:pb-6", !hasAccess ? "pb-28" : "pb-24")}>
        <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-8">
          {/* Left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Cover / Preview images */}
            <ProductImageGallery
              coverImage={program.cover_image_url}
              previewImages={(program as any).preview_images}
              title={program.title}
              aspectClass="aspect-video"
            />

            {/* Mobile title */}
            <div className="md:hidden space-y-2">
              <h1 className="text-2xl font-bold">{program.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs capitalize gap-1">
                  <GraduationCap className="h-3 w-3" /> {isFr ? 'Cours' : 'Course'}
                </Badge>
                {(program.enrollment_count || 0) > 0 && (
                  <span className="text-xs text-muted-foreground">{program.enrollment_count}+ {isFr ? 'inscrits' : 'enrolled'}</span>
                )}
              </div>
            </div>

            {/* Description */}
            {program.description && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  {isFr ? 'Description' : 'Description'}
                </h2>
                <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                  <FormattedText
                    text={program.description}
                    className="text-sm text-muted-foreground leading-relaxed break-words prose prose-sm max-w-none"
                  />
                </div>
              </div>
            )}

            {/* Course curriculum */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" />
                {isFr ? 'Programme du cours' : 'Course curriculum'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {modules.length} {isFr ? 'modules' : 'modules'}</span>
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {totalLessons} {isFr ? 'leçons' : 'lessons'}</span>
                {hasAccess && (
                  <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> {completedLessons}/{totalLessons} {isFr ? 'complétées' : 'completed'}</span>
                )}
              </div>

              {hasAccess && (
                <div className="space-y-1 mb-3">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">{progressPercent}% {isFr ? 'terminé' : 'completed'}</p>
                </div>
              )}

              {modules.map((mod: any, mi: number) => {
                const moduleLessons = mod.lessons || [];
                const moduleCompleted = moduleLessons.filter((l: any) => progress[l.id]?.completed).length;
                const isModuleComplete = moduleLessons.length > 0 && moduleCompleted === moduleLessons.length;

                return (
                  <Collapsible key={mod.id} open={openModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mi * 0.05 }}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <CollapsibleTrigger className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                          isModuleComplete ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
                        )}>
                          {isModuleComplete ? <CheckCircle className="h-4 w-4" /> : `${mi + 1}`}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-semibold truncate">{mod.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {moduleLessons.length} {isFr ? `leçon${moduleLessons.length !== 1 ? 's' : ''}` : `lesson${moduleLessons.length !== 1 ? 's' : ''}`} · {moduleCompleted} {isFr ? 'complétée' : 'completed'}
                          </p>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-border divide-y divide-border/50">
                          {moduleLessons.map((lesson: any) => {
                            const LessonIcon = CONTENT_ICONS[lesson.content_type] || FileText;
                            const isComplete = progress[lesson.id]?.completed;

                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                                {hasAccess ? (
                                  <Checkbox
                                    checked={isComplete}
                                    onCheckedChange={(checked) => handleToggleLesson(lesson.id, !!checked)}
                                    className="shrink-0"
                                  />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                )}
                                <LessonIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-sm', isComplete && 'line-through text-muted-foreground')}>{lesson.title}</p>
                                </div>
                                {lesson.duration_minutes && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                    <Clock className="h-2.5 w-2.5" /> {lesson.duration_minutes}min
                                  </span>
                                )}
                                {lesson.content_url && isEnrolled && (
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" asChild>
                                    <a href={lesson.content_url} target="_blank" rel="noreferrer">{isFr ? 'Ouvrir' : 'Open'}</a>
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </motion.div>
                  </Collapsible>
                );
              })}
            </div>

            {/* Certificate — only if creator enabled it */}
            {hasAccess && (program as any).certificate_enabled !== false && (
              <ProgramCertificate
                programId={programId!}
                programTitle={program.title}
                orgName={orgName}
                orgLogo={org?.logo_url}
                progressPercent={progressPercent}
                totalLessons={totalLessons}
                completedLessons={completedLessons}
              />
            )}

            {/* Other programs by same org */}
            {otherPrograms.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">{isFr ? 'Autres cours' : 'Other courses'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {otherPrograms.map((p: any) => (
                    <Link key={p.id} to={`/program/${p.id}`} className="group">
                      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt={p.title} className="w-full aspect-video object-cover" />
                        ) : (
                          <div className="w-full aspect-video bg-muted flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{p.title}</p>
                          <p className="text-xs text-primary font-bold mt-1">
                            {formatPrice(p.price || 0, p.is_free, p.currency)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended products from same org */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">{isFr ? 'Vous aimerez aussi' : 'You may also like'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {recommendations.map((p: any) => (
                    <Link key={p.id} to={`/org/${orgSlug}/p/${p.slug || p.id}`} className="group">
                      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt={p.title} className="w-full aspect-[2/3] object-cover" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{p.title}</p>
                          <p className="text-xs text-primary font-bold mt-1">
                            {formatPrice(p.price || 0, p.is_free, p.currency)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-[6.5rem] md:self-start space-y-4 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto scrollbar-hide">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-card space-y-4">
              {/* Desktop title */}
              <div className="hidden md:block space-y-2">
                <h1 className="text-xl font-bold leading-snug">{program.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs capitalize gap-1">
                    <GraduationCap className="h-3 w-3" /> {isFr ? 'Cours' : 'Course'}
                  </Badge>
                  {(program.enrollment_count || 0) > 0 && (
                    <span className="text-xs text-muted-foreground">{program.enrollment_count}+ {isFr ? 'inscrits' : 'enrolled'}</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-center py-2">
                <span className={cn('text-3xl font-bold', program.is_free ? 'text-emerald-500' : 'text-primary')}>
                  {priceDisplay}
                </span>
                {!program.is_free && (program.price ?? 0) > 0 && (
                  <div className="mt-0.5">
                    <LocalPriceHint amount={program.price ?? 0} currency={program.currency || 'XOF'} className="text-xs" />
                  </div>
                )}
              </div>

              {/* Social proof */}
              {(program.enrollment_count || 0) > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{program.enrollment_count} {isFr ? 'personnes inscrites' : 'people enrolled'}</span>
                </div>
              )}

              {/* Course stats */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {modules.length} {isFr ? 'modules' : 'modules'}</span>
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {totalLessons} {isFr ? 'leçons' : 'lessons'}</span>
              </div>

              {/* CTA */}
              {hasAccess ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-[10px] text-muted-foreground text-center">{progressPercent}% {isFr ? 'terminé' : 'completed'}</p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg"
                    onClick={() => setPlayerOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                    {resumeInfo?.resume
                      ? (isFr
                          ? `Reprendre — Leçon ${resumeInfo.resume.lessonNumber}, diapo ${resumeInfo.resume.slideNumber} sur ${resumeInfo.resume.slidesInLesson}`
                          : `Resume — Lesson ${resumeInfo.resume.lessonNumber}, slide ${resumeInfo.resume.slideNumber} of ${resumeInfo.resume.slidesInLesson}`)
                      : (isFr ? 'Continuer le cours' : 'Continue course')}
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full gap-2 font-semibold shadow-lg"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {program.is_free
                    ? (isFr ? 'Obtenir gratuitement' : 'Get for free')
                    : (isFr ? `Acheter — ${priceDisplay}` : `Buy — ${priceDisplay}`)
                  }
                </Button>
              )}

              {/* Free preview — no account required */}
              {!hasAccess && totalLessons > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 font-medium"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                  {isFr ? 'Aperçu gratuit' : 'Free preview'}
                </Button>
              )}

              {/* Share & actions */}
              <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                <ShareCourseMenu
                  programId={programId!}
                  title={program.title}
                  description={plainDescription}
                />
                <div className="flex-1">
                  <ShareButtons
                    url={buildShareUrl()}
                    title={program.title}
                    description={program.description?.slice(0, 120) || ''}
                    compact
                  />
                </div>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title={isFr ? 'Signaler' : 'Report'}
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <ReportContentDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                contentId={program.id}
                contentType="program"
                contentTitle={program.title}
                organizationId={program.organization_id}
              />
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Shield className="h-4 w-4" style={{ color: orgPrimary || 'hsl(var(--primary))' }} />, label: isFr ? 'Accès sécurisé' : 'Secure access' },
                { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, label: isFr ? 'Accès immédiat' : 'Instant access' },
                { icon: <Star className="h-4 w-4 text-yellow-500" />, label: isFr ? 'Qualité garantie' : 'Quality guaranteed' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border/60 bg-muted/30 text-center"
                >
                  {item.icon}
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">{item.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Ambassador features */}
            <ShareToEarnCTA
              productId={program.id}
              organizationId={program.organization_id}
              organizationSlug={orgSlug}
            />

            <BecomeAmbassadorCTA
              organizationId={program.organization_id}
              orgSlug={orgSlug}
              orgName={orgName}
              commissionPercent={org?.affiliation_commission_percent}
            />

            {/* Seller Trust */}
            <SellerTrustBadges
              organizationId={program.organization_id}
              orgName={orgName}
              kycStatus={org?.kyc_status}
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA bar */}
      {!hasAccess && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <span className={cn('text-xl font-bold', program.is_free ? 'text-emerald-500' : 'text-primary')}>
                {priceDisplay}
              </span>
              {!program.is_free && (program.price ?? 0) > 0 && (
                <LocalPriceHint amount={program.price ?? 0} currency={program.currency || 'XOF'} className="text-[10px] block" />
              )}
            </div>
            <Button
              size="lg"
              className="gap-2 font-semibold shadow-lg px-6"
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {program.is_free
                ? (isFr ? 'Obtenir' : 'Get free')
                : (isFr ? 'Acheter' : 'Buy now')
              }
            </Button>
          </div>
        </motion.div>
      )}

      {/* Purchase modal for paid courses */}
      {linkedProduct && (
        <ProductPurchaseModal
          product={linkedProduct}
          organizationId={program.organization_id}
          open={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
