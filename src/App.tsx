import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { I18nProvider } from "@/i18n/I18nContext";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RequireAuth, RequireSuperadmin, RequireOrgManage } from "@/components/layout/RouteGuard";
import { GDPRBanner } from "@/components/layout/GDPRBanner";

// Public pages
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DiscoverPage from "@/pages/DiscoverPage";
import OrgPublicPage from "@/pages/OrgPublicPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import NotFound from "@/pages/NotFound";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AboutPage from "@/pages/AboutPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import AMLPage from "@/pages/AMLPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";
import PayoutPolicyPage from "@/pages/PayoutPolicyPage";
import AcceptableUsePage from "@/pages/AcceptableUsePage";
import InvitePage from "@/pages/InvitePage";
import InstallPage from "@/pages/InstallPage";
import FAQPage from "@/pages/FAQPage";
import ContactPage from "@/pages/ContactPage";
import CompliancePage from "@/pages/CompliancePage";
import DPAPage from "@/pages/DPAPage";

// Authenticated pages
import FeedPage from "@/pages/FeedPage";
import ReelsPage from "@/pages/ReelsPage";
import WatchPage from "@/pages/WatchPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProfilePage from "@/pages/ProfilePage";
import UserDashboard from "@/pages/UserDashboard";
import ResourcesPage from "@/pages/ResourcesPage";
import CreateOrgPage from "@/pages/CreateOrgPage";
// MarketplacePage merged into DiscoverPage
import ProgramsPage from "@/pages/ProgramsPage";
import ProgramViewPage from "@/pages/ProgramViewPage";
import SupportPage from "@/pages/SupportPage";

// Admin layout + pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMedia from "@/pages/admin/AdminMedia";
import { MediaForm } from "@/pages/admin/AdminMediaForm";
import {
  AdminAnnouncements, AdminEvents, AdminCampaigns, AdminProducts,
  AdminMembers, AdminAffiliation, AdminKYC, AdminSettings
} from "@/pages/admin/AdminPages";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminCRM from "@/pages/admin/AdminCRM";
import AdminPrograms from "@/pages/admin/AdminPrograms";
import { AnnouncementForm } from "@/pages/admin/AdminAnnouncementForm";
import { EventForm } from "@/pages/admin/AdminEventForm";
import { CampaignForm } from "@/pages/admin/AdminCampaignForm";
import { ProductForm } from "@/pages/admin/AdminProductForm";
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes";
import AdminPhotos from "@/pages/admin/AdminPhotos";
import AdminPayouts from "@/pages/admin/AdminPayouts";

// Superadmin layout + pages
import SuperadminLayout from "@/pages/superadmin/SuperadminLayout";
import {
  SuperadminOrgs, SuperadminKYC,
  SuperadminTransactions, SuperadminReports, SuperadminMetrics
} from "@/pages/superadmin/SuperadminPages";
import SuperadminFullDashboard from "@/pages/superadmin/SuperadminFullDashboard";
import SuperadminAIChat from "@/pages/superadmin/SuperadminAIChat";
import SuperadminUsers from "@/pages/superadmin/SuperadminUsers";
import SuperadminActivityFeed from "@/pages/superadmin/SuperadminActivityFeed";
import SuperadminSettings from "@/pages/superadmin/SuperadminSettings";
import SuperadminExports from "@/pages/superadmin/SuperadminExports";
import SuperadminInvestorSnapshot from "@/pages/superadmin/SuperadminInvestorSnapshot";
import SuperadminRiskAML from "@/pages/superadmin/SuperadminRiskAML";
import SuperadminDirectory from "@/pages/superadmin/SuperadminDirectory";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

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
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <GDPRBanner />
              <FeedbackWidget />
              <Routes>
                {/* Public routes — no auth required */}
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

                {/* Authenticated shell (sidebar + topbar) */}
                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/reels/:id" element={<ReelsPage />} />
                  <Route path="/watch/:id" element={<WatchPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/create-org" element={<CreateOrgPage />} />
                  <Route path="/programs/:id" element={<ProgramViewPage />} />
                  <Route path="/support" element={<SupportPage />} />
                </Route>

                {/* Admin (org-scoped) */}
                <Route path="/admin" element={<RequireOrgManage><AdminLayout /></RequireOrgManage>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="media/new" element={<MediaForm />} />
                  <Route path="media/:id/edit" element={<MediaForm />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="announcements/new" element={<AnnouncementForm />} />
                  <Route path="announcements/:id/edit" element={<AnnouncementForm />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="events/new" element={<EventForm />} />
                  <Route path="events/:id/edit" element={<EventForm />} />
                  <Route path="campaigns" element={<AdminCampaigns />} />
                  <Route path="campaigns/new" element={<CampaignForm />} />
                  <Route path="campaigns/:id/edit" element={<CampaignForm />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="members" element={<AdminMembers />} />
                  <Route path="photos" element={<AdminPhotos />} />
                  <Route path="affiliation" element={<AdminAffiliation />} />
                  <Route path="promo-codes" element={<AdminPromoCodes />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="crm" element={<AdminCRM />} />
                  <Route path="programs" element={<AdminPrograms />} />
                  <Route path="kyc" element={<AdminKYC />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="payouts" element={<AdminPayouts />} />
                </Route>

                {/* Superadmin */}
                <Route path="/superadmin" element={<RequireSuperadmin><SuperadminLayout /></RequireSuperadmin>}>
                  <Route index element={<SuperadminFullDashboard />} />
                  <Route path="orgs" element={<SuperadminOrgs />} />
                  <Route path="users" element={<SuperadminUsers />} />
                  <Route path="activity" element={<SuperadminActivityFeed />} />
                  <Route path="kyc" element={<SuperadminKYC />} />
                  <Route path="transactions" element={<SuperadminTransactions />} />
                  <Route path="reports" element={<SuperadminReports />} />
                  <Route path="metrics" element={<SuperadminMetrics />} />
                  <Route path="exports" element={<SuperadminExports />} />
                  <Route path="settings" element={<SuperadminSettings />} />
                  <Route path="investor" element={<SuperadminInvestorSnapshot />} />
                  <Route path="risk" element={<SuperadminRiskAML />} />
                  <Route path="directory" element={<SuperadminDirectory />} />
                  <Route path="ai" element={<SuperadminAIChat />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OrgProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
