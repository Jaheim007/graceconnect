import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RequireAuth, RequireSuperadmin, RequireOrgManage } from "@/components/layout/RouteGuard";

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
import AdminPhotos from "@/pages/admin/AdminPhotos";

// Superadmin layout + pages
import SuperadminLayout from "@/pages/superadmin/SuperadminLayout";
import {
  SuperadminDashboard, SuperadminOrgs, SuperadminKYC,
  SuperadminTransactions, SuperadminReports, SuperadminMetrics
} from "@/pages/superadmin/SuperadminPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <OrgProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes — no auth required */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/auth" element={<AuthPage />} />
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
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="crm" element={<AdminCRM />} />
                  <Route path="programs" element={<AdminPrograms />} />
                  <Route path="kyc" element={<AdminKYC />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Superadmin */}
                <Route path="/superadmin" element={<RequireSuperadmin><SuperadminLayout /></RequireSuperadmin>}>
                  <Route index element={<SuperadminDashboard />} />
                  <Route path="orgs" element={<SuperadminOrgs />} />
                  <Route path="kyc" element={<SuperadminKYC />} />
                  <Route path="transactions" element={<SuperadminTransactions />} />
                  <Route path="reports" element={<SuperadminReports />} />
                  <Route path="metrics" element={<SuperadminMetrics />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OrgProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
