/**
 * Hidden service-vertical routes (Beauty, Home/artisans, Events, Learn/Education).
 *
 * These surfaces are FULLY PRESERVED but hidden from the principal SiteViral
 * experience through `SERVICE_MARKETPLACE_ENABLED` in
 * `@/lib/siteviral/visibility`. Keeping them in this module — instead of inline
 * in `App.tsx` — keeps the main route table limited to the routes that actually
 * serve the product today, while the flag remains the single switch to bring
 * the whole marketplace back.
 *
 * When the flag is OFF each vertical collapses to one catch-all redirect.
 * When the flag is ON the full preserved trees are mounted again.
 */
import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

// ─── Beauty ─── //
const BeautyLanding = lazy(() => import("@/pages/beauty/BeautyLanding"));
const BeautySearch = lazy(() => import("@/pages/beauty/BeautySearch"));
const BeautyProviderProfile = lazy(() => import("@/pages/beauty/BeautyProviderProfile"));
const BeautyProviderOnboarding = lazy(() => import("@/pages/beauty/BeautyProviderOnboarding"));
const BeautyConversation = lazy(() => import("@/pages/beauty/BeautyConversation"));
const BeautyProOverview = lazy(() => import("@/pages/beauty/pro/BeautyProOverview"));
const BeautyProMessagesPane = lazy(() => import("@/pages/beauty/pro/BeautyProMessagesPane"));
const BeautyProConversationPane = lazy(() => import("@/pages/beauty/pro/BeautyProConversationPane"));
const BeautyProOrdersPane = lazy(() => import("@/pages/beauty/pro/BeautyProOrdersPane"));
const BeautyProRevenuePane = lazy(() => import("@/pages/beauty/pro/BeautyProRevenuePane"));
const BeautyProSettingsPane = lazy(() => import("@/pages/beauty/pro/BeautyProSettingsPane"));
const BeautyKYCPage = lazy(() => import("@/pages/beauty/BeautyKYCPage"));

// ─── Home (artisans) ─── //
const HomeLanding = lazy(() => import("@/pages/home/HomeLanding"));
const HomeDiscover = lazy(() => import("@/pages/home/HomeDiscover"));
const HomeProviderPublic = lazy(() => import("@/pages/home/HomeProviderPublic"));
const HomeProviderOnboarding = lazy(() => import("@/pages/home/HomeProviderOnboarding"));
const HomeConversation = lazy(() => import("@/pages/home/HomeConversation"));
const HomeKYCPage = lazy(() => import("@/pages/home/HomeKYCPage"));
const HomeProServices = lazy(() => import("@/pages/home/HomeProServices"));
const HomeProOverview = lazy(() => import("@/pages/home/pro/HomeProOverview"));
const HomeProMessagesPane = lazy(() => import("@/pages/home/pro/HomeProMessagesPane"));
const HomeProConversationPane = lazy(() => import("@/pages/home/pro/HomeProConversationPane"));
const HomeProOrdersPane = lazy(() => import("@/pages/home/pro/HomeProOrdersPane"));
const HomeProRevenuePane = lazy(() => import("@/pages/home/pro/HomeProRevenuePane"));
const HomeProSettingsPane = lazy(() => import("@/pages/home/pro/HomeProSettingsPane"));

// ─── Events (service vendors) ─── //
const EventsLanding = lazy(() => import("@/pages/events/EventsLanding"));
const EventsDiscover = lazy(() => import("@/pages/events/EventsDiscover"));
const EventsProviderPublic = lazy(() => import("@/pages/events/EventsProviderPublic"));
const EventsProviderOnboarding = lazy(() => import("@/pages/events/EventsProviderOnboarding"));
const EventsConversation = lazy(() => import("@/pages/events/EventsConversation"));
const EventsKYCPage = lazy(() => import("@/pages/events/EventsKYCPage"));
const EventsProPackages = lazy(() => import("@/pages/events/EventsProPackages"));
const EventsProOverview = lazy(() => import("@/pages/events/pro/EventsProOverview"));
const EventsProMessagesPane = lazy(() => import("@/pages/events/pro/EventsProMessagesPane"));
const EventsProConversationPane = lazy(() => import("@/pages/events/pro/EventsProConversationPane"));
const EventsProOrdersPane = lazy(() => import("@/pages/events/pro/EventsProOrdersPane"));
const EventsProRevenuePane = lazy(() => import("@/pages/events/pro/EventsProRevenuePane"));
const EventsProSettingsPane = lazy(() => import("@/pages/events/pro/EventsProSettingsPane"));

// ─── Learn (tutors, formerly Education) ─── //
const EducationLanding = lazy(() => import("@/pages/education/EducationLanding"));
const EducationDiscover = lazy(() => import("@/pages/education/EducationDiscover"));
const EducationTutorPublic = lazy(() => import("@/pages/education/EducationTutorPublic"));
const EducationTutorOnboarding = lazy(() => import("@/pages/education/EducationTutorOnboarding"));
const EducationTutorSubjects = lazy(() => import("@/pages/education/EducationTutorSubjects"));
const EducationConversation = lazy(() => import("@/pages/education/EducationConversation"));
const EducationKYCPage = lazy(() => import("@/pages/education/EducationKYCPage"));
const EducationProOverview = lazy(() => import("@/pages/education/pro/EducationProOverview"));
const EducationProMessagesPane = lazy(() => import("@/pages/education/pro/EducationProMessagesPane"));
const EducationProConversationPane = lazy(() => import("@/pages/education/pro/EducationProConversationPane"));
const EducationProOrdersPane = lazy(() => import("@/pages/education/pro/EducationProOrdersPane"));
const EducationProRevenuePane = lazy(() => import("@/pages/education/pro/EducationProRevenuePane"));
const EducationProSettingsPane = lazy(() => import("@/pages/education/pro/EducationProSettingsPane"));

/**
 * Public vertical surfaces. Mounted at the top level of the router.
 * Flag OFF → one catch-all redirect per vertical.
 */
export function hiddenVerticalPublicRoutes() {
  if (!showServiceSurfaces()) {
    return (
      <>
        <Route path="/beauty/*" element={<Navigate to="/" replace />} />
        <Route path="/home/*" element={<Navigate to="/" replace />} />
        <Route path="/events/*" element={<Navigate to="/" replace />} />
        <Route path="/learn/*" element={<Navigate to="/" replace />} />
        <Route path="/education/*" element={<Navigate to="/" replace />} />
      </>
    );
  }

  return (
    <>
      {/* Beauty */}
      <Route path="/beauty" element={<Navigate to="/beauty/search" replace />} />
      <Route path="/beauty/about" element={<BeautyLanding />} />
      <Route path="/beauty/search" element={<BeautySearch />} />
      <Route path="/beauty/p/:slug" element={<BeautyProviderProfile />} />
      <Route path="/beauty/pro/onboarding" element={<BeautyProviderOnboarding />} />
      <Route path="/beauty/*" element={<Navigate to="/beauty/search" replace />} />

      {/* Home (artisans) */}
      <Route path="/home" element={<Navigate to="/home/discover" replace />} />
      <Route path="/home/about" element={<HomeLanding />} />
      <Route path="/home/discover" element={<HomeDiscover />} />
      <Route path="/home/pro/onboarding" element={<HomeProviderOnboarding />} />
      <Route path="/home/pro/:slug" element={<HomeProviderPublic />} />
      <Route path="/home/*" element={<Navigate to="/home/discover" replace />} />

      {/* Events */}
      <Route path="/events" element={<Navigate to="/events/discover" replace />} />
      <Route path="/events/about" element={<EventsLanding />} />
      <Route path="/events/discover" element={<EventsDiscover />} />
      <Route path="/events/pro/onboarding" element={<EventsProviderOnboarding />} />
      <Route path="/events/pro/:slug" element={<EventsProviderPublic />} />
      <Route path="/events/*" element={<Navigate to="/events/discover" replace />} />

      {/* Learn */}
      <Route path="/learn" element={<Navigate to="/learn/discover" replace />} />
      <Route path="/learn/about" element={<EducationLanding />} />
      <Route path="/learn/discover" element={<EducationDiscover />} />
      <Route path="/learn/pro/onboarding" element={<EducationTutorOnboarding />} />
      <Route path="/learn/pro/:slug" element={<EducationTutorPublic />} />
      <Route path="/learn/*" element={<Navigate to="/learn/discover" replace />} />

      {/* Legacy /education aliases → /learn */}
      <Route path="/education" element={<Navigate to="/learn/discover" replace />} />
      <Route path="/education/about" element={<Navigate to="/learn/about" replace />} />
      <Route path="/education/discover" element={<Navigate to="/learn/discover" replace />} />
      <Route path="/education/pro/onboarding" element={<Navigate to="/learn/pro/onboarding" replace />} />
      <Route path="/education/*" element={<Navigate to="/learn/discover" replace />} />
    </>
  );
}

/** Buyer-side vertical conversation panes inside the unified dashboard. */
export function hiddenVerticalDashboardRoutes() {
  if (!showServiceSurfaces()) {
    return <Route path="/dashboard/messages/:vertical/:id" element={<Navigate to="/dashboard/messages" replace />} />;
  }

  return (
    <>
      <Route path="/dashboard/messages/beauty/:id" element={<BeautyConversation />} />
      <Route path="/dashboard/messages/home/:id" element={<HomeConversation />} />
      <Route path="/dashboard/messages/events/:id" element={<EventsConversation />} />
      <Route path="/dashboard/messages/learn/:id" element={<EducationConversation />} />
    </>
  );
}

/** Provider-side vertical workspaces. Relative paths — mounted under /admin. */
export function hiddenVerticalAdminRoutes() {
  if (!showServiceSurfaces()) {
    return (
      <>
        <Route path="beauty/*" element={<Navigate to="/admin" replace />} />
        <Route path="home/*" element={<Navigate to="/admin" replace />} />
        <Route path="events-service/*" element={<Navigate to="/admin" replace />} />
        <Route path="learn/*" element={<Navigate to="/admin" replace />} />
      </>
    );
  }

  return (
    <>
      <Route path="beauty" element={<BeautyProOverview />} />
      <Route path="beauty/messages" element={<BeautyProMessagesPane />}>
        <Route path=":id" element={<BeautyProConversationPane />} />
      </Route>
      <Route path="beauty/orders" element={<BeautyProOrdersPane />} />
      <Route path="beauty/revenue" element={<BeautyProRevenuePane />} />
      <Route path="beauty/settings" element={<BeautyProSettingsPane />} />
      <Route path="beauty/kyc" element={<BeautyKYCPage />} />

      <Route path="home" element={<HomeProOverview />} />
      <Route path="home/messages" element={<HomeProMessagesPane />}>
        <Route path=":id" element={<HomeProConversationPane />} />
      </Route>
      <Route path="home/orders" element={<HomeProOrdersPane />} />
      <Route path="home/revenue" element={<HomeProRevenuePane />} />
      <Route path="home/settings" element={<HomeProSettingsPane />} />
      <Route path="home/services" element={<HomeProServices />} />
      <Route path="home/kyc" element={<HomeKYCPage />} />

      <Route path="events-service" element={<EventsProOverview />} />
      <Route path="events-service/messages" element={<EventsProMessagesPane />}>
        <Route path=":id" element={<EventsProConversationPane />} />
      </Route>
      <Route path="events-service/orders" element={<EventsProOrdersPane />} />
      <Route path="events-service/revenue" element={<EventsProRevenuePane />} />
      <Route path="events-service/settings" element={<EventsProSettingsPane />} />
      <Route path="events-service/kyc" element={<EventsKYCPage />} />
      <Route path="events-service/packages" element={<EventsProPackages />} />

      <Route path="learn" element={<EducationProOverview />} />
      <Route path="learn/messages" element={<EducationProMessagesPane />}>
        <Route path=":id" element={<EducationProConversationPane />} />
      </Route>
      <Route path="learn/orders" element={<EducationProOrdersPane />} />
      <Route path="learn/revenue" element={<EducationProRevenuePane />} />
      <Route path="learn/settings" element={<EducationProSettingsPane />} />
      <Route path="learn/kyc" element={<EducationKYCPage />} />
      <Route path="learn/subjects" element={<EducationTutorSubjects />} />
    </>
  );
}
