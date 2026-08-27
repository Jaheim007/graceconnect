import { Link, useLocation } from '@/lib/router-compat';
import { ChevronRight, Home } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { jsonLdSchemas } from '@/lib/jsonLdSchemas';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  /** Inject JSON-LD BreadcrumbList structured data */
  withJsonLd?: boolean;
  className?: string;
}

/**
 * BreadcrumbNav — Accessible breadcrumb with optional JSON-LD.
 *
 * Usage:
 *   <BreadcrumbNav items={[
 *     { label: 'Accueil', href: '/' },
 *     { label: 'Marketplace', href: '/marketplace' },
 *     { label: 'Mon produit' },
 *   ]} />
 */
export function BreadcrumbNav({ items, withJsonLd = true, className }: BreadcrumbNavProps) {
  const { pathname } = useLocation();

  const jsonLd = withJsonLd
    ? jsonLdSchemas.breadcrumb(
        items
          .filter((i) => i.href)
          .map((i) => ({ name: i.label, url: i.href! }))
          .concat([{ name: items[items.length - 1].label, url: pathname }]),
      )
    : undefined;

  return (
    <>
      {jsonLd && <SEOHead title="" jsonLd={jsonLd} />}
      <nav aria-label="Fil d'Ariane" className={className}>
        <ol className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                {i === 0 && <Home className="h-3 w-3 shrink-0" />}
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                {isLast || !item.href ? (
                  <span className={isLast ? 'font-medium text-foreground truncate max-w-[200px]' : 'truncate max-w-[150px]'} aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
