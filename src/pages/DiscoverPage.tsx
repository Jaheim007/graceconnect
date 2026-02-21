import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrgCard } from '@/components/org/OrgCard';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePublicOrgs } from '@/hooks/useOrganizations';
import { OrgCategory } from '@/types/database';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

const CATEGORIES: { value: OrgCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'church', label: '⛪ Church' },
  { value: 'ministry', label: '🙏 Ministry' },
  { value: 'leader', label: '⭐ Leader' },
  { value: 'ngo', label: '🌍 NGO' },
  { value: 'community', label: '👥 Community' },
  { value: 'other', label: '🔷 Other' },
];

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<OrgCategory | ''>('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs } = useOrg();

  const { data, isLoading } = usePublicOrgs({ search, category, page });
  const orgs = data?.orgs || [];
  const total = data?.total || 0;
  const pageSize = 12;

  // Only show "Create org" CTA if user is logged in AND doesn't already own/manage an org
  const userOwnsOrg = userOrgs.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="hero-gradient py-10 px-4 border-b border-border/40">
        <div className="container max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Discover Communities</h1>
          <p className="text-muted-foreground text-sm mb-5">
            Find churches, ministries, and faith organizations to join.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-10 h-11 bg-card/80"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6">
        {/* Category filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value); setPage(0); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                category === c.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-gold'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Create org CTA — only show if user is logged in but has no org yet */}
        {user && !userOwnsOrg && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">Create your organization</p>
              <p className="text-xs text-muted-foreground">Launch your community page on Siteviral</p>
            </div>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground border-0 shadow-gold shrink-0"
              onClick={() => navigate('/create-org')}
            >
              + Create
            </Button>
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground mb-4">
            {total} {total === 1 ? 'organization' : 'organizations'} found
            {search && ` for "${search}"`}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <SkeletonList count={9} />
        ) : orgs.length === 0 ? (
          <EmptyState
            variant={search ? 'search' : 'orgs'}
            action={!search ? { label: 'Clear filters', onClick: () => { setCategory(''); setSearch(''); } } : undefined}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orgs.map((org, i) => (
              <OrgCard key={org.id} org={org} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * pageSize >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
