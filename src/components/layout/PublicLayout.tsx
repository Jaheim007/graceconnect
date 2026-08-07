import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicTopBar } from './PublicTopBar';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { RouteContentSkeleton } from './RouteFallback';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';


/**
 * PublicLayout — Universe 1: Buyer / Public
 * Minimal chrome: logo, login, footer. No sidebar, no bottom nav, no commission language.
 */
export function PublicLayout() {
  const nativeApp = isNativePlatform();

  return (
    <div className={cn('flex flex-col bg-background', nativeApp ? 'native-public-screen' : 'min-h-[100dvh]')}>
      <PublicTopBar />
      <main
        id="main-content"
        role="main"
        className={cn(
          'flex-1 min-h-0',
          nativeApp && 'native-main-scroll no-bottom-nav overflow-y-auto overflow-x-hidden overscroll-contain'
        )}
      >
        <Suspense fallback={<RouteContentSkeleton />}>
          <Outlet />
        </Suspense>

      </main>
      {!nativeApp && <LandingFooterCompact />}
    </div>
  );
}
