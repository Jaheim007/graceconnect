import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

const HIDE_NAV_ROUTES = ['/auth', '/reels'];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const hideNav = HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      {!hideNav && (
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {!hideNav && <TopBar />}
        <main className={`flex-1 ${!hideNav ? 'pb-20 lg:pb-0' : ''}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
