import { createContext, useContext, useEffect, useState, startTransition, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-safe: render the default on the server, apply the saved theme after
  // hydration (the __root.tsx head script already sets the class pre-paint,
  // so there is no visual flash).
  const [theme, setTheme] = useState<Theme>('light');

  // Track whether user has explicitly chosen a theme
  const [userOverride, setUserOverride] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gc_theme') as Theme | null;
    if (saved) {
      startTransition(() => {
        setTheme(saved);
        setUserOverride(true);
      });
    }
  }, []);

  // Apply theme to DOM + PWA theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);

    // Update PWA status bar / title bar color
    const themeColor = theme === 'dark' ? '#09090b' : '#ffffff';
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = themeColor;

    // Also update apple-status-bar for iOS PWA
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleMeta);
    }
    appleMeta.content = theme === 'dark' ? 'black-translucent' : 'default';
  }, [theme]);

  // Listen for OS theme changes in real-time (e.g. user toggles dark mode on phone)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only follow OS if user hasn't manually overridden
      if (!userOverride) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [userOverride]);

  const toggleTheme = () => {
    setUserOverride(true);
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gc_theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
