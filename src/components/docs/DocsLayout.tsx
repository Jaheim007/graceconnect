import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PanelLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocsNavSection {
  title: string;
  items: { label: string; to: string }[];
}

interface DocsLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  nav: DocsNavSection[];
  searchPlaceholder: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function DocsLayout({
  eyebrow, title, intro, nav, searchPlaceholder, onSearch, searchValue, children, aside,
}: DocsLayoutProps) {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname, hash]);

  const active = useMemo(() => `${pathname}${hash}`, [pathname, hash]);

  const sidebar = (
    <nav className="space-y-7">
      {nav.map((section) => (
        <div key={section.title}>
          <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {section.title}
          </h4>
          <ul className="space-y-0.5 border-l border-border/70">
            {section.items.map((item) => {
              const isActive = active === item.to || (item.to.includes('#') && active.endsWith(item.to.split('#')[1] ? `#${item.to.split('#')[1]}` : '@@'));
              return (
                <li key={item.to + item.label}>
                  <Link
                    to={item.to}
                    className={cn(
                      '-ml-px block border-l-2 py-1.5 pl-3.5 text-[13px] transition-colors',
                      isActive
                        ? 'border-primary font-semibold text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-32 right-1/5 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="container relative px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</p>

          {onSearch && (
            <div className="relative mt-7 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue ?? ''}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container flex gap-10 px-4 py-10 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-10 scrollbar-hide">
            {sidebar}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Button
            variant="outline"
            size="sm"
            className="mb-6 gap-2 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <PanelLeft className="h-4 w-4" /> Sections
          </Button>
          {children}
        </main>

        {aside && (
          <aside className="hidden w-64 shrink-0 xl:block">
            <div className="sticky top-24">{aside}</div>
          </aside>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-xs overflow-y-auto border-r border-border bg-card p-5 shadow-elevated">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-black">Sections</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <LandingFooterCompact />
    </div>
  );
}
