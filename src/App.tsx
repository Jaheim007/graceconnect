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
import { GlobalBottomNav } from "@/components/layout/GlobalBottomNav";
import { TrialBillingBanner } from "@/components/billing/TrialBillingBanner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RequireAuth, RequireSuperadmin, RequireOrgManage } from "@/components/layout/RouteGuard";
import { GDPRBanner } from "@/components/layout/GDPRBanner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { SkipLink } from "@/components/layout/SkipLink";
import { ShortcutRedirect } from "@/components/layout/ShortcutRedirect";
import { FloatingProofToast } from "@/components/social-proof/FloatingProofToast";
import { DomainRouter } from "@/components/layout/DomainRouter";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { NativePushBootstrap } from "@/components/pwa/NativePushBootstrap";

/** Redirect /store/:slug → /org/:slug/store */
function StoreRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/org/${slug}/store`} replace />;
}

function IdRedirect({ toBase }: { toBase: string }) {
  const { id } = useParams();
  return <Navigate to={id ? `${toBase}/${id}` : toBase} replace />;
}

// Lazy-loaded fallback — branded splash
const PageLoader = () => (
  <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="h-14 w-14 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background shadow-lg shadow-primary/10">
        <img src="/logo-s.png" alt="Siteviral logo loading" className="h-9 w-9 object-contain animate-pulse" />
      </div>
      <div className="absolute inset-0 h-14 w-14 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
    <p className="text-xs text-muted-foreground font-medium animate-pulse">Chargement…</p>
  </div>
);

// ─── Lazy-loaded pages ─── //
// Public
const ActionHub = lazy(() => import("@/pages/ActionHub"));
const BeautyLanding = lazy(() => import("@/pages/beauty/BeautyLanding"));
const BeautyActionHub = lazy(() => import("@/pages/beauty/BeautyActionHub"));
const BeautyProviderOnboarding = lazy(() => import("@/pages/beauty/BeautyProviderOnboarding"));
const BeautySearch = lazy(() => import("@/pages/beauty/BeautySearch"));
const BeautyProviderProfile = lazy(() => import("@/pages/beauty/BeautyProviderProfile"));

const BeautyBookingDetail = lazy(() => import("@/pages/beauty/BeautyBookingDetail"));
const BeautyConversation = lazy(() => import("@/pages/beauty/BeautyConversation"));
const BeautyProOverview = lazy(() => import("@/pages/beauty/pro/BeautyProOverview"));
const BeautyProMessagesPane = lazy(() => import("@/pages/beauty/pro/BeautyProMessagesPane"));
const BeautyProConversationPane = lazy(() => import("@/pages/beauty/pro/BeautyProConversationPane"));
const BeautyProOrdersPane = lazy(() => import("@/pages/beauty/pro/BeautyProOrdersPane"));
const BeautyProRevenuePane = lazy(() => import("@/pages/beauty/pro/BeautyProRevenuePane"));
const BeautyProSettingsPane = lazy(() => import("@/pages/beauty/pro/BeautyProSettingsPane"));
const BeautyKYCPage = lazy(() => import("@/pages/beauty/BeautyKYCPage"));
// SiteViral Home
const HomeActionHub = lazy(() => import("@/pages/home/HomeActionHub"));
const HomeLanding = lazy(() => import("@/pages/home/HomeLanding"));
const HomeDiscover = lazy(() => import("@/pages/home/HomeDiscover"));
const HomeProviderPublic = lazy(() => import("@/pages/home/HomeProviderPublic"));
const HomeProviderOnboarding = lazy(() => import("@/pages/home/HomeProviderOnboarding"));
const HomeConversation = lazy(() => import("@/pages/home/HomeConversation"));
const HomeKYCPage = lazy(() => import("@/pages/home/HomeKYCPage"));
const HomeProServices = lazy(() => import("@/pages/home/HomeProServices"));
const HomeBookingDetail = lazy(() => import("@/pages/home/HomeBookingDetail"));
// Pro shell (fixated dashboard) — desktop keeps sidebar visible, right pane routes.
const HomeProOverview = lazy(() => import("@/pages/home/pro/HomeProOverview"));
const HomeProMessagesPane = lazy(() => import("@/pages/home/pro/HomeProMessagesPane"));
const HomeProConversationPane = lazy(() => import("@/pages/home/pro/HomeProConversationPane"));
const HomeProOrdersPane = lazy(() => import("@/pages/home/pro/HomeProOrdersPane"));
const HomeProRevenuePane = lazy(() => import("@/pages/home/pro/HomeProRevenuePane"));
const HomeProSettingsPane = lazy(() => import("@/pages/home/pro/HomeProSettingsPane"));
const EventsActionHub = lazy(() => import("@/pages/events/EventsActionHub"));
const EventsLanding = lazy(() => import("@/pages/events/EventsLanding"));
const EventsDiscover = lazy(() => import("@/pages/events/EventsDiscover"));
const EventsProviderPublic = lazy(() => import("@/pages/events/EventsProviderPublic"));
const EventsProviderOnboarding = lazy(() => import("@/pages/events/EventsProviderOnboarding"));
const EventsProOverview = lazy(() => import("@/pages/events/pro/EventsProOverview"));
const EventsProMessagesPane = lazy(() => import("@/pages/events/pro/EventsProMessagesPane"));
const EventsProConversationPane = lazy(() => import("@/pages/events/pro/EventsProConversationPane"));
const EventsProOrdersPane = lazy(() => import("@/pages/events/pro/EventsProOrdersPane"));
const EventsProRevenuePane = lazy(() => import("@/pages/events/pro/EventsProRevenuePane"));
const EventsProSettingsPane = lazy(() => import("@/pages/events/pro/EventsProSettingsPane"));
const EventsConversation = lazy(() => import("@/pages/events/EventsConversation"));
const EventsKYCPage = lazy(() => import("@/pages/events/EventsKYCPage"));
const EventsProPackages = lazy(() => import("@/pages/events/EventsProPackages"));
const EventsBookingDetail = lazy(() => import("@/pages/events/EventsBookingDetail"));
const SuperadminEvents = lazy(() => import("@/pages/superadmin/SuperadminEvents"));
const EducationActionHub = lazy(() => import("@/pages/education/EducationActionHub"));
const EducationLanding = lazy(() => import("@/pages/education/EducationLanding"));
const EducationDiscover = lazy(() => import("@/pages/education/EducationDiscover"));
const EducationTutorPublic = lazy(() => import("@/pages/education/EducationTutorPublic"));
const EducationTutorOnboarding = lazy(() => import("@/pages/education/EducationTutorOnboarding"));
const EducationProOverview = lazy(() => import("@/pages/education/pro/EducationProOverview"));
const EducationProMessagesPane = lazy(() => import("@/pages/education/pro/EducationProMessagesPane"));
const EducationProConversationPane = lazy(() => import("@/pages/education/pro/EducationProConversationPane"));
const EducationProOrdersPane = lazy(() => import("@/pages/education/pro/EducationProOrdersPane"));
const EducationProRevenuePane = lazy(() => import("@/pages/education/pro/EducationProRevenuePane"));
const EducationProSettingsPane = lazy(() => import("@/pages/education/pro/EducationProSettingsPane"));
const EducationTutorSubjects = lazy(() => import("@/pages/education/EducationTutorSubjects"));
const EducationKYCPage = lazy(() => import("@/pages/education/EducationKYCPage"));
const EducationConversation = lazy(() => import("@/pages/education/EducationConversation"));
const EducationBookingDetail = lazy(() => import("@/pages/education/EducationBookingDetail"));
const SuperadminEducation = lazy(() => import("@/pages/superadmin/SuperadminEducation"));
// SiteViral Church
const ChurchActionHub = lazy(() => import("@/pages/church/ChurchActionHub"));
const ChurchLanding = lazy(() => import("@/pages/church/ChurchLanding"));

const ChurchOnboarding = lazy(() => import("@/pages/church/ChurchOnboarding"));
const ChurchProDashboard = lazy(() => import("@/pages/church/ChurchProDashboard"));
const ChurchKYCPage = lazy(() => import("@/pages/church/ChurchKYCPage"));
const ChurchPublicProfile = lazy(() => import("@/pages/church/ChurchPublicProfile"));
const ChurchProSectionStub = lazy(() => import("@/pages/church/ChurchProSectionStub"));
const ChurchProSermons = lazy(() => import("@/pages/church/ChurchProSermons"));
const ChurchProSermonDetail = lazy(() => import("@/pages/church/ChurchProSermonDetail"));
const ChurchProGiving = lazy(() => import("@/pages/church/ChurchProGiving"));
const ChurchProCampaigns = lazy(() => import("@/pages/church/ChurchProCampaigns"));
const ChurchProPrayer = lazy(() => import("@/pages/church/ChurchProPrayer"));
const ChurchProAnnouncements = lazy(() => import("@/pages/church/ChurchProAnnouncements"));
const ChurchProEvents = lazy(() => import("@/pages/church/ChurchProEvents"));
const ChurchProTeam = lazy(() => import("@/pages/church/ChurchProTeam"));
const ChurchProSettings = lazy(() => import("@/pages/church/ChurchProSettings"));
const ChurchGivePage = lazy(() => import("@/pages/church/ChurchGivePage"));
const ChurchGiveSuccessPage = lazy(() => import("@/pages/church/ChurchGiveSuccessPage"));
const ChurchSermonPdfBuyPage = lazy(() => import("@/pages/church/ChurchSermonPdfBuyPage"));
const ChurchSermonPdfSuccessPage = lazy(() => import("@/pages/church/ChurchSermonPdfSuccessPage"));
const ChurchProAppointments = lazy(() => import("@/pages/church/ChurchProAppointments"));
const ChurchEventRegisterPage = lazy(() => import("@/pages/church/ChurchEventRegisterPage"));
const SuperAppHub = lazy(() => import("@/pages/SuperAppHub"));
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

/**
 * HiddenSurface — renders a preserved service-marketplace page only while
 * SERVICE_MARKETPLACE_ENABLED is on. Otherwise sends visitors to the hub,
 * so no hidden vertical surface is reachable in the main experience.
 */
function HiddenSurface({ children }: { children: React.ReactNode }) {
  return showServiceSurfaces() ? <>{children}</> : <Navigate to="/" replace />;
}
/** Same guard for workspace/admin vertical panes — falls back to the unified dashboard. */
function HiddenAdmin({ children }: { children: React.ReactNode }) {
  return showServiceSurfaces() ? <>{children}</> : <Navigate to="/admin" replace />;
}

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const ChurchesPage = lazy(() => import("@/pages/ChurchesPage"));
const DashboardPreview = lazy(() => import("@/pages/DashboardPreview"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const OAuthConsent = lazy(() => import("@/pages/OAuthConsent"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage"));
// ServicesPage removed — /services now redirects to /discover
// SpotlightPage consolidated into Discover
const PromoCataloguePage = lazy(() => import("@/pages/promo/PromoCataloguePage"));
const PromoGratuitsPage = lazy(() => import("@/pages/promo/PromoGratuitsPage"));
const PromoStarsPage = lazy(() => import("@/pages/promo/PromoStarsPage"));
const PromoAICreationsPage = lazy(() => import("@/pages/promo/PromoAICreationsPage"));
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
// WelcomeIntentPage removed — ActionHub handles all entry

const ChangelogPage = lazy(() => import("@/pages/ChangelogPage"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const GoRedirectPage = lazy(() => import("@/pages/GoRedirectPage"));
const QuickStartPage = lazy(() => import("@/pages/QuickStartPage"));
const QuickPublishPage = lazy(() => import("@/pages/QuickPublishPage"));
const GagnerPage = lazy(() => import("@/pages/GagnerPage"));
const EcrirePage = lazy(() => import("@/pages/EcrirePage"));
const CreerFormationPage = lazy(() => import("@/pages/CreerFormationPage"));
const VendrePage = lazy(() => import("@/pages/VendrePage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const FoundersPage = lazy(() => import("@/pages/FoundersPage"));
const ComparerPage = lazy(() => import("@/pages/ComparerPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const BillingSuccessPage = lazy(() => import("@/pages/BillingSuccessPage"));
const BillingUsagePage = lazy(() => import("@/pages/BillingUsagePage"));
const ReferralsPage = lazy(() => import("@/pages/ReferralsPage"));
const ShowcasePage = lazy(() => import("@/pages/ShowcasePage"));
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
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const DashboardExplorePage = lazy(() => import("@/pages/dashboard/DashboardExplorePage"));
const PersonalActivityPage = lazy(() => import("@/pages/dashboard/PersonalActivityPage"));
const PersonalMessagesPage = lazy(() => import("@/pages/dashboard/PersonalMessagesPage"));
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
const MyReviewsPage = lazy(() => import("@/pages/MyReviewsPage"));
const UserAnalyticsPage = lazy(() => import("@/pages/UserAnalyticsPage"));
const CreatorAdvancedAnalyticsPage = lazy(() => import("@/pages/CreatorAdvancedAnalyticsPage"));
const CreditsPage = lazy(() => import("@/pages/CreditsPage"));

// Admin
const AdminShell = lazy(() => import("@/pages/admin/AdminShell"));
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
const AdminApiKeys = lazy(() => import("@/pages/admin/AdminApiKeys"));
const AdminMarketplaceTemplates = lazy(() => import("@/pages/admin/AdminMarketplaceTemplates"));
const MarketplaceTemplatesPage = lazy(() => import("@/pages/MarketplaceTemplatesPage"));
const MarketplaceTemplateDetailPage = lazy(() => import("@/pages/MarketplaceTemplateDetailPage"));
const SuperadminMarketplaceModeration = lazy(() => import("@/pages/superadmin/SuperadminMarketplaceModeration"));
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
const SuperadminTrust = lazy(() => import("@/pages/superadmin/SuperadminTrust"));
const AccountTrustPage = lazy(() => import("@/pages/AccountTrustPage"));
const SuperadminGlobalJobs = lazy(() => import("@/pages/superadmin/studio/GlobalAiJobsMonitor"));
const SuperadminAiAbuse = lazy(() => import("@/pages/superadmin/studio/AiAbuseMonitor"));
const SuperadminAIHistory = lazy(() => import("@/pages/superadmin/SuperadminAIHistory"));
const SuperadminAds = lazy(() => import("@/pages/superadmin/SuperadminAds"));
const SuperadminBeauty = lazy(() => import("@/pages/superadmin/SuperadminBeauty"));
const SuperadminChurch = lazy(() => import("@/pages/superadmin/SuperadminChurch"));
const SuperadminHome = lazy(() => import("@/pages/superadmin/SuperadminHome"));
// Wrap lazy components that export named exports
const LazyAdminAnnouncements = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminAnnouncements })));
const LazyAdminEvents = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminEvents })));
const LazyAdminCampaigns = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminCampaigns })));
const LazyAdminProducts = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminProducts })));
const LazyAdminMembers = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminMembers })));
const LazyAdminAffiliation = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminAffiliation })));
const LazyAdminKYC = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminKYC })));
const LazyAdminSettings = lazy(() => import("@/pages/admin/AdminPages").then(m => ({ default: m.AdminSettings })));

const LazyStartSellingPage = lazy(() => import("@/pages/StartSellingPage"));
const LazyStartFinishPage = lazy(() => import("@/pages/start/StartFinishPage"));
const LazyIntentChooserPage = lazy(() => import("@/pages/IntentChooserPage"));
const LazyLookingForPage = lazy(() => import("@/pages/LookingForPage"));

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
              <ReferralCapture />
              <NativePushBootstrap />
              <GDPRBanner />
              <FloatingProofToast />
              <DomainRouter />
              <TrialBillingBanner />
              
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                {/* Root = the "What do you want to do?" action hub. The full landing
                    page stays available at /landing (linked from the hub). */}
                <Route path="/" element={<ActionHub />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/churches" element={<ChurchesPage />} />
                <Route path="/solutions/church" element={<Navigate to="/churches" replace />} />
                <Route path="/explore/digital-products" element={<Navigate to="/discover?type=digital" replace />} />
                {/* Hidden service-marketplace aliases — kept as routes, redirected to
                    digital discovery until SERVICE_MARKETPLACE_ENABLED is flipped on. */}
                <Route path="/explore/artisans" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/beauty" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/coaching" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/tutors" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/music" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/influencers" element={<Navigate to="/discover" replace />} />
                <Route path="/explore/other-services" element={<Navigate to="/discover" replace />} />
                {/* SuperAppHub component preserved; hidden from the main experience. */}
                <Route path="/superapp" element={showServiceSurfaces() ? <SuperAppHub /> : <Navigate to="/" replace />} />
                <Route path="/start" element={<Navigate to="/create-org" replace />} />
                <Route path="/start/details" element={<Navigate to="/create-org" replace />} />
                <Route path="/start/finish" element={showServiceSurfaces() ? <LazyStartFinishPage /> : <Navigate to="/create-org" replace />} />
                <Route path="/start/*" element={<Navigate to="/create-org" replace />} />

                <Route path="/create-org" element={<CreateOrgPage />} />
                <Route path="/start-selling" element={<Navigate to="/create-org" replace />} />
                {/* Buyer/provider intent chooser + interest picker: components kept,
                    hidden from the restored digital-first experience. */}
                <Route path="/welcome-intent" element={showServiceSurfaces() ? <LazyIntentChooserPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/looking-for" element={showServiceSurfaces() ? <LazyLookingForPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/services" element={<Navigate to="/discover" replace />} />
                <Route path="/digital" element={<Navigate to="/discover?type=digital" replace />} />
                <Route path="/digital/about" element={<LandingPage />} />
                <Route path="/hub" element={<Navigate to="/discover" replace />} />
                {/* SiteViral Beauty */}
                <Route path="/beauty" element={<HiddenSurface><Navigate to="/beauty/search" replace /></HiddenSurface>} />
                <Route path="/beauty/about" element={<HiddenSurface><BeautyLanding /></HiddenSurface>} />
                <Route path="/beauty/search" element={<HiddenSurface><BeautySearch /></HiddenSurface>} />
                <Route path="/beauty/p/:slug" element={<HiddenSurface><BeautyProviderProfile /></HiddenSurface>} />
                <Route path="/beauty/book/:serviceId" element={<Navigate to="/beauty/search" replace />} />
                <Route path="/beauty/bookings" element={<Navigate to="/admin/beauty/orders" replace />} />
                <Route path="/beauty/bookings/:id" element={<Navigate to="/admin/beauty/orders" replace />} />
                <Route path="/beauty/messages" element={<Navigate to="/admin/beauty/messages" replace />} />
                <Route path="/beauty/messages/:id" element={<IdRedirect toBase="/admin/beauty/messages" />} />

                <Route path="/beauty/pro/onboarding" element={<HiddenSurface><BeautyProviderOnboarding /></HiddenSurface>} />
                <Route path="/beauty/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/beauty/pro/messages" element={<Navigate to="/admin/beauty/messages" replace />} />
                <Route path="/beauty/pro/messages/:id" element={<IdRedirect toBase="/admin/beauty/messages" />} />
                <Route path="/beauty/pro/orders" element={<Navigate to="/admin/beauty/orders" replace />} />
                <Route path="/beauty/pro/revenue" element={<Navigate to="/admin/beauty/revenue" replace />} />
                <Route path="/beauty/pro/settings" element={<Navigate to="/admin/beauty/settings" replace />} />
                <Route path="/beauty/pro/kyc" element={<Navigate to="/admin/beauty/kyc" replace />} />
                <Route path="/beauty/pro/dashboard" element={<Navigate to="/dashboard" replace />} />
                {/* SiteViral Church */}
                <Route path="/church" element={<Navigate to="/churches" replace />} />
                <Route path="/church/about" element={<ChurchLanding />} />
                <Route path="/church/discover" element={<Navigate to="/churches" replace />} />
                <Route path="/church/pro/onboarding" element={<ChurchOnboarding />} />
                <Route path="/church/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/church/pro/kyc" element={<Navigate to="/admin/church/kyc" replace />} />
                <Route path="/church/pro/sermons" element={<Navigate to="/admin/church/sermons" replace />} />
                <Route path="/church/pro/sermons/:id" element={<IdRedirect toBase="/admin/church/sermons" />} />
                <Route path="/church/pro/giving" element={<Navigate to="/admin/church/giving" replace />} />
                <Route path="/church/pro/campaigns" element={<Navigate to="/admin/church/campaigns" replace />} />
                <Route path="/church/pro/events" element={<Navigate to="/admin/church/events" replace />} />
                <Route path="/church/pro/prayer" element={<Navigate to="/admin/church/prayer" replace />} />
                <Route path="/church/pro/announcements" element={<Navigate to="/admin/church/announcements" replace />} />
                <Route path="/church/pro/team" element={<Navigate to="/admin/church/team" replace />} />
                <Route path="/church/pro/members" element={<Navigate to="/admin/church/members" replace />} />
                <Route path="/church/pro/settings" element={<Navigate to="/admin/church/settings" replace />} />
                <Route path="/church/pro/appointments" element={<Navigate to="/admin/church/appointments" replace />} />

                <Route path="/church/:slug/events/:eventId" element={<ChurchEventRegisterPage />} />
                <Route path="/church/:slug/give" element={<ChurchGivePage />} />
                <Route path="/church/:slug/give/success" element={<ChurchGiveSuccessPage />} />
                <Route path="/church/:slug/pdf/:pdfId" element={<ChurchSermonPdfBuyPage />} />
                <Route path="/church/:slug/pdf/:pdfId/success" element={<ChurchSermonPdfSuccessPage />} />
                <Route path="/church/:slug" element={<ChurchPublicProfile />} />
                {/* SiteViral Home */}
                <Route path="/home" element={<HiddenSurface><Navigate to="/home/discover" replace /></HiddenSurface>} />
                <Route path="/home/about" element={<HiddenSurface><HomeLanding /></HiddenSurface>} />
                <Route path="/home/discover" element={<HiddenSurface><HomeDiscover /></HiddenSurface>} />
                <Route path="/home/pro/onboarding" element={<HiddenSurface><HomeProviderOnboarding /></HiddenSurface>} />

                <Route path="/home/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/home/pro/messages" element={<Navigate to="/admin/home/messages" replace />} />
                <Route path="/home/pro/messages/:id" element={<IdRedirect toBase="/admin/home/messages" />} />
                <Route path="/home/pro/orders" element={<Navigate to="/admin/home/orders" replace />} />
                <Route path="/home/pro/revenue" element={<Navigate to="/admin/home/revenue" replace />} />
                <Route path="/home/pro/settings" element={<Navigate to="/admin/home/settings" replace />} />
                <Route path="/home/pro/services" element={<Navigate to="/admin/home/services" replace />} />
                <Route path="/home/pro/kyc" element={<Navigate to="/admin/home/kyc" replace />} />

                <Route path="/home/messages" element={<Navigate to="/admin/home/messages" replace />} />
                <Route path="/home/messages/:id" element={<IdRedirect toBase="/admin/home/messages" />} />
                <Route path="/home/bookings" element={<Navigate to="/admin/home/orders" replace />} />
                <Route path="/home/booking/:id" element={<Navigate to="/admin/home/orders" replace />} />
                <Route path="/home/pro/:slug" element={<HiddenSurface><HomeProviderPublic /></HiddenSurface>} />


                {/* SiteViral Events */}
                <Route path="/events" element={<HiddenSurface><Navigate to="/events/discover" replace /></HiddenSurface>} />
                <Route path="/events/about" element={<HiddenSurface><EventsLanding /></HiddenSurface>} />
                <Route path="/events/discover" element={<HiddenSurface><EventsDiscover /></HiddenSurface>} />
                <Route path="/events/pro/onboarding" element={<HiddenSurface><EventsProviderOnboarding /></HiddenSurface>} />
                <Route path="/events/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/events/pro/messages" element={<Navigate to="/admin/events-service/messages" replace />} />
                <Route path="/events/pro/messages/:id" element={<IdRedirect toBase="/admin/events-service/messages" />} />
                <Route path="/events/pro/orders" element={<Navigate to="/admin/events-service/orders" replace />} />
                <Route path="/events/pro/revenue" element={<Navigate to="/admin/events-service/revenue" replace />} />
                <Route path="/events/pro/settings" element={<Navigate to="/admin/events-service/settings" replace />} />
                <Route path="/events/pro/kyc" element={<Navigate to="/admin/events-service/kyc" replace />} />
                <Route path="/events/pro/packages" element={<Navigate to="/admin/events-service/packages" replace />} />
                <Route path="/events/pro/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/events/messages" element={<Navigate to="/admin/events-service/messages" replace />} />
                <Route path="/events/messages/:id" element={<IdRedirect toBase="/admin/events-service/messages" />} />
                <Route path="/events/bookings" element={<Navigate to="/admin/events-service/orders" replace />} />
                <Route path="/events/booking/:id" element={<Navigate to="/admin/events-service/orders" replace />} />

                <Route path="/events/pro/:slug" element={<HiddenSurface><EventsProviderPublic /></HiddenSurface>} />

                {/* SiteViral Learn (formerly Education) */}
                <Route path="/learn" element={<HiddenSurface><Navigate to="/learn/discover" replace /></HiddenSurface>} />
                <Route path="/learn/about" element={<HiddenSurface><EducationLanding /></HiddenSurface>} />
                <Route path="/learn/discover" element={<HiddenSurface><EducationDiscover /></HiddenSurface>} />
                <Route path="/learn/pro/onboarding" element={<HiddenSurface><EducationTutorOnboarding /></HiddenSurface>} />
                <Route path="/learn/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/learn/pro/messages" element={<Navigate to="/admin/learn/messages" replace />} />
                <Route path="/learn/pro/messages/:id" element={<IdRedirect toBase="/admin/learn/messages" />} />
                <Route path="/learn/pro/orders" element={<Navigate to="/admin/learn/orders" replace />} />
                <Route path="/learn/pro/revenue" element={<Navigate to="/admin/learn/revenue" replace />} />
                <Route path="/learn/pro/settings" element={<Navigate to="/admin/learn/settings" replace />} />
                <Route path="/learn/pro/kyc" element={<Navigate to="/admin/learn/kyc" replace />} />
                <Route path="/learn/pro/subjects" element={<Navigate to="/admin/learn/subjects" replace />} />
                <Route path="/learn/pro/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/learn/messages" element={<Navigate to="/admin/learn/messages" replace />} />
                <Route path="/learn/messages/:id" element={<IdRedirect toBase="/admin/learn/messages" />} />
                <Route path="/learn/bookings" element={<Navigate to="/admin/learn/orders" replace />} />
                <Route path="/learn/booking/:id" element={<Navigate to="/admin/learn/orders" replace />} />

                <Route path="/learn/pro/:slug" element={<HiddenSurface><EducationTutorPublic /></HiddenSurface>} />
                {/* Legacy /education aliases */}
                <Route path="/education" element={<HiddenSurface><Navigate to="/learn/discover" replace /></HiddenSurface>} />
                <Route path="/education/about" element={<HiddenSurface><EducationLanding /></HiddenSurface>} />
                <Route path="/education/discover" element={<HiddenSurface><EducationDiscover /></HiddenSurface>} />
                <Route path="/education/pro/onboarding" element={<HiddenSurface><EducationTutorOnboarding /></HiddenSurface>} />
                <Route path="/education/pro" element={<Navigate to="/dashboard" replace />} />
                <Route path="/education/pro/kyc" element={<Navigate to="/admin/learn/kyc" replace />} />
                <Route path="/education/pro/subjects" element={<Navigate to="/admin/learn/subjects" replace />} />
                <Route path="/education/pro/revenue" element={<Navigate to="/admin/learn/revenue" replace />} />

                <Route path="/education/messages" element={<Navigate to="/admin/learn/messages" replace />} />
                <Route path="/education/messages/:id" element={<IdRedirect toBase="/admin/learn/messages" />} />
                <Route path="/education/bookings" element={<Navigate to="/admin/learn/orders" replace />} />
                <Route path="/education/booking/:id" element={<Navigate to="/admin/learn/orders" replace />} />

                <Route path="/education/pro/:slug" element={<HiddenSurface><EducationTutorPublic /></HiddenSurface>} />



                <Route path="/a-propos" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/tarifs" element={<Navigate to="/pricing" replace />} />
                <Route path="/founders" element={<FoundersPage />} />
                <Route path="/fondateurs" element={<Navigate to="/founders" replace />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/billing/success" element={<BillingSuccessPage />} />
                <Route path="/billing/usage" element={<BillingUsagePage />} />
                <Route path="/referrals" element={<RequireAuth><ReferralsPage /></RequireAuth>} />
                <Route path="/parrainage" element={<Navigate to="/referrals" replace />} />
                {/* Legacy / convenience aliases */}
                {/* /my-purchases and /mes-achats moved into the AppLayout group below */}
                <Route path="/mes-achats" element={<Navigate to="/my-purchases" replace />} />

                <Route path="/creator/advanced-analytics" element={<Navigate to="/creator/analytics" replace />} />
                <Route path="/account" element={<Navigate to="/billing" replace />} />
                <Route path="/showcase" element={<ShowcasePage />} />
                <Route path="/top-creators" element={<Navigate to="/showcase" replace />} />
                <Route path="/dashboard-preview" element={<RequireSuperadmin><DashboardPreview /></RequireSuperadmin>} />
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
                <Route path="/comparer" element={<ComparerPage />} />
                <Route path="/compare" element={<ComparerPage />} />
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
                <Route path="/ecrire" element={<EcrirePage />} />
                <Route path="/write" element={<Navigate to="/ecrire" replace />} />
                <Route path="/creer-formation" element={<CreerFormationPage />} />
                <Route path="/create-course" element={<Navigate to="/creer-formation" replace />} />
                <Route path="/vendre" element={<VendrePage />} />
                <Route path="/sell" element={<Navigate to="/vendre" replace />} />
                <Route path="/migrer" element={<Navigate to="/" replace />} />
                <Route path="/migrate" element={<Navigate to="/" replace />} />
                <Route path="/vendre" element={<Navigate to="/" replace />} />
                <Route path="/sell" element={<Navigate to="/" replace />} />
                <Route path="/protection" element={<Navigate to="/security" replace />} />
                <Route path="/explorer" element={<Navigate to="/discover" replace />} />
                <Route path="/hub" element={<Navigate to="/discover" replace />} />
                <Route path="/store/:slug" element={<StoreRedirect />} />
                {/* Discover — uses AdaptiveLayout (sidebar when logged in) */}
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/marketplace/templates" element={<MarketplaceTemplatesPage />} />
                <Route path="/marketplace/templates/:id" element={<MarketplaceTemplateDetailPage />} />

                {/* Public / Buyer Universe — uses PublicLayout (minimal chrome) */}
                <Route element={<PublicLayout />}>
                  <Route path="/spotlight" element={<Navigate to="/discover" replace />} />
                  <Route path="/promo/catalogue" element={<PromoCataloguePage />} />
                  <Route path="/promo/gratuits" element={<PromoGratuitsPage />} />
                  <Route path="/promo/stars" element={<PromoStarsPage />} />
                  <Route path="/promo/ai-creations" element={<PromoAICreationsPage />} />
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

                {/* /welcome now redirects to home — unified ActionHub */}
                <Route path="/welcome" element={<Navigate to="/" replace />} />

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
                  <Route path="/dashboard/home"       element={<DashboardRouter />} />
                  <Route path="/dashboard/activity"   element={<PersonalActivityPage />} />
                  <Route path="/dashboard/earn"       element={<Navigate to="/gagner" replace />} />
                  <Route path="/dashboard/profile"    element={<ProfilePage />} />
                  <Route path="/dashboard/settings/modules" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="/dashboard/digital" element={<Navigate to="/admin/products" replace />} />
                  <Route path="/dashboard/orders" element={<Navigate to="/dashboard/activity" replace />} />
                  <Route path="/dashboard/kyc" element={<Navigate to="/admin/kyc" replace />} />
                  <Route path="/dashboard/affiliation" element={<Navigate to="/admin/affiliation" replace />} />
                  <Route path="/dashboard/messages" element={<PersonalMessagesPage />} />
                  <Route path="/dashboard/messages/beauty/:id" element={<BeautyConversation />} />
                  <Route path="/dashboard/messages/home/:id" element={<HomeConversation />} />
                  <Route path="/dashboard/messages/events/:id" element={<EventsConversation />} />
                  <Route path="/dashboard/messages/learn/:id" element={<EducationConversation />} />
                  <Route path="/dashboard/notifications" element={<Navigate to="/notifications" replace />} />
                  <Route path="/dashboard/settings" element={<Navigate to="/admin/settings" replace />} />
                  {/* Sidebar aliases → canonical pages */}
                  <Route path="/dashboard/purchases"  element={<Navigate to="/dashboard/activity?tab=purchases" replace />} />
                  <Route path="/dashboard/products"   element={<Navigate to="/admin/products" replace />} />
                  <Route path="/dashboard/promotions" element={<Navigate to="/admin/promo-codes" replace />} />
                  <Route path="/dashboard/explore"    element={<DashboardExplorePage />} />
                  <Route path="/dashboard/claim"      element={<Navigate to="/admin/affiliation" replace />} />
                  <Route path="/dashboard/revenue"    element={<Navigate to="/admin/sales" replace />} />
                  <Route path="/quick-start" element={<QuickStartPage />} />
                  <Route path="/quick-publish" element={<QuickPublishPage />} />
                  {/* /create-org is public (moved above); auth prompted at final step */}
                  {/* Legacy type/goals onboarding retired — everything happens in /create-org + unified dashboard */}
                  <Route path="/onboarding/type" element={<Navigate to="/admin" replace />} />
                  <Route path="/onboarding/goals" element={<Navigate to="/admin" replace />} />
                  
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/affiliation" element={<Navigate to="/gagner" replace />} />
                  
                  <Route path="/leaderboard" element={<Navigate to="/gagner" replace />} />
                  
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/wishlist" element={<Navigate to="/bookmarks" replace />} />
                  <Route path="/partner" element={<PartnerPortalPage />} />
                  <Route path="/invoices" element={<MyInvoicesPage />} />
                  <Route path="/my-analytics" element={<UserAnalyticsPage />} />
                  <Route path="/creator/analytics" element={<CreatorAdvancedAnalyticsPage />} />
                  <Route path="/my-programs" element={<MyProgramsPage />} />
                  <Route path="/my-purchases" element={<ResourcesPage />} />


                  <Route path="/my-reviews" element={<MyReviewsPage />} />
                  <Route path="/mes-avis" element={<Navigate to="/my-reviews" replace />} />
                  <Route path="/credits" element={<CreditsPage />} />

                  {/* Admin — inside AppLayout for seamless navigation */}
                  <Route path="/admin" element={<RequireOrgManage><AdminShell /></RequireOrgManage>}>
                  <Route index element={<UserDashboard />} />
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
                  {/* Hidden service-vertical workspaces — code preserved, unreachable */}
                  <Route path="beauty" element={<HiddenAdmin><BeautyProOverview /></HiddenAdmin>} />
                  <Route path="beauty/messages" element={<HiddenAdmin><BeautyProMessagesPane /></HiddenAdmin>}>
                    <Route path=":id" element={<BeautyProConversationPane />} />
                  </Route>
                  <Route path="beauty/orders" element={<HiddenAdmin><BeautyProOrdersPane /></HiddenAdmin>} />
                  <Route path="beauty/revenue" element={<HiddenAdmin><BeautyProRevenuePane /></HiddenAdmin>} />
                  <Route path="beauty/settings" element={<HiddenAdmin><BeautyProSettingsPane /></HiddenAdmin>} />
                  <Route path="beauty/kyc" element={<HiddenAdmin><BeautyKYCPage /></HiddenAdmin>} />
                  <Route path="home" element={<HiddenAdmin><HomeProOverview /></HiddenAdmin>} />
                  <Route path="home/messages" element={<HiddenAdmin><HomeProMessagesPane /></HiddenAdmin>}>
                    <Route path=":id" element={<HomeProConversationPane />} />
                  </Route>
                  <Route path="home/orders" element={<HiddenAdmin><HomeProOrdersPane /></HiddenAdmin>} />
                  <Route path="home/revenue" element={<HiddenAdmin><HomeProRevenuePane /></HiddenAdmin>} />
                  <Route path="home/settings" element={<HiddenAdmin><HomeProSettingsPane /></HiddenAdmin>} />
                  <Route path="home/services" element={<HiddenAdmin><HomeProServices /></HiddenAdmin>} />
                  <Route path="home/kyc" element={<HiddenAdmin><HomeKYCPage /></HiddenAdmin>} />
                  <Route path="events-service" element={<HiddenAdmin><EventsProOverview /></HiddenAdmin>} />
                  <Route path="events-service/messages" element={<HiddenAdmin><EventsProMessagesPane /></HiddenAdmin>}>
                    <Route path=":id" element={<EventsProConversationPane />} />
                  </Route>
                  <Route path="events-service/orders" element={<HiddenAdmin><EventsProOrdersPane /></HiddenAdmin>} />
                  <Route path="events-service/revenue" element={<HiddenAdmin><EventsProRevenuePane /></HiddenAdmin>} />
                  <Route path="events-service/settings" element={<HiddenAdmin><EventsProSettingsPane /></HiddenAdmin>} />
                  <Route path="events-service/kyc" element={<HiddenAdmin><EventsKYCPage /></HiddenAdmin>} />
                  <Route path="events-service/packages" element={<HiddenAdmin><EventsProPackages /></HiddenAdmin>} />
                  <Route path="learn" element={<HiddenAdmin><EducationProOverview /></HiddenAdmin>} />
                  <Route path="learn/messages" element={<HiddenAdmin><EducationProMessagesPane /></HiddenAdmin>}>
                    <Route path=":id" element={<EducationProConversationPane />} />
                  </Route>
                  <Route path="learn/orders" element={<HiddenAdmin><EducationProOrdersPane /></HiddenAdmin>} />
                  <Route path="learn/revenue" element={<HiddenAdmin><EducationProRevenuePane /></HiddenAdmin>} />
                  <Route path="learn/settings" element={<HiddenAdmin><EducationProSettingsPane /></HiddenAdmin>} />
                  <Route path="learn/kyc" element={<HiddenAdmin><EducationKYCPage /></HiddenAdmin>} />
                  <Route path="learn/subjects" element={<HiddenAdmin><EducationTutorSubjects /></HiddenAdmin>} />

                  <Route path="church" element={<ChurchProDashboard />} />
                  <Route path="church/kyc" element={<ChurchKYCPage />} />
                  <Route path="church/sermons" element={<ChurchProSermons />} />
                  <Route path="church/sermons/:id" element={<ChurchProSermonDetail />} />
                  <Route path="church/giving" element={<ChurchProGiving />} />
                  <Route path="church/campaigns" element={<ChurchProCampaigns />} />
                  <Route path="church/events" element={<ChurchProEvents />} />
                  <Route path="church/prayer" element={<ChurchProPrayer />} />
                  <Route path="church/announcements" element={<ChurchProAnnouncements />} />
                  <Route path="church/team" element={<ChurchProTeam />} />
                  <Route path="church/members" element={<ChurchProSectionStub titleFr="Membres & diaspora" titleEn="Members & diaspora" phase="Phase 5" />} />
                  <Route path="church/settings" element={<ChurchProSettings />} />
                  <Route path="church/appointments" element={<ChurchProAppointments />} />
                  <Route path="payouts" element={<AdminPayouts />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="waitlists" element={<AdminWaitlists />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="experiments" element={<AdminExperiments />} />
                  <Route path="webhooks" element={<AdminWebhooks />} />
                  <Route path="api-keys" element={<AdminApiKeys />} />
                  <Route path="marketplace-templates" element={<AdminMarketplaceTemplates />} />
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
                  <Route path="marketplace-moderation" element={<SuperadminMarketplaceModeration />} />
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
                  <Route path="ads" element={<SuperadminAds />} />
                  <Route path="beauty" element={<SuperadminBeauty />} />
                  <Route path="church" element={<SuperadminChurch />} />
                  <Route path="home" element={<SuperadminHome />} />
                  <Route path="events" element={<SuperadminEvents />} />
                  <Route path="education" element={<SuperadminEducation />} />
                  <Route path="trust" element={<SuperadminTrust />} />
                </Route>


                <Route path="/account/trust" element={<AccountTrustPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <GlobalBottomNav />
            
            
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
