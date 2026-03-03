import { Outlet } from 'react-router-dom';
import { PublicTopBar } from './PublicTopBar';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';

/**
 * PublicLayout — Universe 1: Buyer / Public
 * Minimal chrome: logo, login, footer. No sidebar, no bottom nav, no commission language.
 */
export function PublicLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicTopBar />
      <main id="main-content" role="main" className="flex-1">
        <Outlet />
      </main>
      <LandingFooterCompact />
    </div>
  );
}
