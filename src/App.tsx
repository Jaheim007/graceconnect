import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { I18nProvider } from "@/i18n/I18nContext";

// Layout (always loaded)
import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RequireAuth, RequireSuperadmin, RequireOrgManage } from "@/components/layout/RouteGuard";
import { GDPRBanner } from "@/components/layout/GDPRBanner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { SkipLink } from "@/components/layout/SkipLink";

// Lazy-loaded fallback — branded splash
const PageLoader = () => (
  <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="text-lg font-extrabold text-primary tracking-tight">SV</span>
      </div>
      <div className="absolute inset-0 h-12 w-12 rounded-2xl border-2 border-primary/40 border-t-primary animate-spin" />
    </div>
    <p className="text-xs text-muted-foreground font-medium animate-pulse">Chargement…</p>
  </div>
);

// ─── Lazy-loaded pages ─── //
// Public
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage"));
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
const CampaignDetailPage = lazy(() => import("@/pages/CampaignDetailPage"));
const ProgramsPage = lazy(() => import("@/pages/ProgramsPage"));

// Authenticated
const FeedPage = lazy(() => import("@/pages/FeedPage"));
const ReelsPage = lazy(() => import("@/pages/ReelsPage"));
const WatchPage = lazy(() => import("@/pages/WatchPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage"));
const CreateOrgPage = lazy(() => import("@/pages/CreateOrgPage"));
const ProgramViewPage = lazy(() => import("@/pages/ProgramViewPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));
const AffiliationPage = lazy(() => import("@/pages/AffiliationPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));
const CertificatesPage = lazy(() => import("@/pages/CertificatesPage"));
const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
const NotificationPreferencesPage = lazy(() => import("@/pages/NotificationPreferencesPage"));

// Admin
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminMedia = lazy(() => import("@/pages/admin/AdminMedia"));
const AdminMediaForm = lazy(() => import("@/pages/admin/AdminMediaForm").then(m => ({ default: m.MediaForm })));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminCRM = lazy(() => import("@/pages/admin/AdminCRM"));
const AdminPrograms = lazy(() => import("@/pages/admin/AdminPrograms"));
const AdminPromoCodes = lazy(() => import("@/pages/admin/AdminPromoCodes"));
const AdminPhotos = lazy(() => import("@/pages/admin/AdminPhotos"));
const AdminPayouts = lazy(() => import("@/pages/admin/AdminPayouts"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminWaitlists = lazy(() => import("@/pages/admin/AdminWaitlists"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminAnnouncementForm = lazy(() => import("@/pages/admin/AdminAnnouncementForm").then(m => ({ default: m.AnnouncementForm })));
const AdminEventForm = lazy(() => import("@/pages/admin/AdminEventForm").then(m => ({ default: m.EventForm })));
const AdminCampaignForm = lazy(() => import("@/pages/admin/AdminCampaignForm").then(m => ({ default: m.CampaignForm })));
const AdminProductForm = lazy(() => import("@/pages/admin/AdminProductForm").then(m => ({ default: m.ProductForm })));

// Superadmin
const SuperadminLayout = lazy(() => import("@/pages/superadmin/SuperadminLayout"));
const SuperadminFullDashboard = lazy(() => import("@/pages/superadmin/SuperadminFullDashboard"));
const SuperadminAIChat = lazy(() => import("@/pages/superadmin/SuperadminAIChat"));
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
const LazySuperadminTransactions = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminTransactions })));
const LazySuperadminReports = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminReports })));
const LazySuperadminMetrics = lazy(() => import("@/pages/superadmin/SuperadminPages").then(m => ({ default: m.SuperadminMetrics })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
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
              <FeedbackWidget />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
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
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/invite/:code" element={<InvitePage />} />
                <Route path="/install" element={<InstallPage />} />
                <Route path="/discover" element={<AppLayout />}>
                  <Route index element={<DiscoverPage />} />
                </Route>
                <Route path="/marketplace" element={<AppLayout />}>
                  <Route index element={<DiscoverPage />} />
                </Route>
                <Route path="/programs" element={<AppLayout />}>
                  <Route index element={<ProgramsPage />} />
                </Route>

                {/* Org public pages */}
                <Route path="/org/:slug" element={<OrgPublicPage />} />
                <Route path="/org/:slug/content" element={<OrgPublicPage />} />
                <Route path="/org/:slug/events" element={<OrgPublicPage />} />
                <Route path="/org/:slug/store" element={<OrgPublicPage />} />
                <Route path="/org/:slug/donate" element={<OrgPublicPage />} />
                <Route path="/org/:slug/photos" element={<OrgPublicPage />} />
                <Route path="/org/:slug/product/:productId" element={<ProductDetailPage />} />
                <Route path="/org/:slug/p/:productSlug" element={<ProductDetailPage />} />
                <Route path="/campaign/:campaignId" element={<CampaignDetailPage />} />

                {/* Authenticated shell */}
                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/reels/:id" element={<ReelsPage />} />
                  <Route path="/watch/:id" element={<WatchPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/notification-preferences" element={<NotificationPreferencesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/create-org" element={<CreateOrgPage />} />
                  <Route path="/programs/:id" element={<ProgramViewPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/affiliation" element={<AffiliationPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                </Route>

                {/* Admin */}
                <Route path="/admin" element={<RequireOrgManage><AdminLayout /></RequireOrgManage>}>
                  <Route index element={<AdminDashboard />} />
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
                  <Route path="programs" element={<AdminPrograms />} />
                  <Route path="kyc" element={<LazyAdminKYC />} />
                  <Route path="settings" element={<LazyAdminSettings />} />
                  <Route path="payouts" element={<AdminPayouts />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="waitlists" element={<AdminWaitlists />} />
                  <Route path="notifications" element={<AdminNotifications />} />
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
                  <Route path="metrics" element={<LazySuperadminMetrics />} />
                  <Route path="exports" element={<SuperadminExports />} />
                  <Route path="settings" element={<SuperadminSettings />} />
                  <Route path="investor" element={<SuperadminInvestorSnapshot />} />
                  <Route path="risk" element={<SuperadminRiskAML />} />
                  <Route path="directory" element={<SuperadminDirectory />} />
                  <Route path="emails" element={<SuperadminEmailLogs />} />
                  <Route path="push" element={<SuperadminPush />} />
                  <Route path="support" element={<SuperadminSupport />} />
                  <Route path="ai" element={<SuperadminAIChat />} />
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
