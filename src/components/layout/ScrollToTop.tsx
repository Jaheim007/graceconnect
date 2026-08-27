import { useEffect } from 'react';
import { useLocation } from '@/lib/router-compat';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Scroll both the window and the native main scroll container
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, [pathname]);
  return null;
}
