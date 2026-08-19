import { useEffect, useState } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { RouteContentSkeleton } from '@/components/layout/RouteFallback';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves legacy / short product links to their canonical org URL.
 * Handles /p/:key, /produit/:key and /product/:key where :key is a slug or an id.
 */
export default function ProductShortLinkPage() {
  const { key } = useParams<{ key: string }>();
  const { search, hash } = useLocation();
  const [target, setTarget] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!key) { setNotFound(true); return; }

    (async () => {
      const select = 'id, slug, organization_id, organizations!inner(slug)';
      let row: any = null;

      const bySlug = await db.from('digital_products').select(select).eq('slug', key).limit(1).maybeSingle();
      row = bySlug.data;

      if (!row && UUID_RE.test(key)) {
        const byId = await db.from('digital_products').select(select).eq('id', key).limit(1).maybeSingle();
        row = byId.data;
      }

      if (cancelled) return;

      const orgSlug = row?.organizations?.slug;
      if (row && orgSlug) {
        const tail = row.slug ? `p/${row.slug}` : `product/${row.id}`;
        setTarget(`/org/${orgSlug}/${tail}${search}${hash}`);
      } else {
        setNotFound(true);
      }
    })();

    return () => { cancelled = true; };
  }, [key, search, hash]);

  if (target) return <Navigate to={target} replace />;
  if (notFound) return <Navigate to={`/discover${search}`} replace />;
  return <RouteContentSkeleton />;
}
