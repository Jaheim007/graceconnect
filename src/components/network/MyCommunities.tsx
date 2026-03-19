/**
 * MyCommunities — Horizontal scrollable cards showing orgs the user is a member of
 * (not owner/admin). Displayed at the top of the My Network / Feed page.
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ExternalLink, Shield } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Organization } from '@/types/database';
import { brandUrl } from '@/lib/storageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc } from '@/lib/verifiedLabel';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

export function MyCommunities() {
  const { userOrgs, getRoleFor } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Only show communities where user is NOT owner/admin
  const memberOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role !== 'owner' && role !== 'admin';
  });

  // Fetch member counts for all member orgs
  const orgIds = memberOrgs.map((o) => o.id);
  const { data: memberCounts = {} } = useQuery({
    queryKey: ['community-member-counts', orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return {};
      const counts: Record<string, number> = {};
      for (const id of orgIds) {
        const { count } = await db
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', id);
        counts[id] = count || 0;
      }
      return counts;
    },
    enabled: orgIds.length > 0,
    staleTime: 120_000,
  });

  if (memberOrgs.length === 0) return null;

  const roleLabel = (orgId: string) => {
    const role = getRoleFor(orgId);
    const labels: Record<string, string> = {
      editor: isFr ? 'Éditeur' : 'Editor',
      member: isFr ? 'Membre' : 'Member',
      affiliate: isFr ? 'Ambassadeur' : 'Ambassador',
    };
    return labels[role || 'member'] || labels.member;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-sm">{isFr ? 'Mes communautés' : 'My Communities'}</h2>
          <p className="text-[11px] text-muted-foreground">
            {memberOrgs.length} {memberOrgs.length > 1 ? (isFr ? 'communautés rejointes' : 'communities joined') : (isFr ? 'communauté rejointe' : 'community joined')}
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {memberOrgs.map((org, i) => (
          <CommunityCard
            key={org.id}
            org={org}
            role={roleLabel(org.id)}
            memberCount={memberCounts[org.id] || 0}
            index={i}
            onClick={() => navigate(`/org/${org.slug}`)}
          />
        ))}
      </div>
    </section>
  );
}

function CommunityCard({
  org,
  role,
  memberCount,
  index,
  onClick,
}: {
  org: Organization;
  role: string;
  memberCount: number;
  index: number;
  onClick: () => void;
}) {
  const logo = brandUrl(org.logo_url);
  const initials = org.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const verified = isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status);
  const coverUrl = brandUrl((org as any).cover_image_url);

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onClick}
      className={cn(
        'shrink-0 w-56 sm:w-64 rounded-2xl border border-border bg-card overflow-hidden',
        'shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300',
        'text-left group focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Cover / gradient header */}
      <div className="relative h-20 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />

        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-5 left-4">
          <div className="h-12 w-12 rounded-xl overflow-hidden ring-3 ring-card shadow-md">
            {logo ? (
              <img src={logo} alt={org.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-7 px-4 pb-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm truncate">{org.name}</h3>
          {verified && <VerifiedBadge size="xs" showTooltip={false} />}
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Shield className="h-2.5 w-2.5" />
            {role}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="h-2.5 w-2.5" />
            {memberCount}
          </span>
        </div>

        {org.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {org.description}
          </p>
        )}

        <div className="flex items-center gap-1 text-[11px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <ExternalLink className="h-3 w-3" />
          Visit
        </div>
      </div>
    </motion.button>
  );
}
