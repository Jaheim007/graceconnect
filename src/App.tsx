import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
// ModeContext removed — was dead code (useMode() not consumed anywhere)
import { I18nProvider } from "@/i18n/I18nContext";


// Layout (always loaded)
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RequireAuth, RequireSuperadmin, RequireOrgManage } from "@/components/layout/RouteGuard";
import { GDPRBanner } from "@/components/layout/GDPRBanner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { SkipLink } from "@/components/layout/SkipLink";
import { ShortcutRedirect } from "@/components/layout/ShortcutRedirect";
import { FloatingProofToast } from "@/components/social-proof/FloatingProofToast";
import { DomainRouter } from "@/components/layout/DomainRouter";

/** Redirect /store/:slug → /org/:slug/store */
function StoreRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/org/${slug}/store`} replace />;
}

// Lazy-loaded fallback — branded splash
const PageLoader = () => (
  <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="h-14 w-14 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background shadow-lg shadow-primary/10">
        <img src="/logo-s.png" alt="Siteviral" className="h-9 w-9 object-contain animate-pulse" />
      </div>
      <div className="absolute inset-0 h-14 w-14 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
    <p className="text-xs text-muted-foreground font-medium animate-pulse">Chargement…</p>
  </div>
);

// ─── Lazy-loaded pages ─── //
// Public
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const DashboardPreview = lazy(() => import("@/pages/DashboardPreview"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage"));
// SpotlightPage consolidated into Discover
const PromoCataloguePage = lazy(() => import("@/pages/promo/PromoCataloguePage"));
const PromoGratuitsPage = lazy(() => import("@/pages/promo/PromoGratuitsPage"));
const PromoStarsPage = lazy(() => import("@/pages/promo/PromoStarsPage"));
const OrgPublicPage = lazy(() => import("@/pages/OrgPublicPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const PaymentSuccessPage = lazy(() => import("@/pages/PaymentSuccessPage"));
const AMLPage = lazy(() => import("@/pages/AMLPage"));
const RefundPolicyPage = lazy(() => import("@/pages/RefundPolicyPage"));
const PayoutPolicyPage = lazy(() => import("@/pages/PayoutPolicyPage"));
const AcceptableUsePage = lazy(() => import("@/pages/AcceptableUsePage"));
const InvitePage = lazy(() => import("@/pages/InvitePage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const CompliancePage = lazy(() => import("@/pages/CompliancePage"));
const DPAPage = lazy(() => import("@/pages/DPAPage"));
const SecurityPage = lazy(() => import("@/pages/SecurityPage"));
const SubprocessorsPage = lazy(() => import("@/pages/SubprocessorsPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const PublicAffiliationPage = lazy(() => import("@/pages/PublicAffiliationPage"));
const AmbassadorTermsPage = lazy(() => import("@/pages/AmbassadorTermsPage"));
const BecomePartnerPage = lazy(() => import("@/pages/BecomePartnerPage"));
const PartnerTermsPage = lazy(() => import("@/pages/PartnerTermsPage"));
const CampaignDetailPage = lazy(() => import("@/pages/CampaignDetailPage"));
const OfferingDetailPage = lazy(() => import("@/pages/OfferingDetailPage"));
const AnnouncementDetailPage = lazy(() => import("@/pages/AnnouncementDetailPage"));
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const WelcomeIntentPage = lazy(() => import("@/pages/WelcomeIntentPage"));

const ChangelogPage = lazy(() => import("@/pages/ChangelogPage"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const GoRedirectPage = lazy(() => import("@/pages/GoRedirectPage"));
const QuickStartPage = lazy(() => import("@/pages/QuickStartPage"));
const QuickPublishPage = lazy(() => import("@/pages/QuickPublishPage"));
const GagnerPage = lazy(() => import("@/pages/GagnerPage"));
const EcrirePage = lazy(() => import("@/pages/EcrirePage"));
// MigrerPage removed — marginal feature
const CanvaCallbackPage = lazy(() => import("@/pages/canva/CanvaCallback"));
// VendreLandingPage consolidated — redirect to landing
// ProtectionPage kept
const EmbedCheckoutPage = lazy(() => import("@/pages/EmbedCheckoutPage"));
const CertificateVerifyPage = lazy(() => import("@/pages/CertificateVerifyPage"));
const TemoignagesPage = lazy(() => import("@/pages/TemoignagesPage"));
// CalculateurPage removed — gadget
const PourEglisesPage = lazy(() => import("@/pages/persona/PourEglisesPage"));
const PourOngPage = lazy(() => import("@/pages/persona/PourOngPage"));
const PourFormateursPage = lazy(() => import("@/pages/persona/PourFormateursPage"));
const PourEtudiantsPage = lazy(() => import("@/pages/persona/PourEtudiantsPage"));
const PourAuteursPage = lazy(() => import("@/pages/persona/PourAuteursPage"));
const PourMusiciensPage = lazy(() => import("@/pages/persona/PourMusiciensPage"));
const PourDiasporaPage = lazy(() => import("@/pages/persona/PourDiasporaPage"));
const PourPhotographesPage = lazy(() => import("@/pages/persona/PourPhotographesPage"));
const PourPodcastersPage = lazy(() => import("@/pages/persona/PourPodcastersPage"));
const PourAssociationsPage = lazy(() => import("@/pages/persona/PourAssociationsPage"));
const PourCoachesPage = lazy(() => import("@/pages/persona/PourCoachesPage"));
const PourDesignersPage = lazy(() => import("@/pages/persona/PourDesignersPage"));
const PourEntrepreneursPage = lazy(() => import("@/pages/persona/PourEntrepreneursPage"));
const PourMinisteresPage = lazy(() => import("@/pages/persona/PourMinisteresPage"));
const PourLeadersMusulmansPage = lazy(() => import("@/pages/persona/PourLeadersMusulmansPage"));
const PourMissionnairesPage = lazy(() => import("@/pages/persona/PourMissionnairesPage"));
const PourCooperativesPage = lazy(() => import("@/pages/persona/PourCooperativesPage"));
const PourEnseignantsPage = lazy(() => import("@/pages/persona/PourEnseignantsPage"));
const PourCentresFormationPage = lazy(() => import("@/pages/persona/PourCentresFormationPage"));
const PourCreateursVideoPage = lazy(() => import("@/pages/persona/PourCreateursVideoPage"));
const PourBloggeursPage = lazy(() => import("@/pages/persona/PourBloggeursPage"));
const PourConsultantsPage = lazy(() => import("@/pages/persona/PourConsultantsPage"));
const PourJuristesPage = lazy(() => import("@/pages/persona/PourJuristesPage"));
const PourAgencesPage = lazy(() => import("@/pages/persona/PourAgencesPage"));
const PourInfluenceursPage = lazy(() => import("@/pages/persona/PourInfluenceursPage"));
const ShareTargetPage = lazy(() => import("@/pages/ShareTargetPage"));
const PourSantePage = lazy(() => import("@/pages/persona/PourSantePage"));
const PourFinancePage = lazy(() => import("@/pages/persona/PourFinancePage"));
const PourFemmesEntrepreneurPage = lazy(() => import("@/pages/persona/PourFemmesEntrepreneurPage"));
const PourMediasPage = lazy(() => import("@/pages/persona/PourMediasPage"));
const PourRetraitesPage = lazy(() => import("@/pages/persona/PourRetraitesPage"));

const PressePage = lazy(() => import("@/pages/PressePage"));
const BlogIndexPage = lazy(() => import("@/pages/blog/BlogIndexPage"));
const BlogArticlePage = lazy(() => import("@/pages/blog/BlogArticlePage"));
const EtudesDeCasPage = lazy(() => import("@/pages/EtudesDeCasPage"));
const StatusPage = lazy(() => import("@/pages/StatusPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const PartenairesPage = lazy(() => import("@/pages/PartenairesPage"));
const GuideVendreEbookPage = lazy(() => import("@/pages/guides/GuideVendreEbookPage"));
const GuidePlateformeDonsPage = lazy(() => import("@/pages/guides/GuidePlateformeDonsPage"));
const GuideGagnerSansContenuPage = lazy(() => import("@/pages/guides/GuideGagnerSansContenuPage"));
const GuideVendreCoursPage = lazy(() => import("@/pages/guides/GuideVendreCoursPage"));
const GuideMobileMoneyPage = lazy(() => import("@/pages/guides/GuideMobileMoneyPage"));
const GuideAlternativeGofundmePage = lazy(() => import("@/pages/guides/GuideAlternativeGofundmePage"));
const GuideBoutiqueDigitalePage = lazy(() => import("@/pages/guides/GuideBoutiqueDigitalePage"));
const GuideMonetiserContenuReligieuxPage = lazy(() => import("@/pages/guides/GuideMonetiserContenuReligieuxPage"));
const GuideAffiliationSansInvestissementPage = lazy(() => import("@/pages/guides/GuideAffiliationSansInvestissementPage"));
const TutorialsPage = lazy(() => import("@/pages/TutorialsPage"));

// Authenticated
// FeedPage consolidated into Discover
const ReelsPage = lazy(() => import("@/pages/ReelsPage"));
const WatchPage = lazy(() => import("@/pages/WatchPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const DashboardRouter = lazy(() => import("@/pages/DashboardRouter"));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage"));
const MyDonationsPage = lazy(() => import("@/pages/MyDonationsPage"));
const CreateOrgPage = lazy(() => import("@/pages/CreateOrgPage"));

const SupportPage = lazy(() => import("@/pages/SupportPage"));
// AffiliationPage consolidated into GagnerPage
const PartnerPortalPage = lazy(() => import("@/pages/PartnerPortalPage"));


const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
// WishlistPage merged into BookmarksPage
const NotificationPreferencesPage = lazy(() => import("@/pages/NotificationPreferencesPage"));
const MyInvoicesPage = lazy(() => import("@/pages/MyInvoicesPage"));
const MyProgramsPage = lazy(() => import("@/pages/MyProgramsPage"));
const UserAnalyticsPage = lazy(() => import("@/pages/UserAnalyticsPage"));
const CreditsPage = lazy(() => import("@/pages/CreditsPage"));

// Admin
const AdminShell = lazy(() => import("@/pages/admin/AdminShell"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminMedia = lazy(() => import("@/pages/admin/AdminMedia"));
const AdminMediaForm = lazy(() => import("@/pages/admin/AdminMediaForm").then(m => ({ default: m.MediaForm })));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminCRM = lazy(() => import("@/pages/admin/AdminCRM"));

const AdminViralTools = lazy(() => import("@/pages/admin/AdminViralTools"));
const AdminPromoCodes = lazy(() => import("@/pages/admin/AdminPromoCodes"));
const AdminPopups = lazy(() => import("@/pages/admin/AdminPopups"));
const AdminPhotos = lazy(() => import("@/pages/admin/AdminPhotos"));
const AdminSales = lazy(() => import("@/pages/admin/AdminSales"));
const AdminPayouts = lazy(() => import("@/pages/admin/AdminPayouts"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminWaitlists = lazy(() => import("@/pages/admin/AdminWaitlists"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminExperiments = lazy(() => import("@/pages/admin/AdminExperiments"));
const AdminWebhooks = lazy(() => import("@/pages/admin/AdminWebhooks"));
const AdminOfferings = lazy(() => import("@/pages/admin/AdminOfferings"));
const AdminPrograms = lazy(() => import("@/pages/admin/AdminPrograms"));
const AdminProgramForm = lazy(() => import("@/pages/admin/AdminProgramForm").then(m => ({ default: m.ProgramForm })));
const AdminLearnerProgress = lazy(() => import("@/pages/admin/AdminLearnerProgress"));
const AdminCreateHub = lazy(() => import("@/pages/admin/AdminCreateHub"));
const AdminContentHub = lazy(() => import("@/pages/admin/AdminContentHub"));
const AdminPeople = lazy(() => import("@/pages/admin/AdminPeople"));
const ProgramDetailPage = lazy(() => import("@/pages/ProgramDetailPage"));
const AdminAnnouncementForm = lazy(() => import("@/pages/admin/AdminAnnouncementForm").then(m => ({ default: m.AnnouncementForm })));
const AdminEventForm = lazy(() => import("@/pages/admin/AdminEventForm").then(m => ({ default: m.EventForm })));
const AdminCampaignForm = lazy(() => import("@/pages/admin/AdminCampaignForm").then(m => ({ default: m.CampaignForm })));
const AdminProductForm = lazy(() => import("@/pages/admin/AdminProductForm").then(m => ({ default: m.ProductForm })));

// AI Studio
const StudioHome = lazy(() => import("@/pages/admin/studio/StudioHome"));
const StudioProjectsList = lazy(() => import("@/pages/admin/studio/StudioProjectsList"));
const ProjectWizard = lazy(() => import("@/pages/admin/studio/ProjectWizard"));
const ProjectOverview = lazy(() => import("@/pages/admin/studio/ProjectOverview"));
const ProjectEditor = lazy(() => import("@/pages/admin/studio/ProjectEditor"));
const ProjectAssets = lazy(() => import("@/pages/admin/studio/ProjectAssets"));
const ProjectReviewQualityGate = lazy(() => import("@/pages/admin/studio/ProjectReviewQualityGate"));
const ProjectPublishWizard = lazy(() => import("@/pages/admin/studio/ProjectPublishWizard"));
const AiJobsQueue = lazy(() => import("@/pages/admin/studio/AiJobsQueue"));
const OrgTemplates = lazy(() => import("@/pages/admin/studio/OrgTemplates"));
const AssetsLibrary = lazy(() => import("@/pages/admin/studio/AssetsLibrary"));

// Superadmin
const SuperadminLayout = lazy(() => import("@/pages/superadmin/SuperadminLayout"));
const SuperadminFullDashboard = lazy(() => import("@/pages/superadmin/SuperadminFullDashboard"));
const SuperadminAIChat = lazy(() => import("@/pages/superadmin/SuperadminAIChat"));
const SuperadminCommandCenter = lazy(() => import("@/pages/superadmin/SuperadminCommandCenter"));
const SuperadminHealthDashboard = lazy(() => import("@/pages/superadmin/SuperadminHealthDashboard"));
const SuperadminUsers = lazy(() => import("@/pages/superadmin/SuperadminUsers"));
const SuperadminActivityFeed = lazy(() => import("@/pages/superadmin/SuperadminActivityFeed"));
const SuperadminSettings = lazy(() => import("@/pages/superadmin/SuperadminSettings"));
const SuperadminExports = lazy(() => import("@/pages/superadmin/SuperadminExports"));
const SuperadminInvestorSnapshot = lazy(() => import("@/pages/superadmin/SuperadminInvestorSnapshot"));
const SuperadminRiskAML = lazy(() => import("@/pages/superadmin/SuperadminRiskAML"));
const SuperadminDirectory = lazy(() => import("@/pages/superadmin/SuperadminDirectory"));
const SuperadminEmailLogs = lazy(() => import("@/pages/superadmin/SuperadminEmailLogs"));
const SuperadminPush = lazy(() => import("@/pages/superadmin/SuperadminPush"));
const SuperadminSupport = lazy(() => import("@/pages/superadmin/SuperadminSupport"));
const SuperadminSettlements = lazy(() => import("@/pages/superadmin/SuperadminSettlements"));
const SuperadminPartners = lazy(() => import("@/pages/superadmin/SuperadminPartners"));
const SuperadminGlobalTemplates = lazy(() => import("@/pages/superadmin/studio/GlobalTemplatesManager"));
const SuperadminAiPolicies = lazy(() => import("@/pages/superadmin/studio/AiPoliciesManager"));
const SuperadminGlobalJobs = lazy(() => import("@/pages/superadmin/studio/GlobalAiJobsMonitor"));
const SuperadminAiAbuse = lazy(() => import("@/pages/superadmin/studio/AiAbuseMonitor"));
const SuperadminAIHistory = lazy(() => import("@/pages/superadmin/SuperadminAIHistory"));
const SuperadminAds = lazy(() => import("@/pages/superadmin/SuperadminAds"));
// Wrap lazy components that export named exports
const LazyAdminAnnouncements = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminAnnouncements })));
const LazyAdminEvents = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminEvents })));
const LazyAdminCampaigns = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminCampaigns })));
const LazyAdminProducts = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminProducts })));
const LazyAdminMembers = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminMembers })));
const LazyAdminAffiliation = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminAffiliation })));
const LazyAdminKYC = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminKYC })));
const LazyAdminSettings = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminSettings })));

const LazySuperadminOrgs = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminOrgs })));
const LazySuperadminKYC = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminKYC })));
const LazySuperadminTransactions = lazy(() => import("@/pages/superadmin/SuperadminTransactions"));
const LazySuperadminReports = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminReports })));
const LazySuperadminMetrics = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminMetrics })));
const SuperadminModeration = lazy(() => import("@/pages/superadmin/SuperadminModeration"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
    mutations: {
      onError: (error: unknown) => {
        // I14: Global mutation error handler — prevents silent failures
        const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
        console.error('[Mutation Error]', message);
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <OrgProvider>
            
            <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              
              <SkipLink />
              <OfflineBanner />
              <ScrollToTop />
              <GDPRBanner />
              <FloatingProofToast />
              <DomainRouter />
              
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard-preview" element={<RequireSuperadmin><DashboardPreview /></RequireSuperadmin>} />
                <Route path="/embed/checkout/:productId" element={<EmbedCheckoutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/aml" element={<AMLPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/payout-policy" element={<PayoutPolicyPage />} />
                <Route path="/acceptable-use" element={<AcceptableUsePage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/dpa" element={<DPAPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/subprocessors" element={<SubprocessorsPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/affiliate-program" element={<PublicAffiliationPage />} />
                <Route path="/ambassador-program" element={<PublicAffiliationPage />} />
                <Route path="/ambassador" element={<Navigate to="/affiliate-program" replace />} />
                <Route path="/ambassador-terms" element={<AmbassadorTermsPage />} />
                <Route path="/devenir-partenaire" element={<BecomePartnerPage />} />
                <Route path="/partner-terms" element={<PartnerTermsPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/canva/callback" element={<CanvaCallbackPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/invite/:code" element={<InvitePage />} />
                <Route path="/verify/:certNumber" element={<CertificateVerifyPage />} />
                <Route path="/install" element={<InstallPage />} />
                <Route path="/share-target" element={<ShareTargetPage />} />
                <Route path="/changelog" element={<ChangelogPage />} />
                <Route path="/temoignages" element={<TemoignagesPage />} />
                <Route path="/calculateur" element={<Navigate to="/gagner" replace />} />
                <Route path="/pour/eglises" element={<PourEglisesPage />} />
                <Route path="/pour/ong" element={<PourOngPage />} />
                <Route path="/pour/formateurs" element={<PourFormateursPage />} />
                <Route path="/pour/etudiants" element={<PourEtudiantsPage />} />
                <Route path="/pour/auteurs" element={<PourAuteursPage />} />
                <Route path="/pour/musiciens" element={<PourMusiciensPage />} />
                <Route path="/pour/diaspora" element={<PourDiasporaPage />} />
                <Route path="/pour/photographes" element={<PourPhotographesPage />} />
                <Route path="/pour/podcasters" element={<PourPodcastersPage />} />
                <Route path="/pour/associations" element={<PourAssociationsPage />} />
                <Route path="/comparer" element={<Navigate to="/discover" replace />} />
                <Route path="/pour/coaches" element={<PourCoachesPage />} />
                <Route path="/pour/designers" element={<PourDesignersPage />} />
                <Route path="/pour/entrepreneurs" element={<PourEntrepreneursPage />} />
                <Route path="/pour/ministeres" element={<PourMinisteresPage />} />
                <Route path="/pour/leaders-musulmans" element={<PourLeadersMusulmansPage />} />
                <Route path="/pour/missionnaires" element={<PourMissionnairesPage />} />
                <Route path="/pour/cooperatives" element={<PourCooperativesPage />} />
                <Route path="/pour/enseignants" element={<PourEnseignantsPage />} />
                <Route path="/pour/centres-formation" element={<PourCentresFormationPage />} />
                <Route path="/pour/createurs-video" element={<PourCreateursVideoPage />} />
                <Route path="/pour/blogueurs" element={<PourBloggeursPage />} />
                <Route path="/pour/consultants" element={<PourConsultantsPage />} />
                <Route path="/pour/juristes" element={<PourJuristesPage />} />
                <Route path="/pour/agences" element={<PourAgencesPage />} />
                <Route path="/pour/influenceurs" element={<PourInfluenceursPage />} />
                <Route path="/pour/sante" element={<PourSantePage />} />
                <Route path="/pour/finance" element={<PourFinancePage />} />
                <Route path="/pour/femmes-entrepreneures" element={<PourFemmesEntrepreneurPage />} />
                <Route path="/pour/medias" element={<PourMediasPage />} />
                <Route path="/pour/retraites" element={<PourRetraitesPage />} />
                <Route path="/presse" element={<PressePage />} />
                <Route path="/blog" element={<BlogIndexPage />} />
                <Route path="/blog/:slug" element={<BlogArticlePage />} />
                <Route path="/etudes-de-cas" element={<EtudesDeCasPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/tutoriels" element={<TutorialsPage />} />
                <Route path="/partenaires" element={<PartenairesPage />} />
                <Route path="/guide/vendre-ebook-afrique" element={<GuideVendreEbookPage />} />
                <Route path="/guide/plateforme-dons-afrique" element={<GuidePlateformeDonsPage />} />
                <Route path="/guide/gagner-sans-contenu" element={<GuideGagnerSansContenuPage />} />
                <Route path="/guide/vendre-cours-en-ligne" element={<GuideVendreCoursPage />} />
                <Route path="/guide/mobile-money-ecommerce" element={<GuideMobileMoneyPage />} />
                <Route path="/guide/alternative-gofundme" element={<GuideAlternativeGofundmePage />} />
                <Route path="/guide/boutique-digitale-gratuite" element={<GuideBoutiqueDigitalePage />} />
                <Route path="/guide/monetiser-contenu-religieux" element={<GuideMonetiserContenuReligieuxPage />} />
                <Route path="/guide/affiliation-sans-investissement" element={<GuideAffiliationSansInvestissementPage />} />
                <Route path="/go/:code" element={<GoRedirectPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/gagner" element={<GagnerPage />} />
                <Route path="/earn" element={<Navigate to="/gagner" replace />} />
                <Route path="/gagner-info" element={<Navigate to="/gagner" replace />} />
                <Route path="/ecrire" element={<RequireAuth><EcrirePage /></RequireAuth>} />
                <Route path="/write" element={<Navigate to="/ecrire" replace />} />
                <Route path="/migrer" element={<Navigate to="/" replace />} />
                <Route path="/migrate" element={<Navigate to="/" replace />} />
                <Route path="/vendre" element={<Navigate to="/" replace />} />
                <Route path="/sell" element={<Navigate to="/" replace />} />
                <Route path="/protection" element={<Navigate to="/security" replace />} />
                <Route path="/explorer" element={<Navigate to="/discover" replace />} />
                <Route path="/hub" element={<Navigate to="/discover" replace />} />
                <Route path="/store/:slug" element={<StoreRedirect />} />
                {/* Public / Buyer Universe — uses PublicLayout (minimal chrome) */}
                <Route element={<PublicLayout />}>
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/spotlight" element={<Navigate to="/discover" replace />} />
                  <Route path="/org/:slug" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/content" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/events" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/store" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/donate" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/photos" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/offerings" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/dons" element={<OrgPublicPage />} />
                  <Route path="/org/:slug/product/:productId" element={<ProductDetailPage />} />
                  <Route path="/org/:slug/p/:productSlug" element={<ProductDetailPage />} />
                  <Route path="/campaign/:campaignId" element={<CampaignDetailPage />} />
                  <Route path="/offering/:offeringId" element={<OfferingDetailPage />} />
                  <Route path="/announcement/:announcementId" element={<AnnouncementDetailPage />} />
                  <Route path="/event/:eventId" element={<EventDetailPage />} />
                  <Route path="/program/:programId" element={<ProgramDetailPage />} />
                </Route>

                {/* Welcome intent (post-signup) */}
                <Route path="/welcome" element={<RequireAuth><WelcomeIntentPage /></RequireAuth>} />

                {/* Authenticated shell */}
                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route path="/marketplace" element={<Navigate to="/discover" replace />} />
                  <Route path="/feed" element={<Navigate to="/discover" replace />} />
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/reels/:id" element={<ReelsPage />} />
                  <Route path="/watch/:id" element={<WatchPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/notification-preferences" element={<NotificationPreferencesPage />} />
                  <Route path="/wallet" element={<ShortcutRedirect kind="wallet" />} />
                  <Route path="/settings" element={<ShortcutRedirect kind="settings" />} />
                  <Route path="/kyc" element={<ShortcutRedirect kind="kyc" />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/my-donations" element={<MyDonationsPage />} />
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  <Route path="/quick-start" element={<QuickStartPage />} />
                  <Route path="/quick-publish" element={<QuickPublishPage />} />
                  <Route path="/create-org" element={<CreateOrgPage />} />
                  
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/affiliation" element={<Navigate to="/gagner" replace />} />
                  
                  <Route path="/leaderboard" element={<Navigate to="/gagner" replace />} />
                  
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/wishlist" element={<Navigate to="/bookmarks" replace />} />
                  <Route path="/partner" element={<PartnerPortalPage />} />
                  <Route path="/invoices" element={<MyInvoicesPage />} />
                  <Route path="/my-analytics" element={<UserAnalyticsPage />} />
                  <Route path="/my-programs" element={<MyProgramsPage />} />
                  <Route path="/credits" element={<CreditsPage />} />

                  {/* Admin — inside AppLayout for seamless navigation */}
                  <Route path="/admin" element={<RequireOrgManage><AdminShell /></RequireOrgManage>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="create" element={<AdminCreateHub />} />
                  <Route path="content" element={<AdminContentHub />} />
                  <Route path="people" element={<AdminPeople />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="media/new" element={<AdminMediaForm />} />
                  <Route path="media/:id/edit" element={<AdminMediaForm />} />
                  <Route path="announcements" element={<LazyAdminAnnouncements />} />
                  <Route path="announcements/new" element={<AdminAnnouncementForm />} />
                  <Route path="announcements/:id/edit" element={<AdminAnnouncementForm />} />
                  <Route path="events" element={<LazyAdminEvents />} />
                  <Route path="events/new" element={<AdminEventForm />} />
                  <Route path="events/:id/edit" element={<AdminEventForm />} />
                  <Route path="campaigns" element={<LazyAdminCampaigns />} />
                  <Route path="campaigns/new" element={<AdminCampaignForm />} />
                  <Route path="campaigns/:id/edit" element={<AdminCampaignForm />} />
                  <Route path="products" element={<LazyAdminProducts />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route path="products/:id/edit" element={<AdminProductForm />} />
                  <Route path="members" element={<LazyAdminMembers />} />
                  <Route path="photos" element={<AdminPhotos />} />
                  <Route path="affiliation" element={<LazyAdminAffiliation />} />
                  <Route path="promo-codes" element={<AdminPromoCodes />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="crm" element={<AdminCRM />} />
                  
                  <Route path="kyc" element={<LazyAdminKYC />} />
                  <Route path="settings" element={<LazyAdminSettings />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="payouts" element={<AdminPayouts />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="waitlists" element={<AdminWaitlists />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="experiments" element={<AdminExperiments />} />
                  <Route path="webhooks" element={<AdminWebhooks />} />
                  <Route path="popups" element={<AdminPopups />} />
                  <Route path="viral-tools" element={<AdminViralTools />} />
                  <Route path="offerings" element={<AdminOfferings />} />
                  <Route path="programs" element={<AdminPrograms />} />
                  <Route path="programs/new" element={<AdminPrograms />} />
                  <Route path="programs/:id/edit" element={<AdminProgramForm />} />
                  <Route path="learner-progress" element={<AdminLearnerProgress />} />
                  {/* AI Studio */}
                  <Route path="studio" element={<StudioHome />} />
                  <Route path="studio/projects" element={<Navigate to="/admin/studio" replace />} />
                  <Route path="studio/projects/new" element={<ProjectWizard />} />
                  <Route path="studio/projects/:id" element={<ProjectOverview />} />
                  <Route path="studio/projects/:id/editor" element={<ProjectEditor />} />
                  <Route path="studio/projects/:id/assets" element={<ProjectAssets />} />
                  <Route path="studio/projects/:id/review" element={<ProjectReviewQualityGate />} />
                  <Route path="studio/projects/:id/publish" element={<ProjectPublishWizard />} />
                  <Route path="studio/jobs" element={<AiJobsQueue />} />
                  <Route path="studio/templates" element={<OrgTemplates />} />
                  <Route path="studio/library" element={<AssetsLibrary />} />
                  </Route>
                </Route>
                {/* Superadmin */}
                <Route path="/superadmin" element={<RequireSuperadmin><SuperadminLayout /></RequireSuperadmin>}>
                  <Route index element={<SuperadminFullDashboard />} />
                  <Route path="orgs" element={<LazySuperadminOrgs />} />
                  <Route path="users" element={<SuperadminUsers />} />
                  <Route path="activity" element={<SuperadminActivityFeed />} />
                  <Route path="kyc" element={<LazySuperadminKYC />} />
                  <Route path="transactions" element={<LazySuperadminTransactions />} />
                  <Route path="reports" element={<LazySuperadminReports />} />
                  <Route path="moderation" element={<Suspense fallback={<PageLoader />}><SuperadminModeration /></Suspense>} />
                  <Route path="metrics" element={<LazySuperadminMetrics />} />
                  <Route path="exports" element={<SuperadminExports />} />
                  <Route path="settings" element={<SuperadminSettings />} />
                  <Route path="investor" element={<SuperadminInvestorSnapshot />} />
                  <Route path="risk" element={<SuperadminRiskAML />} />
                  <Route path="directory" element={<SuperadminDirectory />} />
                  <Route path="emails" element={<SuperadminEmailLogs />} />
                  <Route path="push" element={<SuperadminPush />} />
                  <Route path="support" element={<SuperadminSupport />} />
                  <Route path="settlements" element={<SuperadminSettlements />} />
                  <Route path="partners" element={<SuperadminPartners />} />
                  <Route path="ai" element={<SuperadminAIChat />} />
                  <Route path="command-center" element={<SuperadminCommandCenter />} />
                  <Route path="studio/templates" element={<SuperadminGlobalTemplates />} />
                  <Route path="studio/policies" element={<SuperadminAiPolicies />} />
                  <Route path="studio/jobs" element={<SuperadminGlobalJobs />} />
                  <Route path="studio/abuse-monitor" element={<SuperadminAiAbuse />} />
                  <Route path="health" element={<Suspense fallback={<PageLoader />}><SuperadminHealthDashboard /></Suspense>} />
                  <Route path="ai-history" element={<Suspense fallback={<PageLoader />}><SuperadminAIHistory /></Suspense>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            
            
            </BrowserRouter>
            </ErrorBoundary>
            
          </OrgProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
