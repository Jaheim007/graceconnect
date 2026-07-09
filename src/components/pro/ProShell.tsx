import { NavLink, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type ProNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** exact match only (used for the Overview root item) */
  end?: boolean;
  badge?: number | string;
};

interface ProShellProps {
  /** Vertical brand (short) e.g. "Espace Artisan" */
  title: string;
  subtitle?: string;
  /** Small icon shown next to the title in the sidebar header */
  brandIcon?: ReactNode;
  /** Gradient class for the sidebar brand square, e.g. "from-sky-500 to-emerald-500" */
  brandGradient?: string;
  items: ProNavItem[];
  /** Optional footer inside the sidebar (e.g. share public page CTA) */
  footer?: ReactNode;
}

/**
 * ProShell — "fixated" pro dashboard layout.
 *
 * Desktop (lg+): sticky sidebar on the left, routed content on the right via <Outlet />.
 * Mobile / tablet: sidebar collapses; child routes render full-width so the existing
 * mobile pages keep their native feel and the bottom nav still owns navigation.
 */
export function ProShell({ title, subtitle, brandIcon, brandGradient, items, footer }: ProShellProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex sticky top-14 h-[calc(100dvh-3.5rem)] w-64 shrink-0 flex-col border-r border-border/60 bg-card/40">
          <div className="flex items-center gap-3 px-5 pb-4 pt-6">
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm bg-gradient-to-br",
                brandGradient ?? "from-primary to-primary/70",
              )}
            >
              {brandIcon}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-black leading-tight">{title}</div>
              {subtitle && (
                <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-all",
                              isActive ? "bg-primary" : "bg-transparent",
                            )}
                          />
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-primary" : "text-current",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.badge != null && item.badge !== 0 && (
                            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {footer && (
            <div className="border-t border-border/60 p-3">{footer}</div>
          )}
        </aside>

        {/* Right pane — content */}
        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
